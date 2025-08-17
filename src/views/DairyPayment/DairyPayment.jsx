import React, { useEffect, useRef, useState } from 'react';
import '../commonemp.scss';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const DairyPayment = () => {
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    month: '',
    year: '',
    totalDairyAmount: '',
    paidAmount: '',
    paymentMethod: 'cash',
    transactionId: '',
    bankName: '',
    paymentDate: '',
    remarks: ''
  });

  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [monthlyData, setMonthlyData] = useState({
    totalDairyAmount: 0,
    totalPaid: 0,
    remainingAmount: 0
  });
  const [fetchError, setFetchError] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState({});
  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Prevent mouse wheel from changing number input values
  const preventNumberScroll = (e) => {
    e.target.blur();
  };

  // Get current year and months for dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const fetchMonthlyDairyAmount = async () => {
    if (!formData.month || !formData.year) {
      setFetchError('Please select both month and year first');
      return;
    }

    try {
      setFetchError('');
      const res = await axios.get(`https://api.mytemplesoftware.in/api/dairy-payment/monthly-amount/${formData.year}/${formData.month}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        const data = res.data.data;
        setMonthlyData(data);
        setFormData((prev) => ({
          ...prev,
          totalDairyAmount: data.totalDairyAmount.toString()
        }));

        if (data.totalDairyAmount === 0) {
          setFetchError('No dairy milk distribution found for this month.');
        }
      }
    } catch (error) {
      console.log('Error fetching monthly dairy amount:', error);
      setFetchError('Error fetching monthly data. Please try again.');
      setMonthlyData({
        totalDairyAmount: 0,
        totalPaid: 0,
        remainingAmount: 0
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Check for empty values first
    if (!formData.month || formData.month === '') newErrors.month = 'Month is required';
    if (!formData.year || formData.year === '') newErrors.year = 'Year is required';
    if (!formData.totalDairyAmount || formData.totalDairyAmount === '') {
      newErrors.totalDairyAmount = 'Please fetch monthly data first';
    }
    if (!formData.paidAmount || formData.paidAmount === '') {
      newErrors.paidAmount = 'Paid amount is required';
    }
    if (!formData.paymentDate || formData.paymentDate === '') {
      newErrors.paymentDate = 'Payment date is required';
    }

    // Validate numeric values
    if (formData.paidAmount && (isNaN(parseFloat(formData.paidAmount)) || parseFloat(formData.paidAmount) <= 0)) {
      newErrors.paidAmount = 'Paid amount must be a valid number greater than 0';
    }

    if (formData.totalDairyAmount && isNaN(parseFloat(formData.totalDairyAmount))) {
      newErrors.totalDairyAmount = 'Total dairy amount must be a valid number';
    }

    // Business logic validation
    if (formData.paidAmount && formData.totalDairyAmount) {
      const paidAmount = parseFloat(formData.paidAmount);
      const totalAmount = parseFloat(formData.totalDairyAmount);

      if (paidAmount > totalAmount) {
        newErrors.paidAmount = `Paid amount cannot exceed total dairy amount (₹${totalAmount})`;
      }

      // Check against remaining amount if available
      if (monthlyData.remainingAmount > 0 && paidAmount > monthlyData.remainingAmount) {
        newErrors.paidAmount = `Paid amount cannot exceed remaining amount (₹${monthlyData.remainingAmount})`;
      }
    }

    // Online payment validation
    if (formData.paymentMethod === 'online') {
      if (!formData.transactionId || formData.transactionId.trim() === '') {
        newErrors.transactionId = 'Transaction ID is required for online payment';
      }
      if (!formData.bankName || formData.bankName.trim() === '') {
        newErrors.bankName = 'Bank name is required for online payment';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        // Ensure all values are properly formatted and not NaN
        const monthInt = parseInt(formData.month);
        const yearInt = parseInt(formData.year);
        const totalAmount = parseFloat(formData.totalDairyAmount);
        const paidAmountFloat = parseFloat(formData.paidAmount);

        // Additional validation to prevent NaN values
        if (isNaN(monthInt) || isNaN(yearInt) || isNaN(totalAmount) || isNaN(paidAmountFloat)) {
          setApiError('Invalid numeric values. Please check your inputs.');
          return;
        }

        const submitData = {
          month: monthInt,
          year: yearInt,
          totalDairyAmount: totalAmount,
          paidAmount: paidAmountFloat,
          paymentMethod: formData.paymentMethod,
          transactionId: formData.paymentMethod === 'online' ? formData.transactionId : null,
          bankName: formData.paymentMethod === 'online' ? formData.bankName : null,
          paymentDate: formData.paymentDate,
          remarks: formData.remarks || null
        };

        console.log('Submitting data:', submitData); // Debug log

        let res;
        if (isEditing && editingId) {
          // Update existing record
          res = await axios.put(`https://api.mytemplesoftware.in/api/dairy-payment/${editingId}`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 200) {
            alert('Dairy Payment record updated successfully');
            setIsEditing(false);
            setEditingId(null);
          }
        } else {
          // Add new record
          res = await axios.post(`https://api.mytemplesoftware.in/api/dairy-payment`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 201) {
            alert('Dairy Payment record added successfully');
          }
        }

        setApiError('');
        setErrors({}); // Clear any previous errors
        setFormData({
          month: '',
          year: '',
          totalDairyAmount: '',
          paidAmount: '',
          paymentMethod: 'cash',
          transactionId: '',
          bankName: '',
          paymentDate: '',
          remarks: ''
        });
        setMonthlyData({
          totalDairyAmount: 0,
          totalPaid: 0,
          remainingAmount: 0
        });
        setFetchError('');
        fetchTableData();
      } catch (error) {
        console.error('Error submitting form data:', error);
        console.error('Error response:', error.response?.data);

        // More detailed error handling
        if (error.response?.data?.message) {
          setApiError(error.response.data.message);
        } else if (error.response?.status === 400) {
          setApiError('Invalid data provided. Please check all fields.');
        } else if (error.response?.status === 401) {
          setApiError('Authentication failed. Please login again.');
        } else if (error.response?.status === 500) {
          setApiError('Server error. Please try again later.');
        } else {
          setApiError('Failed to submit data. Please try again.');
        }
      }
    } else {
      setErrors(formErrors);
      setApiError('Please fix the validation errors above.');
    }
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/dairy-payment`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      const data = res.data.data?.payments || [];
      setTableData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setTableData([]);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const handleExportToExcel = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove();
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
    });

    const wb = utils.table_to_book(clonedTable);
    writeFile(wb, 'Dairy_Payment_Data.xlsx');
  };

  const handleExportToPDF = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove();
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
    });

    clonedTable.style.position = 'absolute';
    clonedTable.style.top = '-9999px';
    document.body.appendChild(clonedTable);

    html2canvas(clonedTable).then((canvas) => {
      document.body.removeChild(clonedTable);

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

      pdf.save('Dairy_Payment_Data.pdf');
    });
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this Dairy Payment record?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/dairy-payment/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        alert('Dairy Payment record deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      setApiError('Dairy Payment record not deleted. Please try again.');
      alert('Failed to delete Dairy Payment record. Please try again.');
    }
  };

  const filteredTableData = tableData.filter((item) => {
    return (
      item.PaymentDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.PaymentMethod?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleEdit = async (record) => {
    const formattedDate = record.PaymentDate ? record.PaymentDate.split('T')[0] : '';

    setFormData({
      month: record.Month?.toString().padStart(2, '0') || '',
      year: record.Year?.toString() || '',
      totalDairyAmount: record.TotalDairyAmount?.toString() || '',
      paidAmount: record.PaidAmount?.toString() || '',
      paymentMethod: record.PaymentMethod || 'cash',
      transactionId: record.TransactionId || '',
      bankName: record.BankName || '',
      paymentDate: formattedDate,
      remarks: record.Remarks || ''
    });

    // Fetch fresh monthly data for this month/year
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/dairy-payment/monthly-amount/${record.Year}/${record.Month}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        const data = res.data.data;

        // For editing, we need to exclude the current record's paid amount from validation
        const currentPaidAmount = parseFloat(record.PaidAmount || 0);
        const adjustedTotalPaid = Math.max(0, data.totalPaid - currentPaidAmount);
        const adjustedRemainingAmount = data.totalDairyAmount - adjustedTotalPaid;

        setMonthlyData({
          totalDairyAmount: data.totalDairyAmount,
          totalPaid: adjustedTotalPaid,
          remainingAmount: adjustedRemainingAmount
        });
      }
    } catch (error) {
      console.log('Error fetching monthly data for edit:', error);
      // Fallback to basic calculation
      const totalDairyAmount = parseFloat(record.TotalDairyAmount || 0);

      setMonthlyData({
        totalDairyAmount: totalDairyAmount,
        totalPaid: 0, // We don't know the exact total paid, so allow full amount
        remainingAmount: totalDairyAmount
      });
    }

    setIsEditing(true);
    setEditingId(record.Id);
    setErrors({});
    setFetchError('');
  };

  const handleCancelEdit = () => {
    setFormData({
      month: '',
      year: '',
      totalDairyAmount: '',
      paidAmount: '',
      paymentMethod: 'cash',
      transactionId: '',
      bankName: '',
      paymentDate: '',
      remarks: ''
    });
    setIsEditing(false);
    setEditingId(null);
    setErrors({});
    setFetchError('');
    setMonthlyData({
      totalDairyAmount: 0,
      totalPaid: 0,
      remainingAmount: 0
    });
  };

  return (
    <React.Fragment>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'डेअरी पेमेंट संपादित करा' : 'डेअरी पेमेंट नोंदणी'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="month">महिना</label>
                  <select name="month" value={formData.month} onChange={handleChange}>
                    <option value="">महिना निवडा</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  {errors.month && <span className="error">{errors.month}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="year">वर्ष</label>
                  <select name="year" value={formData.year} onChange={handleChange}>
                    <option value="">वर्ष निवडा</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.year && <span className="error">{errors.year}</span>}
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button type="button" onClick={fetchMonthlyDairyAmount} className="fetch-btn">
                    Fetch Monthly Data
                  </button>
                </div>
              </div>

              {fetchError && (
                <div className="error" style={{ textAlign: 'center', margin: '10px 0', color: '#dc3545' }}>
                  {fetchError}
                </div>
              )}

              {monthlyData.totalDairyAmount > 0 && (
                <div className="milk-summary" style={{ padding: '15px', backgroundColor: '#f8f9fa', margin: '15px', borderRadius: '5px' }}>
                  <h6>
                    Monthly Dairy Summary for {months.find((m) => m.value === formData.month)?.label} {formData.year}:
                  </h6>
                  <Row>
                    <Col md={3}>
                      <strong>Total Amount: ₹{monthlyData.totalDairyAmount}</strong>
                    </Col>
                    <Col md={3}>
                      <strong>Total Paid: ₹{monthlyData.totalPaid}</strong>
                    </Col>
                    <Col md={3}>
                      <strong>Remaining: ₹{monthlyData.remainingAmount}</strong>
                    </Col>
                    <Col md={3}>
                      <strong>Status: {monthlyData.remainingAmount === 0 ? 'Paid' : 'Pending'}</strong>
                    </Col>
                  </Row>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="totalDairyAmount">एकूण डेअरी रक्कम (रुपये)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="totalDairyAmount"
                    value={formData.totalDairyAmount}
                    onChange={handleChange}
                    onWheel={preventNumberScroll}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                  {errors.totalDairyAmount && <span className="error">{errors.totalDairyAmount}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="paidAmount">भरलेली रक्कम (रुपये)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="paidAmount"
                    value={formData.paidAmount}
                    onChange={handleChange}
                    onWheel={preventNumberScroll}
                    max={monthlyData.remainingAmount}
                  />
                  {errors.paidAmount && <span className="error">{errors.paidAmount}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMethod">पेमेंट पद्धती</label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="paymentDate">पेमेंट दिनांक</label>
                  <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} />
                  {errors.paymentDate && <span className="error">{errors.paymentDate}</span>}
                </div>
              </div>

              {formData.paymentMethod === 'online' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="transactionId">Transaction ID</label>
                    <input type="text" name="transactionId" value={formData.transactionId} onChange={handleChange} />
                    {errors.transactionId && <span className="error">{errors.transactionId}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="bankName">बँक नाव</label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} />
                    {errors.bankName && <span className="error">{errors.bankName}</span>}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="remarks">टिप्पणी</label>
                  <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="3"></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">{isEditing ? 'Update' : 'Submit'}</button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="cancel-btn">
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {apiError && typeof apiError === 'string' && <div className="error">{apiError}</div>}
          </Card.Body>
        </Card>
      </Col>

      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">डेअरी पेमेंट यादी</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control
                  type="text"
                  placeholder="Search by Payment Date or Method"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="me-2"
                />
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
                <Table
                  responsive
                  ref={tableRef}
                  className="table-bordered mb-0 text-center"
                  style={{
                    border: '1px solid #dee2e6',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead>
                    <tr>
                      <th>महिना/वर्ष</th>
                      <th>एकूण रक्कम</th>
                      <th>भरलेली रक्कम</th>
                      <th>उर्वरित रक्कम</th>
                      <th>पेमेंट पद्धती</th>
                      <th>Transaction ID</th>
                      <th>बँक नाव</th>
                      <th>पेमेंट दिनांक</th>
                      <th>टिप्पणी</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredTableData) &&
                      filteredTableData.map((item) => (
                        <tr key={item.Id}>
                          <td>
                            {months.find((m) => m.value === item.Month?.toString().padStart(2, '0'))?.label || item.Month}/{item.Year}
                          </td>
                          <td>₹{item.TotalDairyAmount}</td>
                          <td>₹{item.PaidAmount}</td>
                          <td>₹{(parseFloat(item.TotalDairyAmount || 0) - parseFloat(item.PaidAmount || 0)).toFixed(2)}</td>
                          <td>{item.PaymentMethod?.toUpperCase()}</td>
                          <td>{item.TransactionId || '-'}</td>
                          <td>{item.BankName || '-'}</td>
                          <td>{item.PaymentDate ? new Date(item.PaymentDate).toLocaleDateString('en-GB') : ''}</td>
                          <td>{item.Remarks || '-'}</td>
                          <td>
                            <Button className="me-2" variant="primary" onClick={() => handleEdit(item)}>
                              <FaEdit />
                            </Button>
                            <Button variant="danger" onClick={() => confirmDelete(item.Id)}>
                              <FaTrashAlt />
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
};

export default DairyPayment;
