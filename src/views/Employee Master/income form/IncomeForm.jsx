import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../commonemp.scss';
import axios from 'axios';

function IncomeForm() {
  const tableRef = useRef(null);
  const token = localStorage.getItem('token');

  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    incomeName: '',
    amount: '',
    bankName: '',
    date: '',
    note: '',
    transactionId: '',
    chequeNo: '',
    ddNo: '',
    paymentType: ''
  });
  const [apiError, setApiError] = useState({});
  const [tableData, setTableData] = useState([]);
  const [allTableData, setAllTableData] = useState([]); // Store all data for search/filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching

    if (value === '') {
      setTableData(allTableData); // Show all data if search term is empty
    } else {
      const filteredData = allTableData.filter(
        (item) =>
          (item.IncomeName || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.BankName || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.Note || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.PaymentType || '').toLowerCase().includes(value.toLowerCase()) ||
          (item.Amount || '').toString().toLowerCase().includes(value.toLowerCase())
      );
      setTableData(filteredData);
    }
  };
  const handleExportToExcel = () => {
    if (!Array.isArray(tableData) || tableData.length === 0) {
      alert('No data available to export');
      return;
    }

    // Prepare data for Excel export
    const excelData = tableData.map((item, index) => ({
      'Sr.No': index + 1,
      'उत्पन्नचे नाव': item.IncomeName || '',
      रक्कम: item.Amount ? `₹${item.Amount}` : '',
      दिनांक: item.Date ? new Date(item.Date).toLocaleDateString() : '',
      'बँकेचे नाव': item.BankName || '',
      'चेक क्रमांक': item.ChequeNo || '',
      'DD क्रमांक': item.DDNo || '',
      'व्यवहार आयडी': item.TransactionId || '',
      'भुगतान प्रकार': item.PaymentType || '',
      नोंद: item.Note || '',
      'तयार केलेले': item.CreatedByName || ''
    }));

    // Create workbook and worksheet
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 8 }, // Sr.No
      { wch: 20 }, // Income Name
      { wch: 12 }, // Amount
      { wch: 12 }, // Date
      { wch: 15 }, // Bank Name
      { wch: 12 }, // Cheque No
      { wch: 12 }, // DD No
      { wch: 15 }, // Transaction ID
      { wch: 12 }, // Payment Type
      { wch: 20 }, // Note
      { wch: 15 } // Created By
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    utils.book_append_sheet(wb, ws, 'Income Data');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Income_Data_${currentDate}.xlsx`;

    // Save the file
    writeFile(wb, filename);
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

      pdf.save('temple-master.pdf');
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.incomeName) newErrors.incomeName = 'Income name is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    // if (!formData.date) newErrors.date = 'Date is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        let response;
        if (isEditing && editingIncomeId) {
          // Update existing income
          response = await axios.put(`https://api.mytemplesoftware.in/api/income/${editingIncomeId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Create new income
          response = await axios.post('https://api.mytemplesoftware.in/api/income', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }

        if (response.data.success) {
          setFormData({
            incomeName: '',
            amount: '',
            date: '',
            bankName: '',
            note: '',
            transactionId: '',
            chequeNo: '',
            ddNo: '',
            paymentType: ''
          });
          setErrors({});
          setApiError('');
          setIsEditing(false);
          setEditingIncomeId(null);
          const message = isEditing ? 'Income updated successfully' : 'Income added successfully';
          alert(message);
          fetchTableData();
        }
      } catch (error) {
        console.error('Error submitting income:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setApiError(error.response.data.message);
        } else {
          const action = isEditing ? 'update' : 'add';
          setApiError(`Failed to ${action} income. Please try again.`);
        }
      }
    } else {
      setErrors(formErrors);
    }
  };

  // Handle edit expense
  const handleEditIncome = async (incomeId) => {
    try {
      const response = await axios.get(`https://api.mytemplesoftware.in/api/income/${incomeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.data) {
        const income = response.data.data;
        setFormData({
          incomeName: income.IncomeName,
          amount: income.Amount,
          date: income.Date ? new Date(income.Date).toISOString().split('T')[0] : '',
          bankName: income.BankName || '',
          note: income.Note || '',
          transactionId: income.TransactionId || '',
          chequeNo: income.ChequeNo || '',
          ddNo: income.DDNo || '',
          paymentType: income.PaymentType || ''
        });
        setIsEditing(true);
        setEditingIncomeId(incomeId);
        setErrors({});
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching income for edit:', error);
      alert('Failed to load income data for editing.');
    }
  };

  // Handle delete income
  const handleDeleteIncome = async (incomeId) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      try {
        const response = await axios.delete(`https://api.mytemplesoftware.in/api/income/${incomeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          alert('Income deleted successfully');
          fetchTableData();
        }
      } catch (error) {
        console.error('Error deleting income:', error);
        if (error.response && error.response.data && error.response.data.message) {
          alert(`Failed to delete income: ${error.response.data.message}`);
        } else {
          alert('Failed to delete income. Please try again.');
        }
      }
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setFormData({
      incomeName: '',
      amount: '',
      date: '',
      bankName: '',
      note: '',
      transactionId: '',
      chequeNo: '',
      ddNo: '',
      paymentType: ''
    });
    setIsEditing(false);
    setEditingIncomeId(null);
    setErrors({});
    setApiError('');
  };

  const fetchTableData = useCallback(async () => {
    try {
      const response = await axios.get('https://api.mytemplesoftware.in/api/income', {
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
            <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'उत्पन्न संपादन' : 'उत्पन्न प्रकार'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            {isEditing && (
              <div className="alert alert-info m-3" style={{ marginBottom: '15px' }}>
                <strong>संपादन मोड:</strong> उत्पन्न माहिती संपादित करत आहात. बदल करा आणि &quot;उत्पन्न अपडेट करा&quot; वर क्लिक करा.
              </div>
            )}
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="incomeName">उत्पन्नाचे नाव</label>
                  <input type="text" name="incomeName" value={formData.incomeName} onChange={handleChange} />
                  {errors.incomeName && <span className="error">{errors.incomeName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="amount">रक्कम</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" />
                  {errors.amount && <span className="error">{errors.amount}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">दिनांक</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} />
                  {errors.date && <span className="error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="bankName">बँकेचे नाव</label>
                  <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="note">नोंद</label>
                  <textarea name="note" rows={3} value={formData.note} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="transactionId">व्यवहार आयडी</label>
                  <input type="text" name="transactionId" value={formData.transactionId} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="chequeNo">चेक क्रमांक</label>
                  <input type="text" name="chequeNo" value={formData.chequeNo} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="ddNo">DD क्रमांक</label>
                  <input type="text" name="ddNo" value={formData.ddNo} onChange={handleChange} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentType">भुगतान प्रकार</label>
                  <select name="paymentType" value={formData.paymentType} onChange={handleChange}>
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
                  {isEditing ? 'उत्पन्न अपडेट करा' : 'उत्पन्न जोडा'}
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
                <Card.Title as="h5">उत्पन्न</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" value={searchTerm} placeholder="Search" onChange={handleSearchChange} className="me-2" />
                {/* <Button variant="primary" value={searchTerm} onClick={handleSearch} className="me-2">
                  Search
                </Button> */}
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
                      <th>उत्पन्नचे नाव</th>
                      <th>रक्कम</th>
                      <th>दिनांक</th>
                      <th>बँकेचे नाव</th>
                      <th>चेक क्रमांक</th>
                      <th>DD क्रमांक</th>
                      <th>व्यवहार आयडी</th>
                      <th>भुगतान प्रकार</th>
                      <th>नोंद</th>
                      <th>तयार केलेले</th>
                      <th>कारवाई</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentData) && currentData.length > 0 ? (
                      currentData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.IncomeName}</td>
                          <td>₹{item.Amount}</td>
                          <td>{item.Date ? new Date(item.Date).toLocaleDateString() : 'N/A'}</td>
                          <td>{item.BankName || 'N/A'}</td>
                          <td>{item.ChequeNo || 'N/A'}</td>
                          <td>{item.DDNo || 'N/A'}</td>
                          <td>{item.TransactionId || 'N/A'}</td>
                          <td>{item.PaymentType || 'N/A'}</td>
                          <td>{item.Note || 'N/A'}</td>
                          <td>{item.CreatedByName || 'N/A'}</td>
                          <td>
                            <Button variant="info" size="sm" className="me-2" onClick={() => handleEditIncome(item.Id)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteIncome(item.Id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center' }}>
                          No incomes found
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

export default IncomeForm;
