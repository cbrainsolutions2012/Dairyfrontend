import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../commonemp.scss';
import axios from 'axios';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

function ExpenseForm() {
  const tableRef = useRef(null);
  const token = localStorage.getItem('token');

  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    ExpName: '',
    Amount: '',
    Date: '',
    BankName: '',
    Note: '',
    TransactionId: '',
    ChequeNo: '',
    DDNo: '',
    PaymentType: ''
  });
  const [apiError, setApiError] = useState({});
  const [tableData, setTableData] = useState([]);
  const [allTableData, setAllTableData] = useState([]); // Store all data for search/filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching

    if (value === '') {
      setTableData(allTableData); // Show all data if search term is empty
    } else {
      const filteredData = allTableData.filter(
        (item) =>
          (item.ExpName || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.BankName || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.Note || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.PaymentType || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.Amount || '').toString().toLowerCase().includes(value.toLowerCase())
      );
      setTableData(filteredData);
    }
  };

  const handleExportToExcel = () => {
    console.log('excel');
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // Remove the "Action" column from the cloned table
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    if (headers[actionIndex]) headers[actionIndex].remove(); // header remove

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) cells[actionIndex].remove();
    });

    // Convert the modified table to a workbook and export
    const wb = utils.table_to_book(clonedTable);
    writeFile(wb, 'Expense_Data.xlsx');
  };

  const handleExportToPDF = () => {
    console.log('pdf');

    // get table
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // remove action field
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    if (headers[actionIndex]) headers[actionIndex].remove(); // remove header

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) cells[actionIndex].remove();
    });

    // Append cloned table in body
    clonedTable.style.position = 'absolute';
    clonedTable.style.top = '-9999px';
    document.body.appendChild(clonedTable);

    html2canvas(clonedTable).then((canvas) => {
      document.body.removeChild(clonedTable); // Remove the cloned table after capturing

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Expense_data.pdf');
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.ExpName) newErrors.ExpName = 'Expense name is required';
    if (!formData.Amount) newErrors.Amount = 'Amount is required';
    // if (!formData.Date) newErrors.Date = 'Date is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        let response;
        if (isEditing && editingExpenseId) {
          // Update existing expense
          response = await axios.put(`https://api.mytemplesoftware.in/api/expenses/${editingExpenseId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Create new expense
          response = await axios.post('https://api.mytemplesoftware.in/api/expenses', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }

        if (response.data.success) {
          setFormData({
            ExpName: '',
            Amount: '',
            Date: '',
            BankName: '',
            Note: '',
            TransactionId: '',
            ChequeNo: '',
            DDNo: '',
            PaymentType: ''
          });
          setErrors({});
          setApiError('');
          setIsEditing(false);
          setEditingExpenseId(null);
          const message = isEditing ? 'Expense updated successfully' : 'Expense added successfully';
          alert(message);
          fetchTableData();
        }
      } catch (error) {
        console.error('Error submitting expense:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setApiError(error.response.data.message);
        } else {
          const action = isEditing ? 'update' : 'add';
          setApiError(`Failed to ${action} expense. Please try again.`);
        }
      }
    } else {
      setErrors(formErrors);
    }
  };

  // Handle edit expense
  const handleEditExpense = async (expenseId) => {
    try {
      const response = await axios.get(`https://api.mytemplesoftware.in/api/expenses/${expenseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.data) {
        const expense = response.data.data;
        setFormData({
          ExpName: expense.ExpName,
          Amount: expense.Amount,
          Date: expense.Date ? new Date(expense.Date).toISOString().split('T')[0] : '',
          BankName: expense.BankName || '',
          Note: expense.Note || '',
          TransactionId: expense.TransactionId || '',
          ChequeNo: expense.ChequeNo || '',
          DDNo: expense.DDNo || '',
          PaymentType: expense.PaymentType || ''
        });
        setIsEditing(true);
        setEditingExpenseId(expenseId);
        setErrors({});
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching expense for edit:', error);
      alert('Failed to load expense data for editing.');
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await axios.delete(`https://api.mytemplesoftware.in/api/expenses/${expenseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          alert('Expense deleted successfully');
          fetchTableData();
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(`Failed to delete expense: ${error.response.data.message}`);
        } else {
          alert('Failed to delete expense. Please try again.');
        }
      }
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setFormData({
      ExpName: '',
      Amount: '',
      Date: '',
      BankName: '',
      Note: '',
      TransactionId: '',
      ChequeNo: '',
      DDNo: '',
      PaymentType: ''
    });
    setIsEditing(false);
    setEditingExpenseId(null);
    setErrors({});
    setApiError('');
  };

  const fetchTableData = useCallback(async () => {
    try {
      const response = await axios.get('https://api.mytemplesoftware.in/api/expenses', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const data = response.data.data || [];
        setAllTableData(data); // Store all data for search/filter
        setTableData(data); // Set current display data
      }
    } catch (error) {
      console.error('Error fetching expense data:', error);
      setAllTableData([]);
      setTableData([]);
    }
  }, [token]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  console.log(tableData);

  // console.log(Array.isArray(tableData)); // Should log true

  // Pagination calculations
  const totalItems = tableData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = tableData.slice(startIndex, endIndex);

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisible - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12} style={{ display: 'flex', justifyContent: 'center' }}>
        <Card style={{ width: '600px' }}>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'खर्च संपादन' : 'खर्च प्रकार'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            {isEditing && (
              <div className="alert alert-info m-3" style={{ marginBottom: '15px' }}>
                <strong>संपादन मोड:</strong> खर्च माहिती संपादित करत आहात. बदल करा आणि &quot;खर्च अपडेट करा&quot; वर क्लिक करा.
              </div>
            )}
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ExpName">खर्चाचे नाव</label>
                  <input type="text" name="ExpName" value={formData.ExpName} onChange={handleChange} />
                  {errors.ExpName && <span className="error">{errors.ExpName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Amount">रक्कम</label>
                  <input type="number" name="Amount" value={formData.Amount} onChange={handleChange} step="0.01" />
                  {errors.Amount && <span className="error">{errors.Amount}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Date">दिनांक</label>
                  <input type="date" name="Date" value={formData.Date} onChange={handleChange} />
                  {errors.Date && <span className="error">{errors.Date}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="BankName">बँकेचे नाव</label>
                  <input type="text" name="BankName" value={formData.BankName} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Note">नोंद</label>
                  <textarea name="Note" rows={3} value={formData.Note} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="TransactionId">लेन-देन आयडी</label>
                  <input type="text" name="TransactionId" value={formData.TransactionId} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ChequeNo">चेक क्रमांक</label>
                  <input type="text" name="ChequeNo" value={formData.ChequeNo} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="DDNo">डीडी क्रमांक</label>
                  <input type="text" name="DDNo" value={formData.DDNo} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="PaymentType">भुगतान प्रकार</label>
                  <select name="PaymentType" value={formData.PaymentType} onChange={handleChange}>
                    <option value="">-- निवडा --</option>
                    <option value="cash">नगद</option>
                    <option value="cheque">चेक</option>
                    <option value="dd">डीडी</option>
                    <option value="online">ऑनलाइन</option>
                    <option value="card">कार्ड</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <Button type="submit" variant="primary">
                  {isEditing ? 'खर्च अपडेट करा' : 'खर्च जोडा'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="secondary" onClick={handleCancelEdit} className="ms-2">
                    रद्द करा
                  </Button>
                )}
              </div>
            </form>
            {apiError && typeof apiError === 'string' && <div className="error">{apiError}</div>}
          </Card.Body>
        </Card>
      </Col>
      {/*</Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">खर्च</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" value={searchTerm} placeholder="Search" onChange={handleSearchChange} className="me-2" />

                <Button variant="success" onClick={handleExportToExcel} className="me-2">
                  Excel
                </Button>
                <Button variant="danger" onClick={handleExportToPDF}>
                  PDF
                </Button>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-card" style={{ height: '362px' }}>
              <PerfectScrollbar>
                <Table responsive ref={tableRef}>
                  <thead>
                    <tr>
                      <th>खर्चाचे नाव</th>
                      <th>रक्कम</th>
                      <th>दिनांक</th>
                      <th>बँकेचे नाव</th>
                      <th>नोंद</th>
                      <th>तयार केले</th>
                      <th>कारवाई</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentData) && currentData.length > 0 ? (
                      currentData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.ExpName}</td>
                          <td>₹{item.Amount}</td>
                          <td>{item.Date ? new Date(item.Date).toLocaleDateString() : 'N/A'}</td>
                          <td>{item.BankName || 'N/A'}</td>
                          <td>{item.Note || 'N/A'}</td>
                          <td>{item.CreatedByUsername || 'N/A'}</td>
                          <td>
                            <Button variant="primary" size="sm" className="me-2" onClick={() => handleEditExpense(item.Id)}>
                              <FaEdit />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteExpense(item.Id)}>
                              <FaTrashAlt />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center' }}>
                          No expenses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>

            {/* Pagination Info */}
            <div className="d-flex justify-content-between align-items-center mt-3 px-3 pb-3">
              <div className="pagination-info">
                <small className="text-muted">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                  {searchTerm && ` (filtered from ${allTableData.length} total entries)`}
                </small>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-controls d-flex align-items-center">
                  <Button variant="outline-secondary" size="sm" onClick={handlePrevPage} disabled={currentPage === 1} className="me-2">
                    Previous
                  </Button>

                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="me-1"
                    >
                      {pageNum}
                    </Button>
                  ))}

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="ms-1"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
}

export default ExpenseForm;
