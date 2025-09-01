import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import axios from 'axios';
import { FaEdit, FaTrashAlt, FaPrint } from 'react-icons/fa';
import '../commonemp.scss';

function MilkDistribution() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [milkDistributionData, setMilkDistributionData] = useState([]);
  const [allMilkDistributionData, setAllMilkDistributionData] = useState([]);
  const [sellersData, setSellersData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDistributionId, setEditingDistributionId] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    sellerId: '',
    milkType: '',
    sellerPrice: '',
    totalQty: '',
    date: '',
    fatPercentage: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Get API URL from environment
  const API_URL = import.meta.env.VITE_API_URL || 'https://dairyapi.demotest.in.net';

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);

    if (value === '') {
      setMilkDistributionData(allMilkDistributionData);
    } else {
      const filteredData = allMilkDistributionData.filter(
        (distribution) =>
          (distribution.SellerName || '').toLowerCase().includes(value.toLowerCase()) ||
          (distribution.MilkType || '').toLowerCase().includes(value.toLowerCase()) ||
          (distribution.Date || '').includes(value)
      );
      setMilkDistributionData(filteredData);
    }
  };

  // Clear form and reset to add new distribution
  const handleClearForm = () => {
    setFormData({
      sellerId: '',
      milkType: '',
      sellerPrice: '',
      totalQty: '',
      date: '',
      fatPercentage: ''
    });
    setIsEditing(false);
    setEditingDistributionId(null);
    setErrors({});
    setApiError('');
  };

  // Handle edit distribution
  const handleEditDistribution = async (distributionId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/milk-distribution/${distributionId}`, {
        headers: getAuthHeaders()
      });

      if (res.data.success && res.data.data.milkSale) {
        const distribution = res.data.data.milkSale;
        setFormData({
          sellerId: distribution.SellerId || '',
          milkType: distribution.MilkType || '',
          sellerPrice: distribution.SellerPrice || '',
          totalQty: distribution.TotalQty || '',
          date: distribution.Date ? distribution.Date.split('T')[0] : '',
          fatPercentage: distribution.FatPercentage || ''
        });
        setIsEditing(true);
        setEditingDistributionId(distributionId);
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching distribution for edit:', error);
      setApiError('Failed to load distribution data for editing.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch milk distribution data
  const fetchMilkDistributionData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/milk-distribution?includeDetails=true`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        const data = res.data.data.milkSales || [];
        setAllMilkDistributionData(data);
        setMilkDistributionData(data);
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching milk distribution data:', error);
      setApiError('Failed to fetch milk distribution data.');
      setAllMilkDistributionData([]);
      setMilkDistributionData([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Fetch sellers data for dropdown
  const fetchSellersData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sellers`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        const data = res.data.data.sellers || [];
        setSellersData(data);
      }
    } catch (error) {
      console.error('Error fetching sellers data:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchMilkDistributionData();
    fetchSellersData();
  }, [fetchMilkDistributionData, fetchSellersData]);

  // Validation function
  const validate = () => {
    const newErrors = {};

    if (!formData.sellerId) {
      newErrors.sellerId = 'Seller is required';
    }

    if (!formData.milkType) {
      newErrors.milkType = 'Milk type is required';
    }

    if (!formData.sellerPrice) {
      newErrors.sellerPrice = 'Seller price is required';
    } else if (parseFloat(formData.sellerPrice) <= 0) {
      newErrors.sellerPrice = 'Price must be greater than 0';
    }

    if (!formData.totalQty) {
      newErrors.totalQty = 'Total quantity is required';
    } else if (parseFloat(formData.totalQty) <= 0) {
      newErrors.totalQty = 'Quantity must be greater than 0';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.fatPercentage) {
      newErrors.fatPercentage = 'Fat percentage is required';
    } else if (parseFloat(formData.fatPercentage) <= 0) {
      newErrors.fatPercentage = 'Fat percentage must be greater than 0';
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();

    if (Object.keys(formErrors).length === 0) {
      try {
        setLoading(true);
        setApiError('');

        const submitData = {
          sellerId: parseInt(formData.sellerId),
          milkType: formData.milkType,
          sellerPrice: parseFloat(formData.sellerPrice),
          totalQty: parseFloat(formData.totalQty),
          date: formData.date,
          fatPercentage: parseFloat(formData.fatPercentage)
        };

        let response;
        if (isEditing && editingDistributionId) {
          // Update existing distribution
          response = await axios.put(`${API_URL}/api/milk-distribution/${editingDistributionId}`, submitData, {
            headers: getAuthHeaders()
          });
          if (response.data.success) {
            alert('Milk distribution updated successfully!');
          }
        } else {
          // Create new distribution
          response = await axios.post(`${API_URL}/api/milk-distribution`, submitData, {
            headers: getAuthHeaders()
          });
          if (response.data.success) {
            alert('Milk distribution added successfully!');
          }
        }

        // Reset form and refresh data
        handleClearForm();
        fetchMilkDistributionData();
      } catch (error) {
        console.error('Error submitting milk distribution:', error);

        if (error.response?.status === 400) {
          setApiError(error.response.data.message || 'Invalid data provided. Please check all fields.');
        } else if (error.response?.data?.message) {
          setApiError(error.response.data.message);
        } else {
          setApiError('Failed to save milk distribution. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(formErrors);
    }
  };

  // Handle delete distribution
  const confirmDelete = (id, sellerName, date) => {
    if (window.confirm(`Are you sure you want to delete milk distribution for "${sellerName}" on ${date}?`)) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await axios.delete(`${API_URL}/api/milk-distribution/${id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        alert('Milk distribution deleted successfully!');
        fetchMilkDistributionData();
      }
    } catch (error) {
      console.error('Error deleting milk distribution:', error);
      if (error.response?.data?.message) {
        alert(`Failed to delete milk distribution: ${error.response.data.message}`);
      } else {
        alert('Failed to delete milk distribution. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = async () => {
    if (!Array.isArray(milkDistributionData) || milkDistributionData.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExportingExcel(true);
    try {
      const excelData = milkDistributionData.map((item, index) => ({
        'Sr. No.': index + 1,
        'Seller Name': item.SellerName || 'N/A',
        'Milk Type': item.MilkType || 'N/A',
        'Price (₹/L)': item.SellerPrice || 'N/A',
        'Quantity (L)': item.TotalQty || 'N/A',
        'Total Amount (₹)': item.TotalAmount || 'N/A',
        'Fat %': item.FatPercentage || 'N/A',
        Date: item.Date ? new Date(item.Date).toLocaleDateString('en-IN') : 'N/A'
      }));

      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();

      const colWidths = [
        { wch: 8 }, // Sr. No.
        { wch: 20 }, // Seller Name
        { wch: 12 }, // Milk Type
        { wch: 12 }, // Price
        { wch: 12 }, // Quantity
        { wch: 15 }, // Total Amount
        { wch: 8 }, // Fat %
        { wch: 12 } // Date
      ];
      ws['!cols'] = colWidths;

      utils.book_append_sheet(wb, ws, 'Milk Distribution');

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `MilkDistribution_${timestamp}.xlsx`;

      writeFile(wb, filename);
      alert(`✅ Excel Export Successful!\n\nFile: ${filename}\nRecords: ${milkDistributionData.length}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`❌ Export Failed!\n\nError: ${error.message}`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export to PDF
  const handleExportToPDF = async () => {
    if (!Array.isArray(milkDistributionData) || milkDistributionData.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape for more columns
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let currentY = 20;

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Milk Distribution Report', pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      // Date and total
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('en-IN');
      pdf.text(`Generated on: ${today}`, margin, currentY);
      pdf.text(`Total Records: ${milkDistributionData.length}`, pageWidth - 50, currentY);
      currentY += 15;

      // Table headers
      const headers = ['Sr.', 'Seller', 'Type', 'Price', 'Qty(L)', 'Amount', 'Fat%', 'Date'];
      const colWidths = [15, 40, 20, 20, 20, 25, 15, 25];
      let xPos = margin;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        pdf.text(header, xPos, currentY);
        xPos += colWidths[index];
      });
      currentY += 7;

      // Table data
      pdf.setFont('helvetica', 'normal');
      milkDistributionData.forEach((distribution, index) => {
        if (currentY > 180) {
          pdf.addPage();
          currentY = 20;
        }

        xPos = margin;
        const rowData = [
          (index + 1).toString(),
          (distribution.SellerName || 'N/A').substring(0, 15),
          distribution.MilkType || 'N/A',
          `₹${distribution.SellerPrice || 0}`,
          distribution.TotalQty || 0,
          `₹${distribution.TotalAmount || 0}`,
          `${distribution.FatPercentage || 0}%`,
          distribution.Date ? new Date(distribution.Date).toLocaleDateString('en-IN') : 'N/A'
        ];

        rowData.forEach((data, colIndex) => {
          pdf.text(data.toString(), xPos, currentY);
          xPos += colWidths[colIndex];
        });
        currentY += 6;
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `MilkDistribution_${timestamp}.pdf`;
      pdf.save(filename);

      alert(`✅ PDF Export Successful!\n\nFile: ${filename}\nRecords: ${milkDistributionData.length}`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(`❌ PDF Export Failed!\n\nError: ${error.message}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Print Receipt Function
  const handlePrintReceipt = (sellerId, date) => {
    try {
      // Filter milk distribution data for the specific seller and date
      const filteredData = allMilkDistributionData.filter((distribution) => {
        const distributionDate = new Date(distribution.Date).toDateString();
        const filterDate = new Date(date).toDateString();
        return distribution.SellerId === sellerId && distributionDate === filterDate;
      });

      if (filteredData.length === 0) {
        alert('कोणताही दूध वितरण रेकॉर्ड सापडला नाही या तारखेसाठी');
        return;
      }

      // Get seller information
      const sellerInfo = sellersData.find((seller) => seller.Id === sellerId) || {};

      // Generate receipt HTML
      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>दूध वितरण पावती</title>
          <style>
            @media print {
              body { 
                margin: 0; 
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 15px;
              background: white;
              color: #000 !important;
            }
            .receipt-container {
              width: 650px;
              margin: 0 auto;
              border: 3px solid #2c5aa0 !important;
              border-radius: 12px;
              background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
              box-shadow: 0 6px 12px rgba(0,0,0,0.15);
              overflow: hidden;
            }
            .receipt-header {
              background: linear-gradient(135deg, #2c5aa0 0%, #1e3d6f 100%) !important;
              color: white !important;
              padding: 20px;
              text-align: center;
              border-bottom: 4px solid #ffd700 !important;
            }
            .blessing {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #ffd700 !important;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            .dairy-name {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
              color: white !important;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            .dairy-address {
              font-size: 15px;
              margin-bottom: 18px;
              color: #e8f0ff !important;
            }
            .receipt-info {
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid rgba(255,255,255,0.3);
              color: #e8f0ff !important;
            }
            .receipt-body {
              padding: 25px;
              background: white;
            }
            .customer-info {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              padding: 20px;
              border-radius: 10px;
              margin-bottom: 25px;
              border: 2px solid #dee2e6 !important;
            }
            .customer-info h3 {
              margin: 0 0 15px 0;
              color: #2c5aa0 !important;
              font-size: 20px;
              border-bottom: 3px solid #2c5aa0 !important;
              padding-bottom: 8px;
            }
            .customer-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-top: 15px;
            }
            .customer-field {
              font-size: 16px;
            }
            .customer-field strong {
              color: #495057 !important;
            }
            .milk-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              border: 3px solid #2c5aa0 !important;
              border-radius: 10px;
              overflow: hidden;
            }
            .milk-table th {
              background: linear-gradient(135deg, #2c5aa0 0%, #1e3d6f 100%) !important;
              color: white !important;
              padding: 15px 12px;
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              border-bottom: 3px solid #ffd700 !important;
            }
            .milk-table td {
              padding: 15px 12px;
              text-align: center;
              border-bottom: 1px solid #dee2e6 !important;
              font-size: 15px;
              background: white;
            }
            .milk-table tr:nth-child(even) td {
              background: #f8f9fa !important;
            }
            .milk-table tr:hover td {
              background: #e3f2fd !important;
            }
            .total-row {
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
              color: white !important;
              font-weight: bold;
            }
            .total-row td {
              background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
              color: white !important;
              border-bottom: none !important;
              font-size: 18px !important;
              padding: 20px 12px !important;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 25px;
              border-top: 3px solid #2c5aa0 !important;
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border-radius: 10px;
              padding: 20px;
            }
            .thank-you {
              color: #2c5aa0 !important;
              font-weight: bold;
              font-size: 20px;
              margin-bottom: 8px;
            }
            .footer-note {
              color: #6c757d !important;
              font-size: 14px;
            }
            .type-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 18px;
              font-size: 13px;
              font-weight: bold;
              color: white !important;
            }
            .type-cow {
              background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
            }
            .type-buffalo {
              background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%) !important;
              color: #000 !important;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="blessing">|| श्री तुळजा भवानी प्रसन्न ||</div>
              <div class="dairy-name">कामधेनु दुध संकलन केंद्र</div>
              <div class="dairy-address">ता. सिंगणापुर जि. परभणी</div>
              <div class="receipt-info">
                <span>तारीख: ${new Date(date).toLocaleDateString('en-IN')}</span>
                <span>पावती क्र: ${Date.now().toString().slice(-6)}</span>
              </div>
            </div>
            
            <div class="receipt-body">
              <div class="customer-info">
                <h3>ग्राहक माहिती</h3>
                <div class="customer-details">
                  <div class="customer-field">
                    <strong>नाव:</strong> ${sellerInfo.FullName || 'N/A'}
                  </div>
                  <div class="customer-field">
                    <strong>मोबाईल:</strong> ${sellerInfo.MobileNumber || 'N/A'}
                  </div>
                </div>
              </div>

              <table class="milk-table">
                <thead>
                  <tr>
                    <th>तपशील</th>
                    <th>प्रमाण</th>
                    <th>दर</th>
                    <th>रक्कम</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredData
                    .map(
                      (item) => `
                    <tr>
                      <td>
                        <span class="type-badge ${item.MilkType === 'cow' ? 'type-cow' : 'type-buffalo'}">
                          ${item.MilkType === 'cow' ? 'गाईचे दूध' : 'म्हशीचे दूध'}
                        </span>
                        <br>
                        <small>(चरबी: ${item.FatPercentage || 0}%)</small>
                      </td>
                      <td>${item.TotalQty || 0} लिटर</td>
                      <td>₹${item.SellerPrice || 0}</td>
                      <td>₹${item.TotalAmount || 0}</td>
                    </tr>
                  `
                    )
                    .join('')}
                  <tr class="total-row">
                    <td colspan="3"><strong>एकूण रक्कम</strong></td>
                    <td><strong>₹${filteredData.reduce((sum, item) => sum + (parseFloat(item.TotalAmount) || 0), 0).toFixed(2)}</strong></td>
                  </tr>
                </tbody>
              </table>

              <div class="receipt-footer">
                <div class="thank-you">धन्यवाद!</div>
                <div class="footer-note">कामधेनु दुध संकलन केंद्र</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
      } else {
        alert('कृपया पॉप-अप ब्लॉकर बंद करा आणि पुन्हा प्रयत्न करा');
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('पावती तयार करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    }
  };

  // Pagination calculations
  const totalItems = milkDistributionData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = milkDistributionData.slice(startIndex, endIndex);

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
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'Edit Milk Distribution' : 'Add New Milk Distribution'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              {apiError && (
                <div className="form-row">
                  <div className="alert alert-danger" role="alert">
                    {apiError}
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sellerId">Seller *</label>
                  <select name="sellerId" value={formData.sellerId} onChange={handleChange} disabled={loading}>
                    <option value="">Select Seller</option>
                    {sellersData.map((seller) => (
                      <option key={seller.Id} value={seller.Id}>
                        {seller.FullName} - {seller.MobileNumber}
                      </option>
                    ))}
                  </select>
                  {errors.sellerId && <span className="error">{errors.sellerId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="milkType">Milk Type *</label>
                  <select name="milkType" value={formData.milkType} onChange={handleChange} disabled={loading}>
                    <option value="">Select Milk Type</option>
                    <option value="cow">Cow Milk</option>
                    <option value="buffalo">Buffalo Milk</option>
                  </select>
                  {errors.milkType && <span className="error">{errors.milkType}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sellerPrice">Seller Price (₹/Liter) *</label>
                  <input
                    type="number"
                    name="sellerPrice"
                    value={formData.sellerPrice}
                    onChange={handleChange}
                    placeholder="Enter price per liter"
                    step="0.01"
                    min="0"
                    disabled={loading}
                  />
                  {errors.sellerPrice && <span className="error">{errors.sellerPrice}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="totalQty">Total Quantity (Liters) *</label>
                  <input
                    type="number"
                    name="totalQty"
                    value={formData.totalQty}
                    onChange={handleChange}
                    placeholder="Enter total quantity"
                    step="0.1"
                    min="0"
                    disabled={loading}
                  />
                  {errors.totalQty && <span className="error">{errors.totalQty}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading} />
                  {errors.date && <span className="error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="fatPercentage">Fat Percentage *</label>
                  <input
                    type="number"
                    name="fatPercentage"
                    value={formData.fatPercentage}
                    onChange={handleChange}
                    placeholder="Enter fat percentage"
                    step="0.1"
                    min="0"
                    max="100"
                    disabled={loading}
                  />
                  {errors.fatPercentage && <span className="error">{errors.fatPercentage}</span>}
                </div>
              </div>

              {/* Show calculated total amount preview */}
              {formData.sellerPrice && formData.totalQty && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Total Amount (Preview)</label>
                    <div className="total-amount-preview">
                      ₹{(parseFloat(formData.sellerPrice) * parseFloat(formData.totalQty)).toFixed(2)}
                    </div>
                  </div>
                  <div className="form-group">{/* Empty for layout balance */}</div>
                </div>
              )}

              <div className="form-actions">
                <Button variant="primary" type="submit" disabled={loading} style={{ marginRight: '10px' }}>
                  {loading ? 'Processing...' : isEditing ? 'Update Distribution' : 'Add Distribution'}
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
                <Card.Title as="h4">Milk Distribution List</Card.Title>
                <small className="text-muted">Total: {milkDistributionData.length} distributions</small>
              </Col>
              <Col
                md={8}
                className="d-flex flex-column flex-md-row justify-content-end align-items-stretch align-items-md-center search-filter-bar"
              >
                <Form.Control
                  type="text"
                  placeholder="Search by seller name, milk type, or date..."
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
                    disabled={isExportingExcel || isExportingPDF || milkDistributionData.length === 0}
                    style={{ minWidth: '120px' }}
                  >
                    {isExportingExcel ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                          style={{ width: '16px', height: '16px' }}
                        ></div>
                        Exporting...
                      </>
                    ) : (
                      <>📊 Excel ({milkDistributionData.length})</>
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleExportToPDF}
                    className="d-flex align-items-center justify-content-center"
                    disabled={isExportingExcel || isExportingPDF || milkDistributionData.length === 0}
                    style={{ minWidth: '120px' }}
                  >
                    {isExportingPDF ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                          style={{ width: '16px', height: '16px' }}
                        ></div>
                        Exporting...
                      </>
                    ) : (
                      <>📄 PDF ({milkDistributionData.length})</>
                    )}
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            {/* Desktop Table View */}
            <div className="d-none d-lg-block">
              <div className="table-card" style={{ height: '400px' }}>
                <PerfectScrollbar>
                  <Table
                    responsive
                    ref={tableRef}
                    className="table-bordered mb-0"
                    style={{
                      border: '1px solid #dee2e6',
                      borderCollapse: 'collapse'
                    }}
                  >
                    <thead>
                      <tr>
                        <th>Sr. No.</th>
                        <th>Seller Name</th>
                        <th>Milk Type</th>
                        <th>Price (₹/L)</th>
                        <th>Quantity (L)</th>
                        <th>Total Amount (₹)</th>
                        <th>Fat %</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            <div className="spinner-border" role="status">
                              <span className="sr-only">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : currentData.length > 0 ? (
                        currentData.map((distribution, index) => (
                          <tr key={distribution.Id}>
                            <td>{startIndex + index + 1}</td>
                            <td>{distribution.SellerName}</td>
                            <td>
                              <span className={`badge ${distribution.MilkType === 'cow' ? 'bg-primary' : 'bg-warning'}`}>
                                {distribution.MilkType === 'cow' ? 'Cow' : 'Buffalo'}
                              </span>
                            </td>
                            <td>₹{distribution.SellerPrice}</td>
                            <td>{distribution.TotalQty} L</td>
                            <td>₹{distribution.TotalAmount}</td>
                            <td>{distribution.FatPercentage}%</td>
                            <td>{distribution.Date ? new Date(distribution.Date).toLocaleDateString('en-IN') : 'N/A'}</td>
                            <td>
                              <Button
                                variant="success"
                                size="sm"
                                className="me-2"
                                onClick={() => handlePrintReceipt(distribution.SellerId, distribution.Date)}
                                disabled={loading}
                                title="Print Receipt"
                              >
                                <FaPrint />
                              </Button>
                              <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEditDistribution(distribution.Id)}
                                disabled={loading}
                                title="Edit Distribution"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  confirmDelete(
                                    distribution.Id,
                                    distribution.SellerName,
                                    new Date(distribution.Date).toLocaleDateString('en-IN')
                                  )
                                }
                                disabled={loading}
                                title="Delete Distribution"
                              >
                                <FaTrashAlt />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            {searchTerm ? 'No distributions found matching your search.' : 'No distributions found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </PerfectScrollbar>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="d-lg-none">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : currentData.length > 0 ? (
                <div className="mobile-cards-container">
                  {currentData.map((distribution, index) => (
                    <div key={distribution.Id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="mobile-card-title">{distribution.SellerName}</div>
                        <div className="mobile-card-number">#{startIndex + index + 1}</div>
                      </div>

                      <div className="mobile-card-body">
                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Milk Type</div>
                            <div className="mobile-info-value">
                              <span className={`badge ${distribution.MilkType === 'cow' ? 'bg-primary' : 'bg-warning'}`}>
                                {distribution.MilkType === 'cow' ? 'Cow' : 'Buffalo'}
                              </span>
                            </div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Price/L</div>
                            <div className="mobile-info-value highlight">₹{distribution.SellerPrice}</div>
                          </div>
                        </div>

                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Quantity</div>
                            <div className="mobile-info-value">{distribution.TotalQty} L</div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Total Amount</div>
                            <div className="mobile-info-value highlight">₹{distribution.TotalAmount}</div>
                          </div>
                        </div>

                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Fat %</div>
                            <div className="mobile-info-value">{distribution.FatPercentage}%</div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Date</div>
                            <div className="mobile-info-value">
                              {distribution.Date ? new Date(distribution.Date).toLocaleDateString('en-IN') : 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mobile-card-actions">
                        <Button
                          variant="success"
                          onClick={() => handlePrintReceipt(distribution.SellerId, distribution.Date)}
                          disabled={loading}
                          className="mobile-action-btn"
                        >
                          <FaPrint className="me-1" /> Print
                        </Button>
                        <Button
                          variant="info"
                          onClick={() => handleEditDistribution(distribution.Id)}
                          disabled={loading}
                          className="mobile-action-btn"
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() =>
                            confirmDelete(distribution.Id, distribution.SellerName, new Date(distribution.Date).toLocaleDateString('en-IN'))
                          }
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
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-message">
                    {searchTerm ? 'No distributions found matching your search.' : 'No milk distributions found.'}
                  </div>
                  {searchTerm && <div className="empty-state-suggestion">Try adjusting your search terms or add a new distribution.</div>}
                </div>
              )}
            </div>

            {/* Responsive Pagination */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  <small className="text-muted">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                    {searchTerm && ` (filtered from ${allMilkDistributionData.length} total entries)`}
                  </small>
                </div>

                <div className="pagination-controls">
                  <Button variant="outline-secondary" onClick={handlePrevPage} disabled={currentPage === 1} className="pagination-btn">
                    <span className="d-none d-sm-inline">Previous</span>
                    <span className="d-sm-none">Prev</span>
                  </Button>

                  <div className="pagination-numbers">
                    {getPageNumbers().map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? 'primary' : 'outline-primary'}
                        onClick={() => handlePageChange(pageNum)}
                        className="pagination-number"
                      >
                        {pageNum}
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

export default MilkDistribution;
