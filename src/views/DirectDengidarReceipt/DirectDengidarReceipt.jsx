import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import axios from 'axios';
import '../commonemp.scss';
import { FaEdit, FaTrashAlt, FaPrint } from 'react-icons/fa';

const DirectDengidarReceipt = () => {
  // State Management
  const [receipts, setReceipts] = useState([]);
  const [sevaTypes, setSevaTypes] = useState([]);
  const [gotraList, setGotraList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    DonorName: '',
    MobileNumber: '',
    Address: '',
    City: '',
    EmailId: '',
    GotraTypeId: '',
    PanCard: '',
    AdharCard: '',
    SevaTypeId: '',
    SevaFor: '',
    SevaDate: '',
    Amount: '',
    PaymentType: 'cash',
    TransactionId: '',
    ChequeNo: '',
    DDNo: '',
    BankName: '',
    Note: ''
  });

  // Error State
  const [errors, setErrors] = useState({});

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.DonorName?.trim()) {
      newErrors.DonorName = 'Donor name is required';
    }

    if (!formData.Amount || parseFloat(formData.Amount) <= 0) {
      newErrors.Amount = 'Valid amount is required';
    }

    // if (formData.MobileNumber && !/^\d{10}$/.test(formData.MobileNumber.replace(/\D/g, ''))) {
    //   newErrors.MobileNumber = 'Mobile number must be 10 digits';
    // }

    // if (formData.EmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EmailId)) {
    //   newErrors.EmailId = 'Valid email is required';
    // }

    if ((formData.PaymentType === 'online' || formData.PaymentType === 'upi') && !formData.TransactionId?.trim()) {
      newErrors.TransactionId = 'Transaction ID is required for online/UPI payments';
    }

    if (formData.PaymentType === 'cheque' && !formData.ChequeNo?.trim()) {
      newErrors.ChequeNo = 'Cheque number is required';
    }

    if (formData.PaymentType === 'dd' && !formData.DDNo?.trim()) {
      newErrors.DDNo = 'DD number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fetch Data
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('https://api.mytemplesoftware.in/api/direct-dengidar-receipt', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setReceipts(response.data.data || []);
      } else {
        console.error('Error fetching receipts:', response.data?.message);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSevaTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://api.mytemplesoftware.in/api/seva', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.sevas) {
        setSevaTypes(response.data.sevas || []);
      }
    } catch (error) {
      console.error('Error fetching seva types:', error);
    }
  };

  const fetchGotraList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://api.mytemplesoftware.in/api/gotra', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.gotras) {
        setGotraList(response.data.gotras || []);
      }
    } catch (error) {
      console.error('Error fetching gotra list:', error);
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchSevaTypes();
    fetchGotraList();
  }, []);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const submitData = {
        ...formData,
        Amount: parseFloat(formData.Amount || 0),
        SevaTypeId: formData.SevaTypeId || null,
        SevaDate: formData.SevaDate || new Date().toISOString().split('T')[0]
      };

      let response;
      if (editingId) {
        response = await axios.put(`https://api.mytemplesoftware.in/api/direct-dengidar-receipt/${editingId}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post('https://api.mytemplesoftware.in/api/direct-dengidar-receipt', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response.data?.success) {
        alert(editingId ? 'Receipt updated successfully!' : 'Receipt created successfully!');
        resetForm();
        fetchReceipts();
      } else {
        alert(response.data?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving receipt:', error);
      alert('Error saving receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (receipt) => {
    setEditingId(receipt.Id);
    setFormData({
      DonorName: receipt.DonorName || '',
      MobileNumber: receipt.MobileNumber || '',
      Address: receipt.Address || '',
      City: receipt.City || '',
      EmailId: receipt.EmailId || '',
      GotraTypeId: receipt.GotraTypeId || '',
      PanCard: receipt.PanCard || '',
      AdharCard: receipt.AdharCard || '',
      SevaTypeId: receipt.SevaTypeId || '',
      SevaFor: receipt.SevaFor || '',
      SevaDate: receipt.SevaDate ? receipt.SevaDate.split('T')[0] : '',
      Amount: receipt.Amount || '',
      PaymentType: receipt.PaymentType || 'cash',
      TransactionId: receipt.TransactionId || '',
      ChequeNo: receipt.ChequeNo || '',
      DDNo: receipt.DDNo || '',
      BankName: receipt.BankName || '',
      Note: receipt.Note || ''
    });

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.delete(`https://api.mytemplesoftware.in/api/direct-dengidar-receipt/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        alert('Receipt deleted successfully!');
        fetchReceipts();
      } else {
        alert(response.data?.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Error deleting receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      DonorName: '',
      MobileNumber: '',
      Address: '',
      City: '',
      EmailId: '',
      GotraTypeId: '',
      PanCard: '',
      AdharCard: '',
      SevaTypeId: '',
      SevaFor: '',
      SevaDate: '',
      Amount: '',
      PaymentType: 'cash',
      TransactionId: '',
      ChequeNo: '',
      DDNo: '',
      BankName: '',
      Note: ''
    });
    setEditingId(null);
    setErrors({});
  };

  // Print Receipt
  const handlePrintReceipt = (receipt) => {
    const sevaName = sevaTypes.find((s) => s.Id === receipt.SevaTypeId)?.SevaName || 'सामान्य दान';
    const gotraName = gotraList.find((g) => g.Id === receipt.GotraTypeId)?.GotraName || 'N/A';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <title>प्रत्यक्ष देणगीदार पावती - ${receipt.ReceiptNumber}</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
              
              body {
                  font-family: 'Noto Sans Devanagari', Arial, sans-serif;
                  margin: 0;
                  padding: 15px;
                  background: #f5f5f5;
                  color: #333;
                  font-size: 12px;
              }
              
              .receipt-container {
                  max-width: 100%;
                  margin: 0 auto;
                  background: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                  position: relative;
                  page-break-inside: avoid;
              }
              
              .registration-info {
                  position: absolute;
                  top: 8px;
                  font-size: 10px;
                  font-weight: 600;
                  color: #666;
                  z-index: 2;
              }
              
              .reg-left {
                  left: 15px;
              }
              
              .reg-right {
                  right: 15px;
              }
              
              .header {
                  background: #ff6b35 !important;
                  background: linear-gradient(135deg, #ff6b35, #f7931e) !important;
                  color: white !important;
                  padding: 20px;
                  text-align: center;
                  position: relative;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              
              .header h1 {
                  margin: 0;
                  font-size: 20px;
                  font-weight: 700;
                  margin-bottom: 5px;
                  position: relative;
                  z-index: 1;
              }
              
              .temple-name {
                  font-size: 14px;
                  margin: 5px 0;
                  font-weight: 600;
                  position: relative;
                  z-index: 1;
              }
              
              .temple-address {
                  font-size: 11px;
                  opacity: 0.9;
                  position: relative;
                  z-index: 1;
              }
              
              .receipt-content {
                  padding: 20px;
              }
              
              .receipt-number {
                  text-align: center;
                  background: #f8f9fa;
                  padding: 10px;
                  margin: -20px -20px 15px -20px;
                  border-bottom: 3px solid #ff6b35;
              }
              
              .receipt-number h2 {
                  margin: 0;
                  color: #ff6b35;
                  font-size: 18px;
                  font-weight: 700;
              }
              
              .receipt-details {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 10px 30px;
                  margin-bottom: 15px;
              }
              
              .detail-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 8px 0;
                  border-bottom: 1px solid #eee;
                  margin-bottom: 5px;
              }
              
              .amount-row {
                  grid-column: 1 / -1;
                  border-top: 2px solid #ff6b35;
                  border-bottom: none !important;
                  margin-top: 10px;
                  padding-top: 10px;
                  font-size: 16px;
                  font-weight: 700;
                  background: #f8f9fa;
                  padding: 10px;
                  border-radius: 5px;
              }
              
              .label {
                  font-weight: 600;
                  color: #555;
                  font-size: 12px;
                  display: flex;
                  align-items: center;
                  width: 60%;
              }
              
              .label::before {
                  content: '';
                  width: 6px;
                  height: 6px;
                  background: #ff6b35;
                  border-radius: 50%;
                  margin-right: 8px;
                  flex-shrink: 0;
              }
              
              .value {
                  font-weight: 600;
                  color: #333;
                  font-size: 12px;
                  text-align: right;
                  width: 40%;
                  word-wrap: break-word;
              }
              
              .footer {
                  background: #f8f9fa;
                  padding: 15px 20px;
                  text-align: center;
                  margin: 15px -20px -20px -20px;
                  font-size: 10px;
              }
              
              .contact-info {
                  font-size: 10px;
                  color: #666;
                  line-height: 1.4;
              }
              
              @media print {
                  body { 
                      background: white; 
                      padding: 0;
                      margin: 0;
                      font-size: 11px;
                  }
                  .receipt-container { 
                      box-shadow: none; 
                      border-radius: 0;
                      page-break-inside: avoid;
                      height: auto;
                      max-height: none;
                  }
                  .header {
                      background: #ff6b35 !important;
                      color: white !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      padding: 15px;
                  }
                  .header * {
                      color: white !important;
                  }
                  .receipt-content {
                      padding: 15px;
                  }
                  .receipt-details {
                      gap: 8px 25px;
                  }
                  .detail-row {
                      padding: 5px 0;
                  }
                  .label {
                      font-size: 11px;
                  }
                  .value {
                      font-size: 11px;
                  }
                  @page {
                      size: A4 landscape;
                      margin: 0.5in;
                  }
              }
          </style>
      </head>
      <body>
          <div class="receipt-container">
              <!-- Registration Information -->
              <div class="registration-info reg-left">Reg.No-ई-5652 पुणे</div>
              <div class="registration-info reg-right">स्थापना : 2011</div>
              
              <div class="header">
                  <h1>|| श्रीराम समर्थ ||</h1>
                  <div class="temple-name">आनंदी नारायण कृपा न्यास</div>
                  <div class="temple-name">श्री समर्थ रामदास स्वामी मठ</div>
                  <div class="temple-address">
                      खातगाव, ता. कर्जत, जि. अहिल्यानगर-414402, महाराष्ट्र, भारत
                  </div>
              </div>
              
              <div class="receipt-content">
                  <div class="receipt-number">
                      <h2>प्रत्यक्ष देणगीदार पावती</h2>
                  </div>
                  
                  <div class="receipt-details">
                      <div class="detail-row">
                          <span class="label">पावती क्रमांक</span>
                          <span class="value">${receipt.ReceiptNumber || 'N/A'}</span>
                      </div>
                      <div class="detail-row">
                          <span class="label">पावती तारीख</span>
                          <span class="value">${new Date().toLocaleDateString('hi-IN')}</span>
                      </div>
                      <div class="detail-row">
                          <span class="label">देणगीदार नाव</span>
                          <span class="value">${receipt.DonorName || 'N/A'}</span>
                      </div>
                      <div class="detail-row">
                          <span class="label">दूरध्वनी</span>
                          <span class="value">${receipt.MobileNumber || 'N/A'}</span>
                      </div>
                      <div class="detail-row">
                          <span class="label">पत्ता</span>
                          <span class="value">${receipt.Address || 'N/A'}</span>
                      </div>
                      <div class="detail-row">
                          <span class="label">शहर</span>
                          <span class="value">${receipt.City || 'N/A'}</span>
                      </div>
                      ${
                        gotraName && gotraName !== 'N/A'
                          ? `
                      <div class="detail-row">
                          <span class="label">गोत्र नाव</span>
                          <span class="value">${gotraName}</span>
                      </div>
                      `
                          : ''
                      }
                      <div class="detail-row">
                          <span class="label">सेवा प्रकार</span>
                          <span class="value">${sevaName}</span>
                      </div>
                      <div class="detail-row">
                          <span class="label">सेवा कोणासाठी</span>
                          <span class="value">${receipt.SevaFor || 'N/A'}</span>
                      </div>
                      <div class="detail-row">
                          <span class="label">सेवा तारीख</span>
                          <span class="value">${receipt.SevaDate ? new Date(receipt.SevaDate).toLocaleDateString('hi-IN') : 'N/A'}</span>
                      </div>
                      <div class="detail-row">
                          <span class="label">देयक प्रकार</span>
                          <span class="value">${receipt.PaymentType || 'N/A'}</span>
                      </div>
                      ${
                        receipt.TransactionId
                          ? `
                      <div class="detail-row">
                          <span class="label">ट्रांजॅक्शन आईडी</span>
                          <span class="value">${receipt.TransactionId}</span>
                      </div>
                      `
                          : ''
                      }
                      ${
                        receipt.ChequeNo
                          ? `
                      <div class="detail-row">
                          <span class="label">चेक नंबर</span>
                          <span class="value">${receipt.ChequeNo}</span>
                      </div>
                      `
                          : ''
                      }
                      ${
                        receipt.DDNo
                          ? `
                      <div class="detail-row">
                          <span class="label">डीडी नंबर</span>
                          <span class="value">${receipt.DDNo}</span>
                      </div>
                      `
                          : ''
                      }
                      ${
                        receipt.BankName
                          ? `
                      <div class="detail-row">
                          <span class="label">बँक नाव</span>
                          <span class="value">${receipt.BankName}</span>
                      </div>
                      `
                          : ''
                      }
                      ${
                        receipt.PanCard
                          ? `
                      <div class="detail-row">
                          <span class="label">पॅन कार्ड</span>
                          <span class="value">${receipt.PanCard}</span>
                      </div>
                      `
                          : ''
                      }
                      ${
                        receipt.Note
                          ? `
                      <div class="detail-row">
                          <span class="label">टिप्पणी</span>
                          <span class="value">${receipt.Note}</span>
                      </div>
                      `
                          : ''
                      }
                      
                      <div class="detail-row amount-row">
                          <span class="label">एकूण रक्कम</span>
                          <span class="value" style="font-size: 16px; color: #ff6b35;">₹${parseFloat(receipt.Amount || 0).toLocaleString('hi-IN')}</span>
                      </div>
                  </div>
              </div>
              
              <div class="footer">
                  <div class="contact-info">
                      <strong>संपर्क माहिती:</strong> 📞 दूरध्वनी: 9421177821 | 📱 WhatsApp: 9146855691<br>
                      <em>या पावतीला कायदेशीर वैधता आहे | Donations are Eligible for Tax Deductions under Section 80G vide of the Income Tax Act</em><br>
                      <em>Approval No. PNA/CIT-I/ATG/48/2012-2013/1285 | PAN No. AADTA0772C</em>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = () => printWindow.close();
        }, 250);
      };
    } else {
      alert('Please allow popups to print the receipt.');
    }
  };

  // Filter and Pagination
  const filteredReceipts = receipts.filter(
    (receipt) =>
      receipt.DonorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.MobileNumber?.includes(searchTerm) ||
      receipt.ReceiptNumber?.toString().includes(searchTerm) ||
      receipt.City?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReceipts = filteredReceipts.slice(startIndex, startIndex + itemsPerPage);

  const getPaymentTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'cash':
        return 'success';
      case 'online':
        return 'primary';
      case 'upi':
        return 'info';
      case 'cheque':
        return 'warning';
      case 'dd':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <React.Fragment>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {editingId ? 'प्रत्यक्ष देणगीदार पावती - संपादन' : 'प्रत्यक्ष देणगीदार पावती'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              {/* Donor Information Section */}
              <h6 style={{ color: '#007bff', marginBottom: '15px' }}>देणगीदार माहिती</h6>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="DonorName">देणगीदार नाव *</label>
                  <input
                    type="text"
                    name="DonorName"
                    value={formData.DonorName}
                    onChange={handleInputChange}
                    placeholder="देणगीदाराचे नाव प्रविष्ट करा"
                  />
                  {errors.DonorName && <span className="error">{errors.DonorName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="MobileNumber">मोबाईल नंबर</label>
                  <input
                    type="text"
                    name="MobileNumber"
                    value={formData.MobileNumber}
                    onChange={handleInputChange}
                    placeholder="१० अंकी मोबाईल नंबर"
                    maxLength={10}
                  />
                  {errors.MobileNumber && <span className="error">{errors.MobileNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Address">पत्ता</label>
                  <textarea
                    rows={2}
                    name="Address"
                    value={formData.Address}
                    onChange={handleInputChange}
                    placeholder="पत्ता प्रविष्ट करा"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="City">शहर</label>
                  <input type="text" name="City" value={formData.City} onChange={handleInputChange} placeholder="शहर प्रविष्ट करा" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="EmailId">ईमेल आईडी</label>
                  <input
                    type="email"
                    name="EmailId"
                    value={formData.EmailId}
                    onChange={handleInputChange}
                    placeholder="ईमेल पत्ता प्रविष्ट करा"
                  />
                  {errors.EmailId && <span className="error">{errors.EmailId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="GotraTypeId">गोत्र</label>
                  <select name="GotraTypeId" value={formData.GotraTypeId} onChange={handleInputChange}>
                    <option value="">गोत्र निवडा</option>
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
                  <label htmlFor="PanCard">पॅन कार्ड</label>
                  <input
                    type="text"
                    name="PanCard"
                    value={formData.PanCard}
                    onChange={handleInputChange}
                    placeholder="पॅन कार्ड नंबर"
                    maxLength={10}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="AdharCard">आधार कार्ड</label>
                  <input
                    type="text"
                    name="AdharCard"
                    value={formData.AdharCard}
                    onChange={handleInputChange}
                    placeholder="आधार कार्ड नंबर"
                    maxLength={12}
                  />
                </div>
              </div>

              {/* Seva Information Section */}
              <hr style={{ margin: '20px 0', borderColor: '#007bff' }} />
              <h6 style={{ color: '#007bff', marginBottom: '15px' }}>सेवा माहिती</h6>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="SevaTypeId">सेवा प्रकार</label>
                  <select name="SevaTypeId" value={formData.SevaTypeId} onChange={handleInputChange}>
                    <option value="">सेवा प्रकार निवडा</option>
                    {sevaTypes.map((seva) => (
                      <option key={seva.Id} value={seva.Id}>
                        {seva.SevaName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="SevaFor">सेवा कोणासाठी</label>
                  <input type="text" name="SevaFor" value={formData.SevaFor} onChange={handleInputChange} placeholder="सेवा कोणासाठी" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="SevaDate">सेवा तारीख</label>
                  <input type="date" name="SevaDate" value={formData.SevaDate} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="Amount">रक्कम *</label>
                  <input
                    type="number"
                    name="Amount"
                    value={formData.Amount}
                    onChange={handleInputChange}
                    placeholder="रक्कम प्रविष्ट करा"
                    min="0"
                    step="0.01"
                  />
                  {errors.Amount && <span className="error">{errors.Amount}</span>}
                </div>
              </div>

              {/* Payment Information Section */}
              <hr style={{ margin: '20px 0', borderColor: '#007bff' }} />
              <h6 style={{ color: '#007bff', marginBottom: '15px' }}>पेमेंट माहिती</h6>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="PaymentType">पेमेंट प्रकार *</label>
                  <select name="PaymentType" value={formData.PaymentType} onChange={handleInputChange}>
                    <option value="cash">रोख</option>
                    <option value="online">ऑनलाईन</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">चेक</option>
                    <option value="dd">डीडी</option>
                  </select>
                </div>
              </div>

              {/* Conditional fields for online/UPI */}
              {(formData.PaymentType === 'online' || formData.PaymentType === 'upi') && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="TransactionId">ट्रांजॅक्शन आईडी *</label>
                    <input
                      type="text"
                      name="TransactionId"
                      value={formData.TransactionId}
                      onChange={handleInputChange}
                      placeholder="ट्रांजॅक्शन आईडी प्रविष्ट करा"
                    />
                    {errors.TransactionId && <span className="error">{errors.TransactionId}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="BankName">बँक नाव</label>
                    <input
                      type="text"
                      name="BankName"
                      value={formData.BankName}
                      onChange={handleInputChange}
                      placeholder="बँकेचे नाव प्रविष्ट करा"
                    />
                  </div>
                </div>
              )}

              {/* Conditional fields for Cheque */}
              {formData.PaymentType === 'cheque' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ChequeNo">चेक नंबर *</label>
                    <input
                      type="text"
                      name="ChequeNo"
                      value={formData.ChequeNo}
                      onChange={handleInputChange}
                      placeholder="चेक नंबर प्रविष्ट करा"
                    />
                    {errors.ChequeNo && <span className="error">{errors.ChequeNo}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="BankName">बँक नाव</label>
                    <input
                      type="text"
                      name="BankName"
                      value={formData.BankName}
                      onChange={handleInputChange}
                      placeholder="बँकेचे नाव प्रविष्ट करा"
                    />
                  </div>
                </div>
              )}

              {/* Conditional fields for DD */}
              {formData.PaymentType === 'dd' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="DDNo">डीडी नंबर *</label>
                    <input
                      type="text"
                      name="DDNo"
                      value={formData.DDNo}
                      onChange={handleInputChange}
                      placeholder="डीडी नंबर प्रविष्ट करा"
                    />
                    {errors.DDNo && <span className="error">{errors.DDNo}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="BankName">बँक नाव</label>
                    <input
                      type="text"
                      name="BankName"
                      value={formData.BankName}
                      onChange={handleInputChange}
                      placeholder="बँकेचे नाव प्रविष्ट करा"
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Note">टिप्पणी</label>
                  <textarea
                    rows={3}
                    name="Note"
                    value={formData.Note}
                    onChange={handleInputChange}
                    placeholder="अतिरिक्त टिप्पणी प्रविष्ट करा"
                  />
                </div>
              </div>

              <div className="form-actions">
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (editingId ? 'अपडेट करत आहे...' : 'सेव्ह करत आहे...') : editingId ? 'पावती अपडेट करा' : 'पावती तयार करा'}
                </Button>
                {editingId && (
                  <Button variant="secondary" type="button" onClick={resetForm}>
                    रद्द करा
                  </Button>
                )}
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>

      {/* Data Section */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">प्रत्यक्ष देणगीदार पावत्या</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control
                  type="text"
                  placeholder="नाव, मोबाईल, पावती क्रमांक किंवा शहरानुसार शोधा..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="me-2"
                />
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-card" style={{ height: '362px' }}>
              <PerfectScrollbar>
                {loading ? (
                  <div style={{ padding: '40px', textAlign: 'center' }}>
                    <div>Loading receipts...</div>
                  </div>
                ) : (
                  <Table
                    responsive
                    className="table-bordered"
                    style={{
                      border: '1px solid #dee2e6',
                      borderCollapse: 'collapse'
                    }}
                  >
                    <thead>
                      <tr>
                        <th>पावती क्र.</th>
                        <th>तारीख</th>
                        <th>देणगीदार नाव</th>
                        <th>दूरध्वनी</th>
                        <th>रक्कम</th>
                        <th>देयक प्रकार</th>
                        <th>सेवा प्रकार</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReceipts.map((receipt) => (
                        <tr key={receipt.Id}>
                          <td>
                            <strong>#{receipt.ReceiptNumber}</strong>
                          </td>
                          <td>{receipt.SevaDate ? new Date(receipt.SevaDate).toLocaleDateString('en-IN') : '-'}</td>
                          <td>
                            <strong>{receipt.DonorName}</strong>
                            {receipt.City && <div style={{ fontSize: '12px', color: '#666' }}>{receipt.City}</div>}
                          </td>
                          <td>{receipt.MobileNumber || '-'}</td>
                          <td>
                            <strong style={{ color: '#28a745' }}>₹{parseFloat(receipt.Amount || 0).toLocaleString('en-IN')}</strong>
                          </td>
                          <td>
                            <span
                              style={{
                                backgroundColor:
                                  getPaymentTypeColor(receipt.PaymentType) === 'success'
                                    ? '#28a745'
                                    : getPaymentTypeColor(receipt.PaymentType) === 'primary'
                                      ? '#007bff'
                                      : getPaymentTypeColor(receipt.PaymentType) === 'info'
                                        ? '#17a2b8'
                                        : getPaymentTypeColor(receipt.PaymentType) === 'warning'
                                          ? '#ffc107'
                                          : '#6c757d',
                                color: getPaymentTypeColor(receipt.PaymentType) === 'warning' ? '#000' : '#fff',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600'
                              }}
                            >
                              {receipt.PaymentType?.toUpperCase()}
                            </span>
                          </td>
                          <td>{receipt.SevaName || '-'}</td>
                          <td>
                            <Button
                              variant="info"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEdit(receipt)}
                              disabled={loading}
                              title="Edit Receipt"
                            >
                              <FaEdit />
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handlePrintReceipt(receipt)}
                              disabled={loading}
                              title="Print Receipt"
                            >
                              <FaPrint />
                            </Button>

                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(receipt.Id)}
                              disabled={loading}
                              title="Delete Receipt"
                            >
                              <FaTrashAlt />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredReceipts.length === 0 && (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                            कोणतीही पावती सापडली नाही
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </PerfectScrollbar>
            </div>

            {/* Pagination Info */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 px-3 pb-3">
                <div className="pagination-info">
                  <small style={{ color: '#6c757d' }}>
                    दाखवत आहे {startIndex + 1} ते {Math.min(startIndex + itemsPerPage, filteredReceipts.length)} पैकी{' '}
                    {filteredReceipts.length} नोंदी
                  </small>
                </div>

                <div className="pagination-controls d-flex align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="me-2"
                  >
                    मागील
                  </Button>

                  <span style={{ margin: '0 10px', fontWeight: '600' }}>
                    पान {currentPage} पैकी {totalPages}
                  </span>

                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="ms-1"
                  >
                    पुढील
                  </Button>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
};

export default DirectDengidarReceipt;
