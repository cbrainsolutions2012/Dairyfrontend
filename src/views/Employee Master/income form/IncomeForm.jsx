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
  const [isEditing, setIsEditing] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState(null);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      fetchTableData(); // Reset to show all data
      return;
    }

    const filteredData = tableData.filter(
      (item) =>
        item.IncomeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.BankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Note?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setTableData(filteredData);
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
    writeFile(wb, 'temple-master.xlsx');
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
        setTableData(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching expense data:', error);
      setTableData([]);
    }
  }, [token]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  console.log(tableData);

  // console.log(Array.isArray(tableData)); // Should log true

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
                <Form.Control type="text" value={searchTerm} placeholder="Search" onChange={handleSearchChange} />
                <Button variant="primary" onClick={handleSearch} className="me-2">
                  Search
                </Button>
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
                    {Array.isArray(tableData) && tableData.length > 0 ? (
                      tableData.map((item) => (
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
                          No expenses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
}

export default IncomeForm;
