import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../commonemp.scss';

function DengiPawati() {
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [gotraList, setGotraList] = useState([]);
  const [sevaList, setSevaList] = useState([]);
  const [devoteeFound, setDevoteeFound] = useState(false);
  const [receiptData, setReceiptData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState(null);

  const [formData, setFormData] = useState({
    // Devotee fields
    DengidarId: '',
    FullName: '',
    MobileNumber: '',
    PanCard: '',
    AdharCard: '',
    GotraTypeId: '',
    City: '',
    Address: '',
    EmailId: '',
    DOB: '',

    // Receipt fields
    ReceiptNumber: '',
    SevaTypeId: '',
    SevaFor: '',
    SevaDate: '',
    PaymentType: '',
    BankName: '',
    DDNo: '',
    ChequeNo: '',
    Amount: '',
    Note: '',
    TransactionId: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear form and reset to search new devotee
  const handleClearForm = () => {
    setFormData({
      // Devotee fields
      DengidarId: '',
      FullName: '',
      MobileNumber: '',
      PanCard: '',
      AdharCard: '',
      GotraTypeId: '',
      City: '',
      Address: '',
      EmailId: '',
      DOB: '',

      // Receipt fields
      ReceiptNumber: '',
      SevaTypeId: '',
      SevaFor: '',
      SevaDate: '',
      PaymentType: '',
      BankName: '',
      DDNo: '',
      ChequeNo: '',
      Amount: '',
      Note: '',
      TransactionId: ''
    });
    setSearchTerm('');
    setDevoteeFound(false);
    setIsEditing(false);
    setEditingReceiptId(null);
    setErrors({});
  };

  // Handle edit receipt
  const handleEditReceipt = async (receiptId) => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/dengidar-receipt/${receiptId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success && res.data.data) {
        const receipt = res.data.data;
        // Populate form with receipt data and devotee data
        setFormData({
          // Devotee fields
          DengidarId: receipt.DengidarId,
          FullName: receipt.FullName || '',
          MobileNumber: receipt.MobileNumber || '',
          PanCard: receipt.PanCard || '',
          AdharCard: receipt.AdharCard || '',
          GotraTypeId: receipt.GotraTypeId || '',
          City: receipt.City || '',
          Address: receipt.Address || '',
          EmailId: receipt.EmailId || '',
          DOB: receipt.DOB ? new Date(receipt.DOB).toISOString().split('T')[0] : '',

          // Receipt fields
          ReceiptNumber: receipt.ReceiptNumber,
          SevaTypeId: receipt.SevaTypeId,
          SevaFor: receipt.SevaFor || '',
          SevaDate: receipt.SevaDate ? new Date(receipt.SevaDate).toISOString().split('T')[0] : '',
          PaymentType: receipt.PaymentType,
          BankName: receipt.BankName || '',
          DDNo: receipt.DDNo || '',
          ChequeNo: receipt.ChequeNo || '',
          Amount: receipt.Amount,
          Note: receipt.Note || '',
          TransactionId: receipt.TransactionId || ''
        });
        setDevoteeFound(true);
        setIsEditing(true);
        setEditingReceiptId(receiptId);
        setSearchTerm(receipt.MobileNumber || '');
      }
    } catch (error) {
      console.error('Error fetching receipt for edit:', error);
      alert('Failed to load receipt data for editing.');
    }
  };

  // Search devotee by mobile number
  const handleSearch = async () => {
    if (!searchTerm) {
      alert('Please enter mobile number to search');
      return;
    }

    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/dengidar/search?search=${searchTerm}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success && res.data.data && res.data.data.length > 0) {
        // Devotee found, populate form - taking first result from array
        const devotee = res.data.data[0];
        setFormData({
          ...formData,
          DengidarId: devotee.Id,
          FullName: devotee.FullName,
          MobileNumber: devotee.MobileNumber,
          PanCard: devotee.PanCard,
          AdharCard: devotee.AdharCard,
          GotraTypeId: devotee.GotraTypeId,
          City: devotee.City,
          Address: devotee.Address,
          EmailId: devotee.EmailId,
          DOB: devotee.DOB ? new Date(devotee.DOB).toISOString().split('T')[0] : ''
        });
        setDevoteeFound(true);
        alert('Devotee found! Form populated with existing data.');
      } else {
        // Devotee not found
        const confirmAdd = window.confirm('Devotee not found. Do you want to add a new devotee?');
        if (confirmAdd) {
          navigate('/devotee');
        }
      }
    } catch (error) {
      console.error('Error searching devotee:', error);
      const confirmAdd = window.confirm('Devotee not found. Do you want to add a new devotee?');
      if (confirmAdd) {
        navigate('/devotee');
      }
    }
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      // Fetch Gotra list
      const gotraRes = await axios.get('https://api.mytemplesoftware.in/api/gotra', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      const gotras = gotraRes.data.gotras;
      if (gotras) {
        setGotraList(Array.isArray(gotras) ? gotras : [gotras]);
      }

      // Fetch Seva types (assuming there's an API for seva types)
      const sevaRes = await axios.get('https://api.mytemplesoftware.in/api/seva', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      const sevas = sevaRes.data.sevas;
      if (sevas) {
        setSevaList(Array.isArray(sevas) ? sevas : [sevas]);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  // Fetch receipt data for table
  const fetchReceiptData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/dengidar-receipt', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        setReceiptData(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching receipt data:', error);
      setReceiptData([]);
    }
  };

  useEffect(() => {
    fetchDropdownData();
    fetchReceiptData();
  }, []);

  const handleExportToExcel = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // Remove the "Action" column from the cloned table

    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove(); // header remove

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
    });

    // Convert the modified table to a workbook and export

    const wb = utils.table_to_book(clonedTable);
    writeFile(wb, 'temple-master.xlsx');
  };

  const handleExportToPDF = () => {
    // get table
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // remove action feild
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove(); //remove header

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
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

  const validate = () => {
    const newErrors = {};
    if (!formData.DengidarId) newErrors.DengidarId = 'Please search and select a devotee first';
    if (!formData.SevaTypeId) newErrors.SevaTypeId = 'Seva type is required';
    if (!formData.Amount) newErrors.Amount = 'Amount is required';
    if (!formData.PaymentType) newErrors.PaymentType = 'Payment type is required';
    if (!formData.SevaDate) newErrors.SevaDate = 'Seva date is required';

    // Conditional validation for UPI
    if (formData.PaymentType === 'upi') {
      if (!formData.TransactionId) newErrors.TransactionId = 'Transaction ID is required for UPI';
      if (!formData.BankName) newErrors.BankName = 'Bank name is required for UPI';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const receiptData = {
          DengidarId: formData.DengidarId,
          SevaTypeId: formData.SevaTypeId,
          SevaFor: formData.SevaFor,
          SevaDate: formData.SevaDate,
          PaymentType: formData.PaymentType,
          BankName: formData.BankName || null,
          DDNo: formData.DDNo || null,
          ChequeNo: formData.ChequeNo || null,
          Amount: parseFloat(formData.Amount),
          Note: formData.Note || null,
          TransactionId: formData.TransactionId || null
        };

        let response;
        if (isEditing && editingReceiptId) {
          // Update existing receipt
          response = await axios.put(`https://api.mytemplesoftware.in/api/dengidar-receipt/${editingReceiptId}`, receiptData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Create new receipt
          response = await axios.post('https://api.mytemplesoftware.in/api/dengidar-receipt', receiptData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
        }

        if (response.data.success) {
          const receiptNumber = response.data.data?.ReceiptNumber || formData.ReceiptNumber || 'N/A';
          const message = isEditing
            ? `Receipt updated successfully! Receipt Number: ${receiptNumber}`
            : `Receipt generated successfully! Receipt Number: ${receiptNumber}`;

          alert(message);

          // Reset only receipt fields, keep devotee data
          setFormData({
            ...formData,
            ReceiptNumber: '',
            SevaTypeId: '',
            SevaFor: '',
            SevaDate: '',
            PaymentType: '',
            BankName: '',
            DDNo: '',
            ChequeNo: '',
            Amount: '',
            Note: '',
            TransactionId: ''
          });
          setIsEditing(false);
          setEditingReceiptId(null);
          setErrors({});
          fetchReceiptData(); // Refresh table
        }
      } catch (error) {
        console.error('Error submitting receipt:', error);
        const action = isEditing ? 'update' : 'generate';
        if (error.response && error.response.data && error.response.data.message) {
          alert(`Failed to ${action} receipt: ${error.response.data.message}`);
        } else {
          alert(`Failed to ${action} receipt. Please try again.`);
        }
      }
    } else {
      setErrors(formErrors);
    }
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`https://api.mytemplesoftware.in/api/dengidar-receipt/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        alert('Receipt deleted successfully!');
        fetchReceiptData(); // Refresh table
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to delete receipt: ${error.response.data.message}`);
      } else {
        alert('Failed to delete receipt. Please try again.');
      }
    }
  };

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'पावती संपादन' : 'देणगीदार नोंदणी'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              {/* Mobile Search Section */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="searchTerm">{isEditing ? 'संपादन मोड' : 'दूरध्वनी क्रमांक शोधा'}</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      name="searchTerm"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder={isEditing ? 'Editing receipt...' : 'Mobile number enter करा'}
                      disabled={devoteeFound || isEditing}
                    />
                    <Button variant="primary" type="button" onClick={handleSearch} disabled={devoteeFound || isEditing}>
                      Search
                    </Button>
                    {(devoteeFound || isEditing) && (
                      <Button variant="secondary" type="button" onClick={handleClearForm}>
                        {isEditing ? 'संपादन रद्द करा' : 'नवीन शोधा'}
                      </Button>
                    )}
                  </div>
                  {devoteeFound && !isEditing && (
                    <small style={{ color: 'green', marginTop: '5px', display: 'block' }}>✓ देणगीदार सापडला - आता पावती तयार करा</small>
                  )}
                  {isEditing && (
                    <small style={{ color: 'orange', marginTop: '5px', display: 'block' }}>
                      ✏️ पावती संपादन मोड - माहिती बदला आणि अपडेट करा
                    </small>
                  )}
                </div>
              </div>

              {/* Devotee Information Section - Read Only after search, editable in edit mode */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="FullName">पुर्ण नाव</label>
                  <input
                    type="text"
                    name="FullName"
                    value={formData.FullName}
                    onChange={handleChange}
                    readOnly={devoteeFound && !isEditing}
                    style={{ backgroundColor: devoteeFound && !isEditing ? '#f8f9fa' : 'white' }}
                  />
                  {errors.FullName && <span className="error">{errors.FullName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="MobileNumber">दूरध्वनी क्रमांक</label>
                  <input
                    type="text"
                    name="MobileNumber"
                    value={formData.MobileNumber}
                    onChange={handleChange}
                    readOnly={devoteeFound && !isEditing}
                    style={{ backgroundColor: devoteeFound && !isEditing ? '#f8f9fa' : 'white' }}
                  />
                  {errors.MobileNumber && <span className="error">{errors.MobileNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="PanCard">पॅन कार्ड</label>
                  <input
                    type="text"
                    name="PanCard"
                    value={formData.PanCard}
                    onChange={handleChange}
                    readOnly={devoteeFound && !isEditing}
                    style={{ backgroundColor: devoteeFound && !isEditing ? '#f8f9fa' : 'white' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="AdharCard">आधार क्रमांक</label>
                  <input
                    type="text"
                    name="AdharCard"
                    value={formData.AdharCard}
                    onChange={handleChange}
                    readOnly={devoteeFound && !isEditing}
                    style={{ backgroundColor: devoteeFound && !isEditing ? '#f8f9fa' : 'white' }}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="City">शहर</label>
                  <input
                    type="text"
                    name="City"
                    value={formData.City}
                    onChange={handleChange}
                    readOnly={devoteeFound && !isEditing}
                    style={{ backgroundColor: devoteeFound && !isEditing ? '#f8f9fa' : 'white' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="GotraTypeId">गोत्र प्रकार</label>
                  <select
                    name="GotraTypeId"
                    value={formData.GotraTypeId}
                    onChange={handleChange}
                    disabled={devoteeFound && !isEditing}
                    style={{ backgroundColor: devoteeFound && !isEditing ? '#f8f9fa' : 'white' }}
                  >
                    <option value="">गोत्र प्रकार निवडा</option>
                    {gotraList.map((gotra) => (
                      <option key={gotra.Id} value={gotra.Id}>
                        {gotra.GotraName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="EmailId">ई-मेल</label>
                  <input
                    type="email"
                    name="EmailId"
                    value={formData.EmailId}
                    onChange={handleChange}
                    readOnly={devoteeFound && !isEditing}
                    style={{ backgroundColor: devoteeFound && !isEditing ? '#f8f9fa' : 'white' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="Address">पत्ता</label>
                  <textarea
                    rows={2}
                    name="Address"
                    value={formData.Address}
                    onChange={handleChange}
                    readOnly={devoteeFound && !isEditing}
                    style={{ backgroundColor: devoteeFound && !isEditing ? '#f8f9fa' : 'white' }}
                  />
                </div>
              </div>

              {/* Receipt Information Section */}
              <hr style={{ margin: '20px 0', borderColor: '#007bff' }} />
              <h6 style={{ color: '#007bff', marginBottom: '15px' }}>पावती माहिती</h6>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="SevaTypeId">सेवेचे प्रकार *</label>
                  <select name="SevaTypeId" value={formData.SevaTypeId} onChange={handleChange}>
                    <option value="">सेवेचे प्रकार निवडा</option>
                    {sevaList.map((seva) => (
                      <option key={seva.Id} value={seva.Id}>
                        {seva.SevaName}
                      </option>
                    ))}
                  </select>
                  {errors.SevaTypeId && <span className="error">{errors.SevaTypeId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Amount">रक्कम *</label>
                  <input type="number" name="Amount" value={formData.Amount} onChange={handleChange} step="0.01" />
                  {errors.Amount && <span className="error">{errors.Amount}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="PaymentType">देयक प्रकार *</label>
                  <select name="PaymentType" value={formData.PaymentType} onChange={handleChange}>
                    <option value="">देयक प्रकार निवडा</option>
                    <option value="cash">रोख</option>
                    <option value="upi">यूपीआय</option>
                    <option value="cheque">चेक</option>
                    <option value="dd">डीडी</option>
                    <option value="gift">उपहार</option>
                  </select>
                  {errors.PaymentType && <span className="error">{errors.PaymentType}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="SevaFor">सेवा कोणासाठी</label>
                  <input type="text" name="SevaFor" value={formData.SevaFor} onChange={handleChange} />
                </div>
              </div>

              {/* Conditional fields for UPI */}
              {formData.PaymentType === 'upi' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="TransactionId">ट्रान्झॅक्शन आयडी *</label>
                    <input type="text" name="TransactionId" value={formData.TransactionId} onChange={handleChange} />
                    {errors.TransactionId && <span className="error">{errors.TransactionId}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="BankName">बँकेचे नाव *</label>
                    <input type="text" name="BankName" value={formData.BankName} onChange={handleChange} />
                    {errors.BankName && <span className="error">{errors.BankName}</span>}
                  </div>
                </div>
              )}

              {/* Conditional fields for Cheque/DD */}
              {(formData.PaymentType === 'cheque' || formData.PaymentType === 'dd') && (
                <div className="form-row">
                  {formData.PaymentType === 'dd' && (
                    <div className="form-group">
                      <label htmlFor="DDNo">डीडी क्रमांक</label>
                      <input type="text" name="DDNo" value={formData.DDNo} onChange={handleChange} />
                    </div>
                  )}
                  {formData.PaymentType === 'cheque' && (
                    <div className="form-group">
                      <label htmlFor="ChequeNo">चेक क्रमांक</label>
                      <input type="text" name="ChequeNo" value={formData.ChequeNo} onChange={handleChange} />
                    </div>
                  )}
                  <div className="form-group">
                    <label htmlFor="BankName">बँकेचे नाव</label>
                    <input type="text" name="BankName" value={formData.BankName} onChange={handleChange} />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="SevaDate">सेवा तारीख *</label>
                  <input type="date" name="SevaDate" value={formData.SevaDate} onChange={handleChange} />
                  {errors.SevaDate && <span className="error">{errors.SevaDate}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Note">नोट</label>
                  <textarea rows={3} name="Note" value={formData.Note} onChange={handleChange} />
                </div>
              </div>

              <div className="form-actions">
                <Button variant="primary" type="submit" disabled={!formData.DengidarId}>
                  {isEditing ? 'पावती अपडेट करा' : 'पावती तयार करा'}
                </Button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h5">पावती यादी</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
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
                      <th>पावती क्रमांक</th>
                      <th>देणगीदार नाव</th>
                      <th>सेवा प्रकार</th>
                      <th>रक्कम</th>
                      <th>देयक प्रकार</th>
                      <th>सेवा तारीख</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(receiptData) &&
                      receiptData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.ReceiptNumber}</td>
                          <td>{item.FullName || 'N/A'}</td>
                          <td>{item.SevaName || 'N/A'}</td>
                          <td>₹{item.Amount}</td>
                          <td>{item.PaymentType}</td>
                          <td>{item.SevaDate ? new Date(item.SevaDate).toLocaleDateString() : 'N/A'}</td>
                          <td>
                            <Button variant="info" size="sm" className="me-2" onClick={() => handleEditReceipt(item.Id)}>
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                confirmDelete(item.Id);
                              }}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    {receiptData.length === 0 && (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No receipts found
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

      {/*</Row> */}
    </React.Fragment>
  );
}

export default DengiPawati;
