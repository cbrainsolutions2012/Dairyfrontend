import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import axios from 'axios';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import '../commonemp.scss';

function SellersPayment() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentsData, setPaymentsData] = useState([]);
  const [allPaymentsData, setAllPaymentsData] = useState([]);
  const [sellersData, setSellersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSellerDetails, setSelectedSellerDetails] = useState(null);

  const [formData, setFormData] = useState({
    sellerId: '',
    paymentAmount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentType: 'cash',
    transactionId: '',
    bankName: '',
    chequeNumber: '',
    ddNumber: '',
    referenceNumber: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'https://dairyapi.demotest.in.net';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    };
  };
  // Add this function to fetch seller details when seller is selected
  const fetchSellerDetails = async (sellerId) => {
    if (!sellerId) {
      setSelectedSellerDetails(null);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/sellers/${sellerId}?includeTransactions=true`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        setSelectedSellerDetails(res.data.data.seller);
      }
    } catch (error) {
      console.error('Error fetching seller details:', error);
      setSelectedSellerDetails(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Fetch seller details when seller is selected
    if (name === 'sellerId' && value) {
      fetchSellerDetails(value);
    } else if (name === 'sellerId' && !value) {
      setSelectedSellerDetails(null);
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);

    if (value === '') {
      setPaymentsData(allPaymentsData);
    } else {
      const filteredData = allPaymentsData.filter(
        (p) =>
          (p.SellerName || '').toLowerCase().includes(value.toLowerCase()) ||
          (p.PaymentType || '').toLowerCase().includes(value.toLowerCase()) ||
          (p.PaymentAmount || '').toString().includes(value)
      );
      setPaymentsData(filteredData);
    }
  };

  const handleClearForm = () => {
    setFormData({
      sellerId: '',
      paymentAmount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentType: 'cash',
      transactionId: '',
      bankName: '',
      chequeNumber: '',
      ddNumber: '',
      referenceNumber: '',
      notes: ''
    });
    setIsEditing(false);
    setEditingPaymentId(null);
    setErrors({});
    setApiError('');
    setSelectedSellerDetails(null);
  };

  const handleEditPayment = (payment) => {
    setFormData({
      sellerId: payment.SellerId || '',
      paymentAmount: payment.PaymentAmount || '',
      paymentDate: payment.PaymentDate ? payment.PaymentDate.split('T')[0] : '',
      paymentType: payment.PaymentType || 'cash',
      transactionId: payment.TransactionId || '',
      bankName: payment.BankName || '',
      chequeNumber: payment.ChequeNumber || '',
      ddNumber: payment.DdNumber || '',
      referenceNumber: payment.ReferenceNumber || '',
      notes: payment.Notes || ''
    });
    setIsEditing(true);
    setEditingPaymentId(payment.Id);
    window.scrollTo(0, 0);
  };

  const fetchPaymentsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/sellerpayments`, { headers: getAuthHeaders() });
      if (res.data.success) {
        const data = res.data.data.payments || [];
        setAllPaymentsData(data);
        setPaymentsData(data);
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching payments data:', error);
      setApiError('Failed to fetch payments data.');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  const fetchSellersData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sellers`, { headers: getAuthHeaders() });
      if (res.data.success) {
        setSellersData(res.data.data.sellers || []);
      }
    } catch (error) {
      console.error('Error fetching sellers data:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPaymentsData();
    fetchSellersData();
  }, [fetchPaymentsData, fetchSellersData]);

  const validate = () => {
    const newErrors = {};
    if (!formData.sellerId) newErrors.sellerId = 'Seller is required';
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0)
      newErrors.paymentAmount = 'Payment amount must be a positive number';
    if (!formData.paymentDate) newErrors.paymentDate = 'Date is required';
    if (formData.paymentType === 'cheque' && !formData.chequeNumber) newErrors.chequeNumber = 'Cheque number is required';
    if (formData.paymentType === 'dd' && !formData.ddNumber) newErrors.ddNumber = 'DD number is required';
    if ((formData.paymentType === 'cheque' || formData.paymentType === 'dd') && !formData.bankName)
      newErrors.bankName = 'Bank name is required';
    if (formData.paymentType === 'online' && !formData.transactionId) newErrors.transactionId = 'Transaction ID is required';
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
        await axios.put(`${API_URL}/api/sellerpayments/${editingPaymentId}`, formData, { headers: getAuthHeaders() });
        alert('Payment updated successfully!');
      } else {
        await axios.post(`${API_URL}/api/sellerpayments`, formData, { headers: getAuthHeaders() });
        alert('Payment added successfully!');
      }
      handleClearForm();
      fetchPaymentsData();
    } catch (error) {
      console.error('Error submitting form:', error);
      setApiError(error.response?.data?.message || 'Failed to save payment.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id, sellerName, date) => {
    if (window.confirm(`Are you sure you want to delete this payment for "${sellerName}" on ${date}?`)) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/sellerpayments/${id}`, { headers: getAuthHeaders() });
      alert('Payment deleted successfully!');
      fetchPaymentsData();
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Failed to delete payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    if (!Array.isArray(paymentsData) || paymentsData.length === 0) {
      alert('No data available to export');
      return;
    }
    setIsExportingExcel(true);
    try {
      const excelData = paymentsData.map((item, index) => ({
        'Sr. No.': index + 1,
        'Seller Name': item.SellerName || 'N/A',
        'Payment Date': item.PaymentDate ? new Date(item.PaymentDate).toLocaleDateString('en-IN') : 'N/A',
        'Amount (₹)': item.PaymentAmount || 0,
        'Payment Type': item.PaymentType || 'N/A',
        Details: item.TransactionId || item.ChequeNumber || item.DdNumber || 'N/A',
        'Bank Name': item.BankName || 'N/A'
      }));
      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();
      ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 }];
      utils.book_append_sheet(wb, ws, 'Seller Payments');
      const filename = `SellerPayments_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.xlsx`;
      writeFile(wb, filename);
      alert(`✅ Excel Export Successful!\nFile: ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`❌ Export Failed: ${error.message}`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportToPDF = async () => {
    if (!Array.isArray(paymentsData) || paymentsData.length === 0) {
      alert('No data available to export');
      return;
    }
    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Seller Payments Report', 105, 20, { align: 'center' });
      const headers = [['Sr.', 'Seller Name', 'Date', 'Amount (₹)', 'Type', 'Details']];
      const data = paymentsData.map((item, index) => [
        index + 1,
        item.SellerName || 'N/A',
        item.PaymentDate ? new Date(item.PaymentDate).toLocaleDateString('en-IN') : 'N/A',
        item.PaymentAmount || 0,
        item.PaymentType || 'N/A',
        item.TransactionId || item.ChequeNumber || item.DdNumber || 'N/A'
      ]);
      pdf.autoTable({
        startY: 30,
        head: headers,
        body: data,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
      const filename = `SellerPayments_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.pdf`;
      pdf.save(filename);
      alert(`✅ PDF Export Successful!\nFile: ${filename}`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(`❌ PDF Export Failed: ${error.message}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const totalItems = paymentsData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = paymentsData.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
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
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'Edit Seller Payment' : 'Add New Seller Payment'}
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
                  <label>Seller *</label>
                  <select name="sellerId" value={formData.sellerId} onChange={handleChange} disabled={loading}>
                    <option value="">Select Seller</option>
                    {sellersData.map((s) => (
                      <option key={s.Id} value={s.Id}>
                        {s.FullName}
                      </option>
                    ))}
                  </select>
                  {errors.sellerId && <span className="error">{errors.sellerId}</span>}
                </div>
                <div className="form-group">
                  <label>Payment Amount *</label>
                  <input
                    type="number"
                    name="paymentAmount"
                    value={formData.paymentAmount}
                    onChange={handleChange}
                    placeholder="e.g., 5000"
                    disabled={loading}
                  />
                  {errors.paymentAmount && <span className="error">{errors.paymentAmount}</span>}
                </div>
              </div>
              {/* Add this section right after the first form-row */}
              {selectedSellerDetails && (
                <div className="form-row">
                  <div className="form-group" style={{ width: '100%' }}>
                    <div
                      className="seller-info-card"
                      style={{
                        background: '#fff5f5',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        padding: '15px',
                        marginTop: '10px'
                      }}
                    >
                      <h6 style={{ marginBottom: '10px', color: '#721c24' }}>{selectedSellerDetails.FullName} - Payment Summary</h6>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ minWidth: '120px', marginBottom: '5px' }}>
                          <small style={{ color: '#6c757d' }}>Total Business:</small>
                          <div style={{ fontWeight: 'bold' }}>₹{selectedSellerDetails.milkTransactions?.totalAmount || 0}</div>
                        </div>
                        <div style={{ minWidth: '120px', marginBottom: '5px' }}>
                          <small style={{ color: '#6c757d' }}>Total Paid:</small>
                          <div style={{ fontWeight: 'bold', color: '#dc3545' }}>₹{selectedSellerDetails.payments?.totalPaid || 0}</div>
                        </div>
                        <div style={{ minWidth: '120px', marginBottom: '5px' }}>
                          <small style={{ color: '#6c757d' }}>Outstanding (You Owe):</small>
                          <div
                            style={{
                              fontWeight: 'bold',
                              color: selectedSellerDetails.outstandingAmount > 0 ? '#dc3545' : '#28a745'
                            }}
                          >
                            ₹{selectedSellerDetails.outstandingAmount || 0}
                          </div>
                        </div>
                        {selectedSellerDetails.outstandingAmount > 0 && (
                          <div style={{ minWidth: '120px', marginBottom: '5px' }}>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  paymentAmount: selectedSellerDetails.outstandingAmount
                                })
                              }
                              style={{ fontSize: '12px' }}
                            >
                              Pay Full Outstanding
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Type *</label>
                  <select name="paymentType" value={formData.paymentType} onChange={handleChange} disabled={loading}>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="dd">DD (Demand Draft)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} disabled={loading} />
                  {errors.paymentDate && <span className="error">{errors.paymentDate}</span>}
                </div>
              </div>
              {(formData.paymentType === 'cheque' || formData.paymentType === 'dd') && (
                <div className="form-row">
                  {formData.paymentType === 'cheque' && (
                    <div className="form-group">
                      <label>Cheque Number *</label>
                      <input type="text" name="chequeNumber" value={formData.chequeNumber} onChange={handleChange} />
                      {errors.chequeNumber && <span className="error">{errors.chequeNumber}</span>}
                    </div>
                  )}
                  {formData.paymentType === 'dd' && (
                    <div className="form-group">
                      <label>DD Number *</label>
                      <input type="text" name="ddNumber" value={formData.ddNumber} onChange={handleChange} />
                      {errors.ddNumber && <span className="error">{errors.ddNumber}</span>}
                    </div>
                  )}
                  <div className="form-group">
                    <label>Bank Name *</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} />
                    {errors.bankName && <span className="error">{errors.bankName}</span>}
                  </div>
                </div>
              )}
              {(formData.paymentType === 'online' || formData.paymentType === 'bank_transfer') && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Transaction ID *</label>
                    <input type="text" name="transactionId" value={formData.transactionId} onChange={handleChange} />
                    {errors.transactionId && <span className="error">{errors.transactionId}</span>}
                  </div>
                  <div className="form-group">
                    <label>Reference Number</label>
                    <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} />
                  </div>
                </div>
              )}
              <div className="form-row">
                <div className="form-group" style={{ width: '100%' }}>
                  <label>Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Optional notes about the payment"
                  />
                </div>
              </div>
              <div className="form-actions">
                <Button variant="primary" type="submit" disabled={loading} style={{ marginRight: '10px' }}>
                  {loading ? 'Processing...' : isEditing ? 'Update Payment' : 'Add Payment'}
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
                <Card.Title as="h4">Payment Records</Card.Title>
                <small className="text-muted">Total: {paymentsData.length} records</small>
              </Col>
              <Col
                md={8}
                className="d-flex flex-column flex-md-row justify-content-end align-items-stretch align-items-md-center search-filter-bar"
              >
                <Form.Control
                  type="text"
                  placeholder="Search by seller, type, amount..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="mb-2 mb-md-0 me-md-2"
                  style={{ maxWidth: '100%' }}
                />
                <div className="d-flex flex-column flex-sm-row export-buttons">
                  <Button
                    variant="success"
                    onClick={handleExportToExcel}
                    className="me-0 me-sm-2 mb-2 mb-sm-0 d-flex align-items-center justify-content-center"
                    disabled={isExportingExcel || isExportingPDF || paymentsData.length === 0}
                    style={{ minWidth: '120px' }}
                  >
                    {isExportingExcel ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          style={{ width: '16px', height: '16px' }}
                        ></div>{' '}
                        Exporting...
                      </>
                    ) : (
                      <>📊 Excel ({paymentsData.length})</>
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleExportToPDF}
                    className="d-flex align-items-center justify-content-center"
                    disabled={isExportingExcel || isExportingPDF || paymentsData.length === 0}
                    style={{ minWidth: '120px' }}
                  >
                    {isExportingPDF ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          style={{ width: '16px', height: '16px' }}
                        ></div>{' '}
                        Exporting...
                      </>
                    ) : (
                      <>📄 PDF ({paymentsData.length})</>
                    )}
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
                        <th>Sr. No.</th>
                        <th>Seller Name</th>
                        <th>Date</th>
                        <th>Amount (₹)</th>
                        <th>Type</th>
                        <th>Details</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="spinner-border" role="status">
                              <span className="sr-only">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : currentData.length > 0 ? (
                        currentData.map((p, index) => (
                          <tr key={p.Id}>
                            <td>{startIndex + index + 1}</td>
                            <td>{p.SellerName}</td>
                            <td>{new Date(p.PaymentDate).toLocaleDateString('en-IN')}</td>
                            <td>₹{p.PaymentAmount}</td>
                            <td>
                              <span className={`badge bg-primary`}>{p.PaymentType}</span>
                            </td>
                            <td>{p.TransactionId || p.ChequeNumber || p.DdNumber || '-'}</td>
                            <td>
                              <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEditPayment(p)}
                                disabled={loading}
                                title="Edit Payment"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => confirmDelete(p.Id, p.SellerName, new Date(p.PaymentDate).toLocaleDateString('en-IN'))}
                                disabled={loading}
                                title="Delete Payment"
                              >
                                <FaTrashAlt />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            {searchTerm ? 'No records found matching your search.' : 'No payment records found.'}
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
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : currentData.length > 0 ? (
                <div className="mobile-cards-container">
                  {currentData.map((p, index) => (
                    <div key={p.Id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="mobile-card-title">{p.SellerName}</div>
                        <div className="mobile-card-number">#{startIndex + index + 1}</div>
                      </div>
                      <div className="mobile-card-body">
                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Date</div>
                            <div className="mobile-info-value">{new Date(p.PaymentDate).toLocaleDateString('en-IN')}</div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Amount</div>
                            <div className="mobile-info-value highlight">₹{p.PaymentAmount}</div>
                          </div>
                        </div>
                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Type</div>
                            <div className="mobile-info-value">
                              <span className={`badge bg-primary`}>{p.PaymentType}</span>
                            </div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Details</div>
                            <div className="mobile-info-value">{p.TransactionId || p.ChequeNumber || p.DdNumber || '-'}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mobile-card-actions">
                        <Button variant="info" onClick={() => handleEditPayment(p)} disabled={loading} className="mobile-action-btn">
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => confirmDelete(p.Id, p.SellerName, new Date(p.PaymentDate).toLocaleDateString('en-IN'))}
                          disabled={loading}
                          className="mobile-action-btn"
                        >
                          <FaTrashAlt className="me-1" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💸</div>
                  <div className="empty-state-message">
                    {searchTerm ? 'No records found matching your search.' : 'No payment records found.'}
                  </div>
                  {searchTerm && <div className="empty-state-suggestion">Try adjusting your search terms.</div>}
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  <small className="text-muted">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                  </small>
                </div>
                <div className="pagination-controls">
                  <Button variant="outline-secondary" onClick={handlePrevPage} disabled={currentPage === 1} className="pagination-btn">
                    <span className="d-none d-sm-inline">Previous</span>
                    <span className="d-sm-none">Prev</span>
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
                    <span className="d-none d-sm-inline">Next</span>
                    <span className="d-sm-none">Next</span>
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

export default SellersPayment;
