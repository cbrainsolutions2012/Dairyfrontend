import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import axios from 'axios';
import { FaEdit, FaTrashAlt, FaPrint } from 'react-icons/fa';
import '../commonemp.scss';

function MilkStore() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [milkStoreData, setMilkStoreData] = useState([]);
  const [allMilkStoreData, setAllMilkStoreData] = useState([]);
  const [buyersData, setBuyersData] = useState([]); // For buyer dropdown
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isEditing, setIsEditing] = useState(false);
  const [editingMilkStoreId, setEditingMilkStoreId] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    buyerId: '',
    milkType: 'cow',
    buyerPrice: '',
    totalQty: '',
    date: new Date().toISOString().split('T')[0], // Today's date
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
      setMilkStoreData(allMilkStoreData);
    } else {
      const filteredData = allMilkStoreData.filter(
        (milk) =>
          (milk.BuyerName || '').toLowerCase().includes(value.toLowerCase()) ||
          (milk.MilkType || '').toLowerCase().includes(value.toLowerCase()) ||
          (milk.Date || '').includes(value) ||
          (milk.BuyerPrice || '').toString().includes(value) ||
          (milk.TotalQty || '').toString().includes(value)
      );
      setMilkStoreData(filteredData);
    }
  };

  // Clear form and reset to add new milk purchase
  const handleClearForm = () => {
    setFormData({
      buyerId: '',
      milkType: 'cow',
      buyerPrice: '',
      totalQty: '',
      date: new Date().toISOString().split('T')[0],
      fatPercentage: ''
    });
    setIsEditing(false);
    setEditingMilkStoreId(null);
    setErrors({});
    setApiError('');
  };

  // Handle edit milk purchase
  const handleEditMilkPurchase = async (milkStoreId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/milk-store/${milkStoreId}`, {
        headers: getAuthHeaders()
      });

      if (res.data.success && res.data.data.milkPurchase) {
        const milk = res.data.data.milkPurchase;
        setFormData({
          buyerId: milk.BuyerId || '',
          milkType: milk.MilkType || 'cow',
          buyerPrice: milk.BuyerPrice || '',
          totalQty: milk.TotalQty || '',
          date: milk.Date ? milk.Date.split('T')[0] : new Date().toISOString().split('T')[0],
          fatPercentage: milk.FatPercentage || ''
        });
        setIsEditing(true);
        setEditingMilkStoreId(milkStoreId);
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching milk purchase for edit:', error);
      setApiError('Failed to load milk purchase data for editing.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch milk store data
  const fetchMilkStoreData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/milk-store?includeDetails=true`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        const data = res.data.data.milkPurchases || [];
        setAllMilkStoreData(data);
        setMilkStoreData(data);
        setApiError('');
      }
    } catch (error) {
      console.error('Error fetching milk store data:', error);
      setApiError('Failed to fetch milk store data.');
      setAllMilkStoreData([]);
      setMilkStoreData([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Fetch buyers for dropdown
  const fetchBuyersData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/buyers`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        setBuyersData(res.data.data.buyers || []);
      }
    } catch (error) {
      console.error('Error fetching buyers data:', error);
      setBuyersData([]);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchMilkStoreData();
    fetchBuyersData();
  }, [fetchMilkStoreData, fetchBuyersData]);

  // Validation function
  const validate = () => {
    const newErrors = {};

    if (!formData.buyerId) {
      newErrors.buyerId = 'Buyer is required';
    }

    if (!formData.milkType) {
      newErrors.milkType = 'Milk type is required';
    }

    if (!formData.buyerPrice.trim()) {
      newErrors.buyerPrice = 'Buyer price is required';
    } else if (isNaN(formData.buyerPrice) || parseFloat(formData.buyerPrice) <= 0) {
      newErrors.buyerPrice = 'Buyer price must be a positive number';
    }

    if (!formData.totalQty.trim()) {
      newErrors.totalQty = 'Total quantity is required';
    } else if (isNaN(formData.totalQty) || parseFloat(formData.totalQty) <= 0) {
      newErrors.totalQty = 'Total quantity must be a positive number';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.fatPercentage.trim()) {
      newErrors.fatPercentage = 'Fat percentage is required';
    } else if (isNaN(formData.fatPercentage) || parseFloat(formData.fatPercentage) <= 0 || parseFloat(formData.fatPercentage) > 100) {
      newErrors.fatPercentage = 'Fat percentage must be between 0 and 100';
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
          buyerId: parseInt(formData.buyerId),
          milkType: formData.milkType,
          buyerPrice: parseFloat(formData.buyerPrice),
          totalQty: parseFloat(formData.totalQty),
          date: formData.date,
          fatPercentage: parseFloat(formData.fatPercentage)
        };

        let response;
        if (isEditing && editingMilkStoreId) {
          // Update existing milk purchase
          response = await axios.put(`${API_URL}/api/milk-store/${editingMilkStoreId}`, submitData, {
            headers: getAuthHeaders()
          });
          if (response.data.success) {
            alert('Milk purchase updated successfully!');
          }
        } else {
          // Create new milk purchase
          response = await axios.post(`${API_URL}/api/milk-store`, submitData, {
            headers: getAuthHeaders()
          });
          if (response.data.success) {
            alert('Milk purchase recorded successfully!');
          }
        }

        // Reset form and refresh data
        handleClearForm();
        fetchMilkStoreData();
      } catch (error) {
        console.error('Error submitting milk purchase:', error);

        if (error.response?.status === 400) {
          setApiError(error.response.data.message || 'Invalid data provided. Please check all fields.');
        } else if (error.response?.status === 404) {
          setApiError('Buyer not found. Please select a valid buyer.');
        } else if (error.response?.data?.message) {
          setApiError(error.response.data.message);
        } else {
          setApiError('Failed to save milk purchase. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(formErrors);
    }
  };

  // Handle delete milk purchase
  const confirmDelete = (id, buyerName, date) => {
    if (window.confirm(`Are you sure you want to delete milk purchase for "${buyerName}" on ${date}?`)) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await axios.delete(`${API_URL}/api/milk-store/${id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        alert('Milk purchase deleted successfully!');
        fetchMilkStoreData();
      }
    } catch (error) {
      console.error('Error deleting milk purchase:', error);
      if (error.response?.data?.message) {
        alert(`Failed to delete milk purchase: ${error.response.data.message}`);
      } else {
        alert('Failed to delete milk purchase. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const handleExportToExcel = async () => {
    if (!Array.isArray(milkStoreData) || milkStoreData.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExportingExcel(true);
    try {
      const excelData = milkStoreData.map((item, index) => ({
        'Sr. No.': index + 1,
        'Buyer Name': item.BuyerName || 'N/A',
        'Milk Type': item.MilkType || 'N/A',
        Date: item.Date ? new Date(item.Date).toLocaleDateString('en-IN') : 'N/A',
        'Quantity (Liters)': item.TotalQty || 0,
        'Fat %': item.FatPercentage || 0,
        'Price per Liter': item.BuyerPrice || 0,
        'Total Amount': item.TotalAmount || 0,
        'Created Date': item.CreatedAt ? new Date(item.CreatedAt).toLocaleDateString('en-IN') : 'N/A'
      }));

      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();

      const colWidths = [
        { wch: 8 }, // Sr. No.
        { wch: 25 }, // Buyer Name
        { wch: 12 }, // Milk Type
        { wch: 12 }, // Date
        { wch: 15 }, // Quantity
        { wch: 8 }, // Fat %
        { wch: 15 }, // Price per Liter
        { wch: 15 }, // Total Amount
        { wch: 15 } // Created Date
      ];
      ws['!cols'] = colWidths;

      utils.book_append_sheet(wb, ws, 'Milk Store');

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `MilkStore_${timestamp}.xlsx`;

      writeFile(wb, filename);

      alert(`✅ Excel Export Successful!\n\nFile: ${filename}\nRecords: ${milkStoreData.length}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`❌ Export Failed!\n\nError: ${error.message}`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export to PDF
  const handleExportToPDF = async () => {
    if (!Array.isArray(milkStoreData) || milkStoreData.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExportingPDF(true);
    try {
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let currentY = 20;

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Milk Store Report', pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;

      // Date and total
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('en-IN');
      pdf.text(`Generated on: ${today}`, margin, currentY);
      pdf.text(`Total Records: ${milkStoreData.length}`, pageWidth - 50, currentY);
      currentY += 15;

      // Table headers
      const headers = ['Sr.', 'Buyer', 'Type', 'Date', 'Qty(L)', 'Fat%', 'Price', 'Amount'];
      const colWidths = [15, 35, 20, 25, 20, 15, 20, 25];
      let xPos = margin;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, index) => {
        pdf.text(header, xPos, currentY);
        xPos += colWidths[index];
      });
      currentY += 7;

      // Table data
      pdf.setFont('helvetica', 'normal');
      milkStoreData.forEach((milk, index) => {
        if (currentY > 180) {
          // Start new page if needed
          pdf.addPage();
          currentY = 20;
        }

        xPos = margin;
        const rowData = [
          (index + 1).toString(),
          (milk.BuyerName || 'N/A').substring(0, 15),
          milk.MilkType || 'N/A',
          milk.Date ? new Date(milk.Date).toLocaleDateString('en-IN') : 'N/A',
          (milk.TotalQty || 0).toString(),
          (milk.FatPercentage || 0).toString(),
          (milk.BuyerPrice || 0).toString(),
          (milk.TotalAmount || 0).toString()
        ];

        rowData.forEach((data, colIndex) => {
          pdf.text(data, xPos, currentY);
          xPos += colWidths[colIndex];
        });
        currentY += 6;
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `MilkStore_${timestamp}.pdf`;
      pdf.save(filename);

      alert(`✅ PDF Export Successful!\n\nFile: ${filename}\nRecords: ${milkStoreData.length}`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(`❌ PDF Export Failed!\n\nError: ${error.message}`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Print Receipt Function
  const handlePrintReceipt = (buyerId, date) => {
    try {
      // Filter milk purchases for the specific buyer and date
      const buyerMilkData = allMilkStoreData.filter((milk) => {
        const milkDate = new Date(milk.Date).toISOString().split('T')[0];
        const targetDate = new Date(date).toISOString().split('T')[0];
        return milk.BuyerId === buyerId && milkDate === targetDate;
      });

      if (buyerMilkData.length === 0) {
        alert('No milk purchases found for this buyer on this date.');
        return;
      }

      // Get buyer information
      const buyer = buyersData.find((b) => b.Id === buyerId);
      if (!buyer) {
        alert('Buyer information not found.');
        return;
      }

      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      if (isMobile) {
        // Mobile-friendly approach
        handleMobilePrint(buyer, buyerMilkData, date, buyerId);
      } else {
        // Desktop approach
        handleDesktopPrint(buyer, buyerMilkData, date, buyerId);
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  // Mobile print function
  const handleMobilePrint = (buyer, buyerMilkData, date, buyerId) => {
    const receiptHtml = generateReceiptHTML(buyer, buyerMilkData, date, buyerId);

    // Create a blob with the HTML content
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Open in same window for mobile browsers
    const currentContent = document.body.innerHTML;
    document.body.innerHTML = receiptHtml;

    // Add print styles to current document
    const printStyle = document.createElement('style');
    printStyle.innerHTML = `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body {
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: black !important;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    // Force immediate print
    setTimeout(() => {
      window.print();

      // Restore original content after print
      setTimeout(() => {
        document.body.innerHTML = currentContent;
        document.head.removeChild(printStyle);
        URL.revokeObjectURL(url);
        // Reload the page to restore React state
        window.location.reload();
      }, 1000);
    }, 500);
  };

  // Desktop print function
  const handleDesktopPrint = (buyer, buyerMilkData, date, buyerId) => {
    const receiptHtml = generateReceiptHTML(buyer, buyerMilkData, date, buyerId);

    try {
      // Try to open new window
      const printWindow = window.open('', '_blank', 'width=800,height=600');

      if (!printWindow) {
        // Fallback to mobile method if popup is blocked
        alert('Popup blocked. Using alternative print method...');
        handleMobilePrint(buyer, buyerMilkData, date, buyerId);
        return;
      }

      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();

      // Add script to enable background printing
      const script = printWindow.document.createElement('script');
      script.innerHTML = `
        window.addEventListener('beforeprint', function() {
          document.body.style.webkitPrintColorAdjust = 'exact';
          document.body.style.colorAdjust = 'exact';
        });
        
        window.addEventListener('afterprint', function() {
          window.close();
        });
      `;
      printWindow.document.head.appendChild(script);

      setTimeout(() => {
        printWindow.print();
      }, 1000);
    } catch (error) {
      console.error('Desktop print failed, using mobile method:', error);
      handleMobilePrint(buyer, buyerMilkData, date, buyerId);
    }
  };

  // Generate receipt HTML (shared function)
  const generateReceiptHTML = (buyer, buyerMilkData, date, buyerId) => {
    const receiptNo = `R${Date.now()}${buyerId}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Milk Purchase Receipt</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 20px; 
            font-size: 14px;
            color: #333;
            line-height: 1.5;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .receipt-container { 
            max-width: 480px; 
            margin: 0 auto; 
            border-radius: 15px;
            padding: 20px;
            background: white;
            border: 3px solid #4CAF50;
          }
          .header { 
            text-align: center; 
            border: 3px solid #4CAF50;
            color: #2E7D32;
            border-radius: 10px;
            padding: 15px; 
            margin-bottom: 20px; 
            background-color: #E8F5E9;
          }
          .dairy-name { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 8px; 
            color: #1B5E20;
          }
          .address { 
            font-size: 12px; 
            color: #388E3C; 
            line-height: 1.4;
            margin-top: 10px;
          }
          .receipt-info { 
            margin: 20px 0; 
            font-size: 13px;
            background-color: #F3E5F5;
            padding: 15px;
            border-radius: 10px;
            border-left: 5px solid #9C27B0;
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 5px 0;
            border-bottom: 1px solid #E1BEE7;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .info-left {
            font-weight: bold;
            color: #7B1FA2;
          }
          .info-right {
            font-weight: 600;
            color: #333;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-size: 12px;
            border-radius: 10px;
            overflow: hidden;
          }
          .table th, .table td { 
            padding: 8px; 
            text-align: left; 
            border: 1px solid #ddd;
          }
          .table th { 
            background-color: #FFE0B2;
            color: #E65100;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
          }
          .table td { 
            font-size: 11px; 
            background: white;
          }
          .total-row { 
            font-weight: bold; 
            background-color: #C8E6C9;
            color: #1B5E20;
          }
          .total-row td {
            background-color: #C8E6C9;
            color: #1B5E20;
            font-weight: bold;
          }
          .text-right { 
            text-align: right; 
          }
          .text-center { 
            text-align: center; 
          }
          .footer {
            text-align: center; 
            margin-top: 20px; 
            font-size: 11px; 
            color: #666;
            background: #f8f9fa;
            border-radius: 10px;
            padding: 15px;
            border-top: 3px solid #4CAF50;
          }
          .footer .thank-you {
            font-size: 14px; 
            font-weight: bold; 
            color: #4CAF50;
            margin-bottom: 10px;
          }
          .milk-item {
            color: #7B1FA2;
            font-weight: 600;
          }
          .amount-highlight {
            color: #4CAF50;
            font-weight: bold;
          }
          
          @media print {
            @page {
              size: A4;
              margin: 0.5in;
            }
            body { 
              margin: 0; 
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .receipt-container { 
              border: 2px solid #4CAF50 !important;
              box-shadow: none;
              max-width: none;
              border-radius: 0;
              margin: 0;
              padding: 15px;
            }
            .header {
              background-color: #E8F5E9 !important;
              border: 2px solid #4CAF50 !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .dairy-name {
              color: #1B5E20 !important;
              -webkit-print-color-adjust: exact !important;
            }
            .address {
              color: #388E3C !important;
              -webkit-print-color-adjust: exact !important;
            }
            .receipt-info {
              background-color: #F3E5F5 !important;
              -webkit-print-color-adjust: exact !important;
            }
            .info-left {
              color: #7B1FA2 !important;
              -webkit-print-color-adjust: exact !important;
            }
            .table th {
              background-color: #FFE0B2 !important;
              color: #E65100 !important;
              -webkit-print-color-adjust: exact !important;
            }
            .total-row td {
              background-color: #C8E6C9 !important;
              color: #1B5E20 !important;
              -webkit-print-color-adjust: exact !important;
            }
            .footer {
              background-color: #f8f9fa !important;
              -webkit-print-color-adjust: exact !important;
            }
            .footer .thank-you {
              color: #4CAF50 !important;
              -webkit-print-color-adjust: exact !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          @media screen and (max-width: 600px) {
            .receipt-container {
              margin: 10px;
              padding: 15px;
            }
            .table {
              font-size: 10px;
            }
            .table th, .table td {
              padding: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div style="font-size: 10px; margin-bottom: 5px; color: #666; text-align: center;">|| श्री तुळजा भवानी प्रसन्न ||</div>
            <div class="dairy-name">🥛 कामधेनु दुध संकलन केंद्र 🥛</div>
            <div class="address">
              ता. सिंगणापुर जि. परभणी<br>
              Phone: +91 98765 43210
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 11px; font-weight: bold;">
              <span>📅 दिनांक: ${new Date(date).toLocaleDateString('en-IN')}</span>
              <span>🧾 रसीद क्र.: ${receiptNo}</span>
            </div>
          </div>
          
          <div class="receipt-info">
            <div class="info-row">
              <span class="info-left">👤 नाव:</span>
              <span class="info-right">${buyer.FullName || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-left">📱 मोबाईल:</span>
              <span class="info-right">${buyer.MobileNumber || 'N/A'}</span>
            </div>
          </div>
          
          <table class="table">
            <thead>
              <tr>
                <th style="width: 45%">तपशील</th>
                <th style="width: 18%">प्रमाण (लि)</th>
                <th style="width: 18%">दर (₹)</th>
                <th style="width: 19%">रक्कम (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${buyerMilkData
                .map(
                  (milk) => `
                <tr>
                  <td><span class="milk-item">${milk.MilkType === 'cow' ? '🐄 गाई दूध' : '🐃 म्हैस दूध'}</span><br><small style="color: #666;">(${milk.FatPercentage}% Fat)</small></td>
                  <td class="text-right"><strong>${parseFloat(milk.TotalQty).toFixed(2)}</strong></td>
                  <td class="text-right">₹${parseFloat(milk.BuyerPrice).toFixed(2)}</td>
                  <td class="text-right amount-highlight">₹${parseFloat(milk.TotalAmount).toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
              <tr class="total-row">
                <td><strong>🏆 एकूण</strong></td>
                <td class="text-right"><strong>${buyerMilkData.reduce((sum, milk) => sum + parseFloat(milk.TotalQty || 0), 0).toFixed(2)} लि</strong></td>
                <td class="text-center"><strong>-</strong></td>
                <td class="text-right"><strong>₹${buyerMilkData.reduce((sum, milk) => sum + parseFloat(milk.TotalAmount || 0), 0).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <div class="thank-you">🙏 आपल्या व्यवसायाबद्दल धन्यवाद! 🙏</div>
            <div style="margin-top: 10px; color: #4CAF50; font-weight: bold;">💚 कामधेनु दुध संकलन केंद्र 💚</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Calculate total amount
  const calculateTotalAmount = () => {
    if (formData.buyerPrice && formData.totalQty) {
      return (parseFloat(formData.buyerPrice) * parseFloat(formData.totalQty)).toFixed(2);
    }
    return '0.00';
  };

  // Pagination calculations
  const totalItems = milkStoreData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = milkStoreData.slice(startIndex, endIndex);

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
              {isEditing ? 'Edit Milk Purchase' : 'Add New Milk Purchase'}
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
                  <label htmlFor="buyerId">Buyer *</label>
                  <select name="buyerId" value={formData.buyerId} onChange={handleChange} disabled={loading}>
                    <option value="">Select Buyer</option>
                    {buyersData.map((buyer) => (
                      <option key={buyer.Id} value={buyer.Id}>
                        {buyer.FullName} - {buyer.MobileNumber}
                      </option>
                    ))}
                  </select>
                  {errors.buyerId && <span className="error">{errors.buyerId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="milkType">Milk Type *</label>
                  <select name="milkType" value={formData.milkType} onChange={handleChange} disabled={loading}>
                    <option value="cow">Cow</option>
                    <option value="buffalo">Buffalo</option>
                  </select>
                  {errors.milkType && <span className="error">{errors.milkType}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="totalQty">Quantity (Liters) *</label>
                  <input
                    type="number"
                    name="totalQty"
                    value={formData.totalQty}
                    onChange={handleChange}
                    placeholder="Enter quantity in liters"
                    step="0.01"
                    min="0"
                    disabled={loading}
                  />
                  {errors.totalQty && <span className="error">{errors.totalQty}</span>}
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="buyerPrice">Price per Liter *</label>
                  <input
                    type="number"
                    name="buyerPrice"
                    value={formData.buyerPrice}
                    onChange={handleChange}
                    placeholder="Enter price per liter"
                    step="0.01"
                    min="0"
                    disabled={loading}
                  />
                  {errors.buyerPrice && <span className="error">{errors.buyerPrice}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading} />
                  {errors.date && <span className="error">{errors.date}</span>}
                </div>
              </div>

              {formData.buyerPrice && formData.totalQty && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Total Amount</label>
                    <input
                      type="text"
                      value={`₹ ${calculateTotalAmount()}`}
                      disabled
                      style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
                    />
                  </div>
                  <div className="form-group">{/* Empty for layout balance */}</div>
                </div>
              )}

              <div className="form-actions">
                <Button variant="primary" type="submit" disabled={loading} style={{ marginRight: '10px' }}>
                  {loading ? 'Processing...' : isEditing ? 'Update Purchase' : 'Add Purchase'}
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
                <Card.Title as="h4">Milk Store Records</Card.Title>
                <small className="text-muted">Total: {milkStoreData.length} records</small>
              </Col>
              <Col
                md={8}
                className="d-flex flex-column flex-md-row justify-content-end align-items-stretch align-items-md-center search-filter-bar"
              >
                <Form.Control
                  type="text"
                  placeholder="Search by buyer, type, date..."
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
                    disabled={isExportingExcel || isExportingPDF || milkStoreData.length === 0}
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
                      <>📊 Excel ({milkStoreData.length})</>
                    )}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleExportToPDF}
                    className="d-flex align-items-center justify-content-center"
                    disabled={isExportingExcel || isExportingPDF || milkStoreData.length === 0}
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
                      <>📄 PDF ({milkStoreData.length})</>
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
                        <th>Buyer Name</th>
                        <th>Milk Type</th>
                        <th>Date</th>
                        <th>Qty (L)</th>
                        <th>Fat %</th>
                        <th>Price/L</th>
                        <th>Total Amount</th>
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
                        currentData.map((milk, index) => (
                          <tr key={milk.Id}>
                            <td>{startIndex + index + 1}</td>
                            <td>{milk.BuyerName}</td>
                            <td>
                              <span className={`badge ${milk.MilkType === 'cow' ? 'bg-primary' : 'bg-warning'}`}>
                                {milk.MilkType === 'cow' ? 'Cow' : 'Buffalo'}
                              </span>
                            </td>
                            <td>{milk.Date ? new Date(milk.Date).toLocaleDateString('en-IN') : 'N/A'}</td>
                            <td>{milk.TotalQty} L</td>
                            <td>{milk.FatPercentage}%</td>
                            <td>₹{milk.BuyerPrice}</td>
                            <td>₹{milk.TotalAmount}</td>
                            <td>
                              <Button
                                variant="success"
                                size="sm"
                                className="me-2"
                                onClick={() => handlePrintReceipt(milk.BuyerId, milk.Date)}
                                disabled={loading}
                                title="Print Receipt"
                              >
                                <FaPrint />
                              </Button>
                              <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEditMilkPurchase(milk.Id)}
                                disabled={loading}
                                title="Edit Milk Purchase"
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => confirmDelete(milk.Id, milk.BuyerName, new Date(milk.Date).toLocaleDateString('en-IN'))}
                                disabled={loading}
                                title="Delete Milk Purchase"
                              >
                                <FaTrashAlt />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center py-4">
                            {searchTerm ? 'No milk purchases found matching your search.' : 'No milk purchases found.'}
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
                  {currentData.map((milk, index) => (
                    <div key={milk.Id} className="mobile-card">
                      <div className="mobile-card-header">
                        <div className="mobile-card-title">{milk.BuyerName}</div>
                        <div className="mobile-card-number">#{startIndex + index + 1}</div>
                      </div>

                      <div className="mobile-card-body">
                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Milk Type</div>
                            <div className="mobile-info-value">
                              <span className={`badge ${milk.MilkType === 'cow' ? 'bg-primary' : 'bg-warning'}`}>
                                {milk.MilkType === 'cow' ? 'Cow' : 'Buffalo'}
                              </span>
                            </div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Date</div>
                            <div className="mobile-info-value">{milk.Date ? new Date(milk.Date).toLocaleDateString('en-IN') : 'N/A'}</div>
                          </div>
                        </div>

                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Quantity</div>
                            <div className="mobile-info-value">{milk.TotalQty} L</div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Fat %</div>
                            <div className="mobile-info-value">{milk.FatPercentage}%</div>
                          </div>
                        </div>

                        <div className="mobile-info-group">
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Price/L</div>
                            <div className="mobile-info-value highlight">₹{milk.BuyerPrice}</div>
                          </div>
                          <div className="mobile-info-item">
                            <div className="mobile-info-label">Total Amount</div>
                            <div className="mobile-info-value highlight">₹{milk.TotalAmount}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mobile-card-actions">
                        <Button
                          variant="success"
                          onClick={() => handlePrintReceipt(milk.BuyerId, milk.Date)}
                          disabled={loading}
                          className="mobile-action-btn"
                        >
                          <FaPrint className="me-1" /> Print
                        </Button>
                        <Button
                          variant="info"
                          onClick={() => handleEditMilkPurchase(milk.Id)}
                          disabled={loading}
                          className="mobile-action-btn"
                        >
                          <FaEdit className="me-1" /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => confirmDelete(milk.Id, milk.BuyerName, new Date(milk.Date).toLocaleDateString('en-IN'))}
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
                  <div className="empty-state-icon">🥛</div>
                  <div className="empty-state-message">
                    {searchTerm ? 'No milk purchases found matching your search.' : 'No milk purchases found.'}
                  </div>
                  {searchTerm && <div className="empty-state-suggestion">Try adjusting your search terms or add a new purchase.</div>}
                </div>
              )}
            </div>

            {/* Responsive Pagination */}
            {totalPages > 1 && (
              <div className="pagination-wrapper">
                <div className="pagination-info">
                  <small className="text-muted">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                    {searchTerm && ` (filtered from ${allMilkStoreData.length} total entries)`}
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

export default MilkStore;
