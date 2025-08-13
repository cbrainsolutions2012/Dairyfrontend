import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../views/commonemp.scss';
import { FaEdit, FaTrashAlt, FaWhatsapp } from 'react-icons/fa';

function GoSevaReceipt() {
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [devoteeFound, setDevoteeFound] = useState(false);
  const [receiptData, setReceiptData] = useState([]);
  const [allReceiptData, setAllReceiptData] = useState([]); // Store all data for search/filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [gotraList, setGotraList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingReceiptId, setEditingReceiptId] = useState(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(null); // Track sending state for WhatsApp

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
    DurationMonths: '',
    PaymentType: '',
    BankName: '',
    DDNo: '',
    ChequeNo: '',
    Amount: '',
    Note: '',
    StartDate: '',
    TransactionId: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert PAN card input to uppercase
    const finalValue = name === 'PanCard' ? value.toUpperCase() : value;
    setFormData({ ...formData, [name]: finalValue });
  };
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching

    if (value === '') {
      setReceiptData(allReceiptData); // Show all data if search term is empty
    } else {
      const filteredData = allReceiptData.filter(
        (receipt) =>
          (receipt.DonarName || '').toLowerCase().includes(value.toLowerCase()) ||
          (receipt.DengidarName || '').toLowerCase().includes(value.toLowerCase()) ||
          (receipt.ReceiptNo || '').toString().toLowerCase().includes(value.toLowerCase()) ||
          (receipt.DengidarPhone || '').includes(value) ||
          (receipt.PaymentType || '').toLowerCase().includes(value.toLowerCase())
      );
      setReceiptData(filteredData);
    }
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
      DurationMonths: '',
      PaymentType: '',
      BankName: '',
      DDNo: '',
      ChequeNo: '',
      Amount: '',
      Note: '',
      StartDate: '',
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
      const res = await axios.get(`https://api.mytemplesoftware.in/api/goseva/${receiptId}`, {
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
          FullName: receipt.DonarName || receipt.DengidarName || '',
          MobileNumber: receipt.DengidarPhone || '',
          PanCard: receipt.PanCard || '',
          AdharCard: receipt.AdharCard || '',
          GotraTypeId: receipt.GotraTypeId || '',
          City: receipt.City || '',
          Address: receipt.DengidarAddress || '',
          EmailId: receipt.EmailId || '',
          DOB: receipt.DOB ? new Date(receipt.DOB).toISOString().split('T')[0] : '',

          // Receipt fields
          DurationMonths: receipt.DurationMonths,
          PaymentType: receipt.PaymentType,
          BankName: receipt.BankName || '',
          DDNo: receipt.DDNo || '',
          ChequeNo: receipt.ChequeNo || '',
          Amount: receipt.Amount,
          Note: receipt.Note || '',
          StartDate: receipt.StartDate ? new Date(receipt.StartDate).toISOString().split('T')[0] : '',
          TransactionId: receipt.TransactionId || ''
        });
        setDevoteeFound(true);
        setIsEditing(true);
        setEditingReceiptId(receiptId);
        setSearchTerm(receipt.DengidarPhone || '');
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
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  // Fetch receipt data for table
  const fetchReceiptData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/goseva', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        const data = res.data.data || [];
        setAllReceiptData(data); // Store all data for search/filter
        setReceiptData(data); // Set current display data
      }
    } catch (error) {
      console.error('Error fetching receipt data:', error);
      setAllReceiptData([]);
      setReceiptData([]);
    }
  };

  useEffect(() => {
    fetchDropdownData();
    fetchReceiptData();
  }, []);

  const handleExportToExcel = async () => {
    if (!Array.isArray(receiptData) || receiptData.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExportingExcel(true);
    try {
      // Format date helper function
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return 'Invalid Date';
        }
      };

      // Prepare data for Excel export with enhanced formatting
      const excelData = receiptData.map((item, index) => ({
        'Sr. No.': index + 1,
        'Receipt No.': item.ReceiptNo || 'N/A',
        'Donor Name': item.DonarName || item.DengidarName || 'N/A',
        Phone: item.DengidarPhone || 'N/A',
        Address: item.DengidarAddress || 'N/A',
        'Duration (Months)': item.DurationMonths || 'N/A',
        'Amount (₹)': item.Amount ? `${parseFloat(item.Amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '0.00',
        'Payment Type': item.PaymentType || 'N/A',
        'Bank Name': item.BankName || 'N/A',
        'DD No.': item.DDNo || 'N/A',
        'Cheque No.': item.ChequeNo || 'N/A',
        'Transaction ID': item.TransactionId || 'N/A',
        'Start Date': formatDate(item.StartDate),
        'End Date': formatDate(item.EndDate),
        Status: item.Status || 'Active',
        Note: item.Note || '',
        'Created By': item.CreatedByName || 'N/A',
        'Days Until Expiry': item.DaysUntilExpiry || 'N/A',
        'Created Date': formatDate(item.CreatedDate)
      }));

      // Create workbook and worksheet
      const ws = utils.json_to_sheet(excelData);
      const wb = utils.book_new();

      // Enhanced column widths for better presentation
      const colWidths = [
        { wch: 8 }, // Sr. No.
        { wch: 15 }, // Receipt No.
        { wch: 25 }, // Donor Name
        { wch: 15 }, // Phone
        { wch: 30 }, // Address
        { wch: 12 }, // Duration
        { wch: 15 }, // Amount
        { wch: 15 }, // Payment Type
        { wch: 20 }, // Bank Name
        { wch: 15 }, // DD No.
        { wch: 15 }, // Cheque No.
        { wch: 20 }, // Transaction ID
        { wch: 12 }, // Start Date
        { wch: 12 }, // End Date
        { wch: 10 }, // Status
        { wch: 30 }, // Note
        { wch: 15 }, // Created By
        { wch: 15 }, // Days Until Expiry
        { wch: 15 } // Created Date
      ];
      ws['!cols'] = colWidths;

      // Add header styling and metadata
      const range = utils.decode_range(ws['!ref']);

      // Style header row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }

      // Add worksheet with title
      const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      utils.book_append_sheet(wb, ws, 'GoSeva Receipts');

      // Add summary sheet
      const summaryData = [
        ['GoSeva Receipts Report Summary'],
        [''],
        ['Generated On:', today],
        ['Total Records:', receiptData.length],
        [
          'Total Amount:',
          `₹${receiptData.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        ],
        ['Active Receipts:', receiptData.filter((item) => item.Status !== 'Expired').length],
        ['Expired Receipts:', receiptData.filter((item) => item.Status === 'Expired').length],
        [''],
        ['Payment Type Breakdown:'],
        ...Object.entries(
          receiptData.reduce((acc, item) => {
            const type = item.PaymentType || 'Unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {})
        ).map(([type, count]) => [type, count])
      ];

      const summaryWs = utils.aoa_to_sheet(summaryData);
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
      utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `GoSeva_Receipts_${timestamp}.xlsx`;

      writeFile(wb, filename);

      // Success notification with enhanced UI
      const totalAmount = receiptData.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
      alert(
        `✅ Excel Export Successful!\n\n` +
          `📄 File: ${filename}\n` +
          `📊 Records Exported: ${receiptData.length}\n` +
          `💰 Total Amount: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
          `📅 Generated: ${today}`
      );
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert(`❌ Export Failed!\n\nError: ${error.message}\nPlease try again or contact support.`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportToPDF = async () => {
    if (!Array.isArray(receiptData) || receiptData.length === 0) {
      alert('No data available to export');
      return;
    }

    setIsExportingPDF(true);
    try {
      // Create PDF document
      const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table fit
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let currentY = 50;

      // Helper function to format dates
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return 'Invalid Date';
        }
      };

      // Helper function to add temple header (used on all pages)
      const addTempleHeader = () => {
        const startY = 10;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');

        // First line: Temple Name (center), Establishment Year (right)
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('|| Shriram Samarth ||', pageWidth / 2, startY, { align: 'center' });

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Establishment 2011', pageWidth - margin, startY, { align: 'right' });

        // Second line: Trust Name
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Anandi - Narayan Krupa Nyas', pageWidth / 2, startY + 8, { align: 'center' });

        // Third line: Temple Name
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Shri Samarth Ramdas Swami Math, Khatgaon,', pageWidth / 2, startY + 16, { align: 'center' });

        // Fourth line: Address
        pdf.setFontSize(10);
        pdf.text('Ta. Karjat Ji. Ahilyanagar-414402, Maharashtra', pageWidth / 2, startY + 24, { align: 'center' });

        // Report title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Goseva Receipt', pageWidth / 2, startY + 38, { align: 'center' });

        // Add a line separator
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(margin, startY + 45, pageWidth - margin, startY + 45);

        return startY + 50; // Return Y position for content to start
      };

      // Helper function to add a new page with header
      const addNewPage = () => {
        pdf.addPage();
        currentY = addTempleHeader();
      };

      // Add main header on first page
      currentY = addTempleHeader();

      // Add generation date and summary below header
      const today = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${today}`, margin, currentY + 5);
      pdf.text(`Total Record: ${receiptData.length}`, pageWidth - 60, currentY + 5);

      const totalAmount = receiptData.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
      pdf.text(`Total Amount: Rs${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin, currentY + 12);

      currentY += 20;

      // Table configuration with transliterated Marathi headers
      const rowHeight = 8;
      const headerHeight = 10;
      const columns = [
        { title: 'No.', width: 12 },
        { title: 'Donor Name', width: 30 },
        { title: 'Contact', width: 22 },
        { title: 'Duration', width: 18 },
        { title: 'Amount', width: 22 },
        { title: 'Payment Type', width: 20 },
        { title: 'Bank', width: 22 },
        { title: 'DD/Cheque/TxnID', width: 25 },
        { title: 'Start Date', width: 20 },
        { title: 'End Date', width: 20 },
        { title: 'Status', width: 16 }
      ];

      // Draw table header
      const drawTableHeader = (startY) => {
        pdf.setFillColor(68, 114, 196);
        pdf.rect(margin, startY, pageWidth - 2 * margin, headerHeight, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');

        let xPosition = margin + 2;
        columns.forEach((col) => {
          pdf.text(col.title, xPosition, startY + 7);
          xPosition += col.width;
        });

        return startY + headerHeight;
      };

      // Draw table rows
      const drawTableRow = (data, yPosition, isAlternate = false) => {
        if (isAlternate) {
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, yPosition, pageWidth - 2 * margin, rowHeight, 'F');
        }

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');

        let xPosition = margin + 2;
        data.forEach((cell, index) => {
          const text = String(cell || '').substring(0, 20); // Truncate if too long
          pdf.text(text, xPosition, yPosition + 6);
          xPosition += columns[index].width;
        });

        return yPosition + rowHeight;
      };

      // Start table
      currentY = drawTableHeader(currentY);

      // Add data rows
      receiptData.forEach((item, index) => {
        // Check if we need a new page
        if (currentY + rowHeight > pageHeight - 30) {
          addNewPage();
          currentY = drawTableHeader(currentY);
        }

        const rowData = [
          (index + 1).toString(),
          (item.DonarName || item.DengidarName || 'N/A').substring(0, 15),
          item.DengidarPhone || 'N/A',
          (item.DurationMonths || 'N/A').toString(),
          item.Amount ? `₹${parseFloat(item.Amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}` : '₹0',
          item.PaymentType || 'N/A',
          (item.BankName || 'N/A').substring(0, 12),
          (item.DDNo || item.ChequeNo || item.TransactionId || 'N/A').substring(0, 15),
          formatDate(item.StartDate),
          formatDate(item.EndDate),
          item.Status || 'Active'
        ];

        currentY = drawTableRow(rowData, currentY, index % 2 === 1);
      });

      // Add summary section
      currentY += 20;
      if (currentY + 60 > pageHeight - 30) {
        addNewPage();
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary', margin, currentY);
      currentY += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Payment type breakdown
      const paymentTypes = receiptData.reduce((acc, item) => {
        const type = item.PaymentType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      pdf.text('Payment Type Breakdown:', margin, currentY);
      currentY += 7;

      Object.entries(paymentTypes).forEach(([type, count]) => {
        pdf.text(`• ${type}: ${count} receipts`, margin + 5, currentY);
        currentY += 5;
      });

      // Status breakdown
      currentY += 5;
      const activeCount = receiptData.filter((item) => item.Status !== 'Expired').length;
      const expiredCount = receiptData.length - activeCount;

      pdf.text('Status Breakdown:', margin, currentY);
      currentY += 7;
      pdf.text(`• Active: ${activeCount} receipts`, margin + 5, currentY);
      currentY += 5;
      pdf.text(`• Expired: ${expiredCount} receipts`, margin + 5, currentY);

      // Add page numbers to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
      }

      // Footer on last page
      pdf.setPage(totalPages);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('This is a computer-generated report. For queries, contact temple administration.', pageWidth / 2, pageHeight - 5, {
        align: 'center'
      });

      // Generate filename and save
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `GoSeva_Receipts_${timestamp}.pdf`;

      pdf.save(filename);

      // Success notification
      alert(
        `✅ PDF Export Successful!\n\n` +
          `📄 File: ${filename}\n` +
          `📊 Records Exported: ${receiptData.length}\n` +
          `💰 Total Amount: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
          `📅 Generated: ${today}`
      );
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert(`❌ PDF Export Failed!\n\nError: ${error.message}\nPlease try again or contact support.`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // const handleExportToPDF = async () => {
  //   if (!Array.isArray(receiptData) || receiptData.length === 0) {
  //     alert('No data available to export');
  //     return;
  //   }

  //   setIsExportingPDF(true);
  //   try {
  //     // Create PDF document
  //     const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better table fit
  //     const pageWidth = pdf.internal.pageSize.getWidth();
  //     const pageHeight = pdf.internal.pageSize.getHeight();
  //     const margin = 10;
  //     let currentY = 50;

  //     // Helper function to format dates
  //     const formatDate = (dateString) => {
  //       if (!dateString) return 'N/A';
  //       try {
  //         return new Date(dateString).toLocaleDateString('en-IN', {
  //           day: '2-digit',
  //           month: '2-digit',
  //           year: 'numeric'
  //         });
  //       } catch {
  //         return 'Invalid Date';
  //       }
  //     };

  //     // Helper function to add temple header (used on all pages)
  //     const addTempleHeader = () => {
  //       const startY = 10;
  //       pdf.setTextColor(0, 0, 0);
  //       pdf.setFont('helvetica', 'normal');

  //       // First line: Temple Name (center), Establishment Year (right)
  //       pdf.setFontSize(14);
  //       pdf.setFont('helvetica', 'bold');
  //       pdf.text('|| Shriram Samarth ||', pageWidth / 2, startY, { align: 'center' });

  //       pdf.setFontSize(10);
  //       pdf.setFont('helvetica', 'normal');
  //       pdf.text('Nyasachi Sthapana 2011', pageWidth - margin, startY, { align: 'right' });

  //       // Second line: Trust Name
  //       pdf.setFontSize(12);
  //       pdf.setFont('helvetica', 'bold');
  //       pdf.text('Anandi - Narayan Krupa Nyas', pageWidth / 2, startY + 8, { align: 'center' });

  //       // Third line: Temple Name
  //       pdf.setFontSize(11);
  //       pdf.setFont('helvetica', 'normal');
  //       pdf.text('Shri Samarth Ramdas Swami Math, Khatgaon,', pageWidth / 2, startY + 16, { align: 'center' });

  //       // Fourth line: Address
  //       pdf.setFontSize(10);
  //       pdf.text('Ta. Karjat Ji. Ahilyanagar-414402, Maharashtra', pageWidth / 2, startY + 24, { align: 'center' });

  //       // Report title
  //       pdf.setFontSize(16);
  //       pdf.setFont('helvetica', 'bold');
  //       pdf.text('Dengi Pawati', pageWidth / 2, startY + 38, { align: 'center' });

  //       // Add a line separator
  //       pdf.setLineWidth(0.5);
  //       pdf.setDrawColor(0, 0, 0);
  //       pdf.line(margin, startY + 45, pageWidth - margin, startY + 45);

  //       return startY + 50; // Return Y position for content to start
  //     };

  //     // Helper function to add a new page with header
  //     const addNewPage = () => {
  //       pdf.addPage();
  //       currentY = addTempleHeader();
  //     };

  //     // Add main header on first page
  //     currentY = addTempleHeader();

  //     // Add generation date and summary below header
  //     const today = new Date().toLocaleDateString('en-IN', {
  //       day: '2-digit',
  //       month: '2-digit',
  //       year: 'numeric',
  //       hour: '2-digit',
  //       minute: '2-digit'
  //     });

  //     pdf.setTextColor(0, 0, 0);
  //     pdf.setFontSize(9);
  //     pdf.setFont('helvetica', 'normal');
  //     pdf.text(`Dinank: ${today}`, margin, currentY + 5);
  //     pdf.text(`Ekun Record: ${receiptData.length}`, pageWidth - 60, currentY + 5);

  //     const totalAmount = receiptData.reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0);
  //     pdf.text(`Ekun Rakkam: Rs${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin, currentY + 12);

  //     currentY += 20;

  //     // Table configuration with transliterated Marathi headers
  //     const rowHeight = 8;
  //     const headerHeight = 10;
  //     const columns = [
  //       { title: 'A.Kr.', width: 15 },
  //       { title: 'Pawati Kr.', width: 25 },
  //       { title: 'Dengidar Nav', width: 35 },
  //       { title: 'Durdhvani', width: 25 },
  //       { title: 'Avadhi', width: 20 },
  //       { title: 'Rakkam', width: 25 },
  //       { title: 'Deyak Prakar', width: 22 },
  //       { title: 'Bank', width: 25 },
  //       { title: 'Prarambh Dinank', width: 22 },
  //       { title: 'Samapti Dinank', width: 22 },
  //       { title: 'Sthiti', width: 18 }
  //     ];

  //     // Draw table header
  //     const drawTableHeader = (startY) => {
  //       pdf.setFillColor(68, 114, 196);
  //       pdf.rect(margin, startY, pageWidth - 2 * margin, headerHeight, 'F');

  //       pdf.setTextColor(255, 255, 255);
  //       pdf.setFontSize(9);
  //       pdf.setFont('helvetica', 'bold');

  //       let xPosition = margin + 2;
  //       columns.forEach((col) => {
  //         pdf.text(col.title, xPosition, startY + 7);
  //         xPosition += col.width;
  //       });

  //       return startY + headerHeight;
  //     };

  //     // Draw table rows
  //     const drawTableRow = (data, yPosition, isAlternate = false) => {
  //       if (isAlternate) {
  //         pdf.setFillColor(245, 245, 245);
  //         pdf.rect(margin, yPosition, pageWidth - 2 * margin, rowHeight, 'F');
  //       }

  //       pdf.setTextColor(0, 0, 0);
  //       pdf.setFontSize(8);
  //       pdf.setFont('helvetica', 'normal');

  //       let xPosition = margin + 2;
  //       data.forEach((cell, index) => {
  //         const text = String(cell || '').substring(0, 20); // Truncate if too long
  //         pdf.text(text, xPosition, yPosition + 6);
  //         xPosition += columns[index].width;
  //       });

  //       return yPosition + rowHeight;
  //     };

  //     // Start table
  //     currentY = drawTableHeader(currentY);

  //     // Add data rows
  //     receiptData.forEach((item, index) => {
  //       // Check if we need a new page
  //       if (currentY + rowHeight > pageHeight - 30) {
  //         addNewPage();
  //         currentY = drawTableHeader(currentY);
  //       }

  //       const rowData = [
  //         (index + 1).toString(),
  //         item.ReceiptNo || 'N/A',
  //         (item.DonarName || item.DengidarName || 'N/A').substring(0, 15),
  //         item.DengidarPhone || 'N/A',
  //         (item.DurationMonths || 'N/A').toString(),
  //         item.Amount ? `₹${parseFloat(item.Amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}` : '₹0',
  //         item.PaymentType || 'N/A',
  //         (item.BankName || 'N/A').substring(0, 12),
  //         formatDate(item.StartDate),
  //         formatDate(item.EndDate),
  //         item.Status || 'Active'
  //       ];

  //       currentY = drawTableRow(rowData, currentY, index % 2 === 1);
  //     });

  //     // Add summary section
  //     currentY += 20;
  //     if (currentY + 60 > pageHeight - 30) {
  //       addNewPage();
  //     }

  //     pdf.setFontSize(12);
  //     pdf.setFont('helvetica', 'bold');
  //     pdf.text('Saransh', margin, currentY);
  //     currentY += 10;

  //     pdf.setFontSize(10);
  //     pdf.setFont('helvetica', 'normal');

  //     // Payment type breakdown
  //     const paymentTypes = receiptData.reduce((acc, item) => {
  //       const type = item.PaymentType || 'Unknown';
  //       acc[type] = (acc[type] || 0) + 1;
  //       return acc;
  //     }, {});

  //     pdf.text('Deyak Prakar Vivarani:', margin, currentY);
  //     currentY += 7;

  //     Object.entries(paymentTypes).forEach(([type, count]) => {
  //       pdf.text(`• ${type}: ${count} pawati`, margin + 5, currentY);
  //       currentY += 5;
  //     });

  //     // Status breakdown
  //     currentY += 5;
  //     const activeCount = receiptData.filter((item) => item.Status !== 'Expired').length;
  //     const expiredCount = receiptData.length - activeCount;

  //     pdf.text('Sthiti Vivarani:', margin, currentY);
  //     currentY += 7;
  //     pdf.text(`• Sakriya: ${activeCount} pawati`, margin + 5, currentY);
  //     currentY += 5;
  //     pdf.text(`• Samapti: ${expiredCount} pawati`, margin + 5, currentY);

  //     // Add page numbers to all pages
  //     const totalPages = pdf.internal.getNumberOfPages();
  //     for (let i = 1; i <= totalPages; i++) {
  //       pdf.setPage(i);
  //       pdf.setFontSize(8);
  //       pdf.setFont('helvetica', 'normal');
  //       pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
  //     }

  //     // Footer on last page
  //     pdf.setPage(totalPages);
  //     pdf.setFontSize(8);
  //     pdf.setFont('helvetica', 'italic');
  //     pdf.text('This is a computer-generated report. For queries, contact temple administration.', pageWidth / 2, pageHeight - 5, {
  //       align: 'center'
  //     });

  //     // Generate filename and save
  //     const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  //     const filename = `GoSeva_Receipts_${timestamp}.pdf`;

  //     pdf.save(filename);

  //     // Success notification
  //     alert(
  //       `✅ PDF Export Successful!\n\n` +
  //         `📄 File: ${filename}\n` +
  //         `📊 Records Exported: ${receiptData.length}\n` +
  //         `💰 Total Amount: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
  //         `📅 Generated: ${today}`
  //     );
  //   } catch (error) {
  //     console.error('Error exporting to PDF:', error);
  //     alert(`❌ PDF Export Failed!\n\nError: ${error.message}\nPlease try again or contact support.`);
  //   } finally {
  //     setIsExportingPDF(false);
  //   }
  // };

  const validate = () => {
    const newErrors = {};
    if (!formData.DengidarId) newErrors.DengidarId = 'Please search and select a devotee first';
    if (!formData.Amount) newErrors.Amount = 'Amount is required';
    if (!formData.PaymentType) newErrors.PaymentType = 'Payment type is required';
    if (!formData.DurationMonths) newErrors.DurationMonths = 'Duration in months is required';

    // Conditional validation based on payment type
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
      if (formData.MobileNumber && !/^\d{10}$/.test(formData.MobileNumber)) {
        alert('Mobile Number must be 10 digits');
        return;
      }
      if (formData.PanCard && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.PanCard)) {
        alert('PAN Card must be 10 characters');
        return;
      }
      if (formData.AdharCard && !/^\d{12}$/.test(formData.AdharCard)) {
        alert('Aadhar Card must be 12 digits');
        return;
      }
      if (formData.EmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EmailId)) {
        alert('Invalid Email ID format');
        return;
      }

      try {
        const receiptData = {
          DengidarId: formData.DengidarId,
          DurationMonths: parseInt(formData.DurationMonths, 10) || 0,
          PaymentType: formData.PaymentType,
          BankName: formData.BankName || null,
          DDNo: formData.DDNo || null,
          ChequeNo: formData.ChequeNo || null,
          Amount: parseFloat(formData.Amount),
          Note: formData.Note || null,
          StartDate: formData.StartDate,
          TransactionId: formData.TransactionId || null
        };

        let response;
        if (isEditing && editingReceiptId) {
          // Update existing receipt
          response = await axios.put(`https://api.mytemplesoftware.in/api/goseva/${editingReceiptId}`, receiptData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // Create new receipt
          response = await axios.post('https://api.mytemplesoftware.in/api/goseva', receiptData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
        }

        if (response.data.success) {
          const message = isEditing ? `Receipt updated successfully!` : `Receipt generated successfully!`;

          alert(message);

          // Reset only receipt fields, keep devotee data
          setFormData({
            ...formData,
            DurationMonths: '',
            PaymentType: '',
            BankName: '',
            DDNo: '',
            ChequeNo: '',
            Amount: '',
            Note: '',
            StartDate: '',
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
        if (error.response?.status === 409) {
          alert(error.response.data.message || `Receipt already exists. Please ${action} with a different amount or details.`);
          return;
        }
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
      const response = await axios.delete(`https://api.mytemplesoftware.in/api/goseva/${id}`, {
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

  // Pagination calculations
  const totalItems = receiptData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = receiptData.slice(startIndex, endIndex);

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

  const handleSendWhatsapp = async (receipt) => {
    try {
      setSendingWhatsApp(receipt.Id);
      // Use the donor's WhatsApp number (with country code, e.g., '91...')
      let number = receipt.DengidarPhone || receipt.MobileNumber;
      if (!number) {
        alert('No WhatsApp number found for this donor.');
        setSendingWhatsApp(null);
        return;
      }
      number = '91' + number;

      const startdate = receipt.StartDate ? new Date(receipt.StartDate).toISOString().split('T')[0] : '';
      const enddate = receipt.EndDate ? new Date(receipt.EndDate).toISOString().split('T')[0] : '';

      // Prepare the payload as per your backend API
      const payload = {
        number,
        receipt: {
          DengidarName: receipt.DengidarName,
          Amount: receipt.Amount,
          DurationMonths: receipt.DurationMonths,
          StartDate: startdate,
          EndDate: enddate,
          PaymentType: receipt.PaymentType
        }
      };

      setSendingWhatsApp(receipt.Id);
      const res = await axios.post('https://api.mytemplesoftware.in/api/goseva/send-whatsapp', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.data.success) {
        alert('WhatsApp message sent successfully!');
      } else {
        alert('Failed to send WhatsApp message.');
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Error sending WhatsApp message.');
      setSendingWhatsApp(null);
    } finally {
      setSendingWhatsApp(null);
    }
  };

  // Add this state variable with your other useState declarations
  const [sendingPDF, setSendingPDF] = useState(null); // Track PDF sending state

  // Add this function to handle PDF WhatsApp sending
  const handleSendPDF = async (receipt) => {
    try {
      setSendingPDF(receipt.Id);

      // Use the donor's WhatsApp number (with country code)
      let number = receipt.DengidarPhone || receipt.MobileNumber;
      if (!number) {
        alert('No WhatsApp number found for this donor.');
        setSendingPDF(null);
        return;
      }
      number = '91' + number;

      // Prepare the payload for PDF generation
      const payload = {
        number,
        receipt: {
          ReceiptNumber: receipt.ReceiptNo,
          Name: receipt.DengidarName || receipt.DonarName,
          Amount: receipt.Amount,
          DurationMonths: receipt.DurationMonths,
          StartDate: receipt.StartDate,
          EndDate: receipt.EndDate,
          PaymentType: receipt.PaymentType,
          PanCard: receipt.PanCard || 'N/A',
          ChequeNo: receipt.ChequeNo || 'N/A',
          DDNo: receipt.DDNo || 'N/A',
          BankName: receipt.BankName || 'N/A',
          Note: receipt.Note || 'N/A',
          TransactionId: receipt.TransactionId || 'N/A',
          Date: receipt.Date,
          DengidarAddress: receipt.DengidarAddress || 'N/A'
        }
      };

      const res = await axios.post('https://api.mytemplesoftware.in/api/goseva/whatsapp-pdf', payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        alert('PDF receipt sent successfully via WhatsApp!');
      } else {
        alert('Failed to send PDF receipt.');
      }
    } catch (error) {
      console.error('Error sending PDF receipt:', error);
      alert('Error sending PDF receipt: ' + (error.response?.data?.message || error.message));
    } finally {
      setSendingPDF(null);
    }
  };

  // Add this function to handle printing receipt
  const handlePrintReceipt = (receipt) => {
    const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
            
            body {
                font-family: 'Noto Sans Devanagari', Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
                color: #333;
            }
            
            .receipt-container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                position: relative;
            }
            
            .registration-info {
                position: absolute;
                top: 10px;
                font-size: 12px;
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
                padding: 30px;
                text-align: center;
                position: relative;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="white" opacity="0.1"/><circle cx="80" cy="80" r="3" fill="white" opacity="0.1"/><circle cx="40" cy="60" r="1" fill="white" opacity="0.1"/></svg>');
            }
            
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
                position: relative;
                z-index: 1;
            }
            
            .temple-name {
                font-size: 18px;
                margin: 10px 0;
                font-weight: 600;
                position: relative;
                z-index: 1;
            }
            
            .temple-address {
                font-size: 14px;
                opacity: 0.9;
                position: relative;
                z-index: 1;
            }
            
            .receipt-content {
                padding: 30px;
            }
            
            .receipt-number {
                text-align: center;
                background: #f8f9fa;
                padding: 15px;
                margin: -30px -30px 30px -30px;
                border-bottom: 3px solid #ff6b35 !important;
            }
            
            .receipt-number h2 {
                margin: 0;
                color: #ff6b35 !important;
                font-size: 24px;
                font-weight: 700;
            }
            
            .receipt-details {
                display: grid;
                gap: 20px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 0;
                border-bottom: 1px solid #eee;
            }
            
            .detail-row:last-child {
                border-bottom: none;
                border-top: 2px solid #ff6b35 !important;
                margin-top: 20px;
                padding-top: 20px;
            }
            
            .label {
                font-weight: 600;
                color: #555;
                font-size: 16px;
                display: flex;
                align-items: center;
            }
            
            .label::before {
                content: '';
                width: 8px;
                height: 8px;
                background: #ff6b35 !important;
                border-radius: 50%;
                margin-right: 10px;
            }
            
            .value {
                font-weight: 700;
                color: #333;
                font-size: 16px;
                text-align: right;
            }
            
            .footer {
                background: #f8f9fa !important;
                padding: 25px 30px;
                text-align: center;
                margin: 30px -30px -30px -30px;
            }
            
            .thank-you {
                color: #ff6b35 !important;
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 15px;
            }
            
            .contact-info {
                font-size: 14px;
                color: #666;
                line-height: 1.6;
            }
            
            .divider {
                height: 2px;
                background: linear-gradient(90deg, transparent, #ff6b35, transparent);
                margin: 20px 0;
            }
            
            @media print {
                body { 
                    background: white; 
                    padding: 0; 
                }
                .receipt-container { 
                    box-shadow: none; 
                    border-radius: 0; 
                }
                .header {
                    background: #ff6b35 !important;
                    color: white !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .header * {
                    color: white !important;
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
                    खातगाव, ता. कर्जत, जि. अहिल्यानगर-414402<br>
                    महाराष्ट्र, भारत
                </div>
            </div>
            
            <div class="receipt-content">
                <div class="receipt-number">
                    <h2>गो सेवा पावती</h2>
                </div>
                
                <div class="receipt-details">
                    <div class="detail-row">
                        <span class="label">पावती क्रमांक</span>
                        <span class="value">${receipt.ReceiptNo || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">नाव</span>
                        <span class="value">${receipt.DengidarName || receipt.DonarName || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">कालावधी (महिने)</span>
                        <span class="value">${receipt.DurationMonths || 'N/A'} महिने</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">सुरुवात तारीख</span>
                        <span class="value">${receipt.StartDate ? new Date(receipt.StartDate).toLocaleDateString('hi-IN') : 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">समाप्ती तारीख</span>
                        <span class="value">${receipt.EndDate ? new Date(receipt.EndDate).toLocaleDateString('hi-IN') : 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">देयक प्रकार</span>
                        <span class="value">${receipt.PaymentType || 'N/A'}</span>
                    </div>
                    
                    ${
                      receipt.DDNo
                        ? `<div class="detail-row">
                        <span class="label">DD क्रमांक</span>
                        <span class="value">${receipt.DDNo}</span>
                    </div>`
                        : ''
                    }
                    
                    ${
                      receipt.TransactionId
                        ? `<div class="detail-row">
                        <span class="label">Transaction ID</span>
                        <span class="value">${receipt.TransactionId}</span>
                    </div>`
                        : ''
                    }
                    
                    ${
                      receipt.ChequeNo
                        ? `<div class="detail-row">
                        <span class="label">चेक क्रमांक</span>
                        <span class="value">${receipt.ChequeNo}</span>
                    </div>`
                        : ''
                    }
                    
                    <div class="detail-row">
                        <span class="label">पावती तारीख</span>
                        <span class="value">${receipt.CreatedDate ? new Date(receipt.CreatedDate).toLocaleDateString('hi-IN') : new Date().toLocaleDateString('hi-IN')}</span>
                    </div>

                    <div class="detail-row">
                        <span class="label">पॅन कार्ड</span>
                        <span class="value">${receipt.PanCard || 'N/A'}</span>
                    </div>
                    
                    <div class="detail-row">
                        <span class="label">एकूण रक्कम</span>
                        <span class="value">₹${receipt.Amount || '0'}</span>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <div class="thank-you">🙏 गो सेवेबद्दल मनःपूर्वक धन्यवाद! 🙏</div>
                <div class="thank-you">|| जय जय रघुवीर समर्थ ||</div>
                
                <div class="divider"></div>
                
                <div class="contact-info">
                    <strong>संपर्क माहिती:</strong><br>
                    📞 दूरध्वनी: 9421177821<br>
                    📱 WhatsApp: 9146855691<br>
                    <br>
                    <em>या पावतीला कायदेशीर वैधता आहे</em><br>
                    <em>Donations are Eligible for Tax Deductions under Section 80G vide of the Income Tax Act</em><br>
                    <em>Approval No. PNA/CIT-I/ATG/48/2012-2013/1285  PAN No. AADTA0772C</em>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(receiptHtml);
    printWindow.document.close();

    // Wait for the content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'पावती संपादन' : 'गोसेवा पावती'}
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
                  <label htmlFor="DurationMonths">अवधी (महिने) *</label>
                  <input type="number" name="DurationMonths" value={formData.DurationMonths} onChange={handleChange} />
                  {errors.DurationMonths && <span className="error">{errors.DurationMonths}</span>}
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
                  <label htmlFor="BankName">बँकेचे नाव</label>
                  <input type="text" name="BankName" value={formData.BankName} onChange={handleChange} />
                  {errors.BankName && <span className="error">{errors.BankName}</span>}
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
                  <div className="form-group">{/* Empty div for spacing */}</div>
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
                  <div className="form-group">{/* Empty div for spacing when only one field is shown */}</div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Note">नोट</label>
                  <textarea rows={3} name="Note" value={formData.Note} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="StartDate">सुरुवात तारीख</label>
                  <input type="date" name="StartDate" value={formData.StartDate} onChange={handleChange} />
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
              <Col md={4}>
                <Card.Title as="h4">पावती यादी</Card.Title>
                <small className="text-muted">
                  Total: {receiptData.length} receipts | Amount: ₹
                  {receiptData
                    .reduce((sum, item) => sum + (parseFloat(item.Amount) || 0), 0)
                    .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </small>
              </Col>
              <Col md={8} className="d-flex justify-content-end align-items-center">
                <Form.Control
                  type="text"
                  placeholder="Search by Receipt No."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="me-2"
                />
                <Button
                  variant="success"
                  onClick={handleExportToExcel}
                  className="me-2 d-flex align-items-center"
                  disabled={isExportingExcel || isExportingPDF || receiptData.length === 0}
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
                    <>📊 Excel ({receiptData.length})</>
                  )}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleExportToPDF}
                  className="d-flex align-items-center"
                  disabled={isExportingExcel || isExportingPDF || receiptData.length === 0}
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
                    <>📄 PDF ({receiptData.length})</>
                  )}
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
                  className="table-bordered"
                  style={{
                    border: '1px solid #dee2e6',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead>
                    <tr>
                      <th>पावती क्रमांक</th>
                      <th>देणगीदार नाव</th>
                      <th>अवधि (महिने)</th>
                      <th>रक्कम</th>
                      <th>देयक प्रकार</th>
                      <th>देयक तपशील</th>
                      <th>सुरुवात तारीख</th>
                      <th>समाप्ती तारीख</th>
                      <th>निर्माता</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(currentData) &&
                      currentData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.ReceiptNo}</td>
                          <td>{item.DonarName || item.DengidarName || 'N/A'}</td>
                          <td>{item.DurationMonths || 'N/A'}</td>
                          <td>₹{item.Amount}</td>
                          <td>{item.PaymentType}</td>
                          <td>
                            {item.PaymentType === 'dd' && item.DDNo && `DD: ${item.DDNo}`}
                            {item.PaymentType === 'cheque' && item.ChequeNo && `Cheque: ${item.ChequeNo}`}
                            {item.PaymentType === 'upi' && item.TransactionId && `TxnID: ${item.TransactionId}`}
                            {item.BankName && ` (${item.BankName})`}
                            {!item.DDNo && !item.ChequeNo && !item.TransactionId && ''}
                          </td>
                          <td>{item.StartDate ? new Date(item.StartDate).toLocaleDateString() : 'N/A'}</td>
                          <td>{item.EndDate ? new Date(item.EndDate).toLocaleDateString() : 'N/A'}</td>
                          <td>{item.CreatedByName}</td>
                          <td>
                            <Button variant="info" size="sm" className="me-2" onClick={() => handleEditReceipt(item.Id)}>
                              <FaEdit />
                            </Button>
                            <Button variant="success" size="sm" className="me-2" onClick={() => handleSendWhatsapp(item)}>
                              {sendingWhatsApp === item.Id ? 'Sending...' : <FaWhatsapp />}
                            </Button>

                            <Button
                              variant="warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleSendPDF(item)}
                              disabled={sendingPDF === item.Id}
                            >
                              {sendingPDF === item.Id ? 'Sending...' : '📄 PDF'}
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              className="me-2 mt-2"
                              onClick={() => handlePrintReceipt(item)}
                              title="Print Receipt"
                            >
                              🖨️ Print
                            </Button>

                            <Button
                              className="mt-2"
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                confirmDelete(item.Id);
                              }}
                            >
                              <FaTrashAlt />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    {currentData.length === 0 && (
                      <tr>
                        <td colSpan="10" className="text-center">
                          No receipts found
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
                  {searchTerm && ` (filtered from ${allReceiptData.length} total entries)`}
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

      {/*</Row> */}
    </React.Fragment>
  );
}

export default GoSevaReceipt;
