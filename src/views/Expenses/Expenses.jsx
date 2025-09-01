import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import '../commonemp.scss';

function Expenses() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expenseData, setExpenseData] = useState([]);
  const [allExpenseData, setAllExpenseData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialFormState = {
    amount: '',
    description: '',
    paidTo: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://dairyapi.demotest.in.net';

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleClearForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setEditingExpenseId(null);
    setErrors({});
    setApiError('');
  };

  const fetchExpenseData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/expense`, { headers: getAuthHeaders() });
      if (res.data.success) {
        const data = res.data.data.expenses || [];
        setAllExpenseData(data);
        setExpenseData(data);
      }
    } catch (error) {
      console.error('Error fetching expense data:', error);
      setApiError('Failed to fetch expense records.');
    } finally {
      setLoading(false);
    }
  }, [API_URL, getAuthHeaders]);

  useEffect(() => {
    fetchExpenseData();
  }, [fetchExpenseData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be a positive number';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.paidTo.trim()) newErrors.paidTo = 'Paid To is required';
    if (!formData.date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      if (isEditing) {
        await axios.put(`${API_URL}/api/expense/${editingExpenseId}`, formData, { headers: getAuthHeaders() });
        alert('Expense record updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/expense`, formData, { headers: getAuthHeaders() });
        alert('Expense record added successfully!');
      }
      handleClearForm();
      fetchExpenseData();
    } catch (error) {
      console.error('Error submitting expense form:', error);
      setApiError(error.response?.data?.message || 'Failed to save expense record.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense) => {
    setFormData({
      amount: expense.Amount || '',
      description: expense.Description || '',
      paidTo: expense.PaidTo || '',
      category: expense.Category || '',
      date: expense.Date ? expense.Date.split('T')[0] : ''
    });
    setIsEditing(true);
    setEditingExpenseId(expense.Id);
    window.scrollTo(0, 0);
  };

  const confirmDelete = (id, description) => {
    if (window.confirm(`Are you sure you want to delete the expense record for "${description}"?`)) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/expense/${id}`, { headers: getAuthHeaders() });
      alert('Expense record deleted successfully!');
      fetchExpenseData();
    } catch (error) {
      console.error('Error deleting expense record:', error);
      alert('Failed to delete expense record.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    if (value === '') {
      setExpenseData(allExpenseData);
    } else {
      const filteredData = allExpenseData.filter(
        (item) =>
          (item.Description && item.Description.toLowerCase().includes(value.toLowerCase())) ||
          (item.PaidTo && item.PaidTo.toLowerCase().includes(value.toLowerCase())) ||
          (item.Category && item.Category.toLowerCase().includes(value.toLowerCase())) ||
          (item.Amount && item.Amount.toString().includes(value))
      );
      setExpenseData(filteredData);
    }
  };

  const handleExportToExcel = () => {
    if (expenseData.length === 0) return alert('No data to export.');
    setIsExportingExcel(true);
    const excelData = expenseData.map((item, index) => ({
      'Sr. No.': index + 1,
      Date: new Date(item.Date).toLocaleDateString('en-IN'),
      'Paid To': item.PaidTo,
      Category: item.Category,
      Description: item.Description,
      'Amount (₹)': item.Amount
    }));
    const ws = utils.json_to_sheet(excelData);
    const wb = utils.book_new();
    ws['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 18 }, { wch: 40 }, { wch: 15 }];
    utils.book_append_sheet(wb, ws, 'Expense Records');
    writeFile(wb, `ExpenseRecords_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setIsExportingExcel(false);
  };

  const handleExportToPDF = () => {
    if (expenseData.length === 0) return alert('No data to export.');
    setIsExportingPDF(true);
    const doc = new jsPDF();
    doc.text('Expense Records', 14, 16);
    doc.autoTable({
      startY: 20,
      head: [['#', 'Date', 'Paid To', 'Category', 'Description', 'Amount (₹)']],
      body: expenseData.map((item, index) => [
        index + 1,
        new Date(item.Date).toLocaleDateString('en-IN'),
        item.PaidTo,
        item.Category,
        item.Description,
        parseFloat(item.Amount).toFixed(2)
      ])
    });
    doc.save(`ExpenseRecords_${new Date().toISOString().slice(0, 10)}.pdf`);
    setIsExportingPDF(false);
  };

  const totalItems = expenseData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = expenseData.slice(startIndex, endIndex);

  const handlePageChange = (page) => setCurrentPage(page);
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <React.Fragment>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" className="text-center">
              {isEditing ? 'Edit Expense Record' : 'Add Manual Expense'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              {apiError && (
                <div className="form-row">
                  <div className="alert alert-danger">{apiError}</div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Paid To *</label>
                  <input type="text" name="paidTo" value={formData.paidTo} onChange={handleChange} placeholder="e.g., Vendor, Employee" />
                  {errors.paidTo && <span className="error">{errors.paidTo}</span>}
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleChange} placeholder="e.g., 500" />
                  {errors.amount && <span className="error">{errors.amount}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ width: '100%' }}>
                  <label>Description *</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide a brief description of the expense"
                  />
                  {errors.description && <span className="error">{errors.description}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., Office, Milk Purchase"
                  />
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} />
                  {errors.date && <span className="error">{errors.date}</span>}
                </div>
              </div>
              <div className="form-actions">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update Record' : 'Add Record'}
                </Button>
                {isEditing && (
                  <Button variant="secondary" type="button" onClick={handleClearForm} disabled={loading}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>

      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={4} className="mb-3 mb-md-0">
                <Card.Title as="h4">Expense Records</Card.Title>
                <small className="text-muted">Total: {totalItems} records</small>
              </Col>
              <Col
                md={8}
                className="d-flex flex-column flex-md-row justify-content-end align-items-stretch align-items-md-center search-filter-bar"
              >
                <Form.Control
                  type="text"
                  placeholder="Search by paid to, description, category, amount..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="mb-2 mb-md-0 me-md-2"
                />
                <div className="d-flex flex-column flex-sm-row export-buttons">
                  <Button
                    variant="success"
                    onClick={handleExportToExcel}
                    className="me-0 me-sm-2 mb-2 mb-sm-0 d-flex align-items-center justify-content-center"
                    disabled={isExportingExcel || isExportingPDF || expenseData.length === 0}
                    style={{ minWidth: '120px' }}
                  >
                    {isExportingExcel ? 'Exporting...' : `📊 Excel (${totalItems})`}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleExportToPDF}
                    className="d-flex align-items-center justify-content-center"
                    disabled={isExportingExcel || isExportingPDF || expenseData.length === 0}
                    style={{ minWidth: '120px' }}
                  >
                    {isExportingPDF ? 'Exporting...' : `📄 PDF (${totalItems})`}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="d-none d-lg-block">
              <div className="table-card" style={{ height: '400px' }}>
                <PerfectScrollbar>
                  <Table responsive ref={tableRef} className="table-bordered mb-0">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        <th>Paid To</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount (₹)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="spinner-border" />
                          </td>
                        </tr>
                      ) : currentData.length > 0 ? (
                        currentData.map((item, index) => (
                          <tr key={item.Id}>
                            <td>{startIndex + index + 1}</td>
                            <td>{new Date(item.Date).toLocaleDateString('en-IN')}</td>
                            <td>{item.PaidTo}</td>
                            <td>{item.Category}</td>
                            <td>{item.Description}</td>
                            <td>₹{parseFloat(item.Amount).toFixed(2)}</td>
                            <td>
                              <Button variant="info" size="sm" onClick={() => handleEditExpense(item)} className="me-2">
                                <FaEdit />
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => confirmDelete(item.Id, item.Description)}>
                                <FaTrashAlt />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            {searchTerm ? 'No records match your search.' : 'No expense records found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </PerfectScrollbar>
              </div>
            </div>
            <div className="d-lg-none">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" />
                </div>
              ) : currentData.length > 0 ? (
                <div className="mobile-cards-container">
                  {currentData.map((item, index) => (
                    <div key={item.Id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="mobile-card-title">{item.PaidTo}</div>
                        <div className="mobile-card-number">#{startIndex + index + 1}</div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-info-group single">
                          <div className="mobile-info-label">Description</div>
                          <div className="mobile-info-value">{item.Description}</div>
                        </div>
                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Date</div>
                            <div className="mobile-info-value">{new Date(item.Date).toLocaleDateString('en-IN')}</div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Amount</div>
                            <div className="mobile-info-value highlight">₹{parseFloat(item.Amount).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Category</div>
                            <div className="mobile-info-value">{item.Category}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mobile-card-actions">
                        <Button variant="info" onClick={() => handleEditExpense(item)} className="mobile-action-btn">
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button variant="danger" onClick={() => confirmDelete(item.Id, item.Description)} className="mobile-action-btn">
                          <FaTrashAlt className="me-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💸</div>
                  <div className="empty-state-message">{searchTerm ? 'No records match your search.' : 'No expense records found.'}</div>
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  <small className="text-muted">
                    Page {currentPage} of {totalPages}
                  </small>
                </div>
                <div className="pagination-controls">
                  <Button variant="outline-secondary" onClick={handlePrevPage} disabled={currentPage === 1} className="pagination-btn">
                    Prev
                  </Button>
                  <div className="pagination-numbers">
                    {getPageNumbers().map((num) => (
                      <Button
                        key={num}
                        variant={num === currentPage ? 'primary' : 'outline-primary'}
                        onClick={() => handlePageChange(num)}
                        className="pagination-number"
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline-secondary"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
}

export default Expenses;
