import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../common.scss';

function DairyPaymentReport() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ sdate: '', edate: '' });
  const [errors, setErrors] = useState({});
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Fetch dairy payment report data from API
  const fetchReportData = async () => {
    if (!formData.sdate || !formData.edate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mytemplesoftware.in/api/dairy-payment/report?startDate=${formData.sdate}&endDate=${formData.edate}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await res.json();
      if (data.success) {
        setReportData(data.data);
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Error fetching dairy payment report:', err);
      setReportData(null);
    }
    setLoading(false);
  };

  // Export to Excel with Marathi headers
  const handleExportToExcel = () => {
    if (!reportData || !reportData.payments || reportData.payments.length === 0) {
      alert('डेटा उपलब्ध नाही');
      return;
    }

    // Main payments data
    const excelData = reportData.payments.map((item, idx) => ({
      अनुक्रमांक: idx + 1,
      'महिना/वर्ष': `${getMonthName(item.month)}/${item.year}`,
      'एकूण डेअरी रक्कम': `₹${item.totalDairyAmount}`,
      'भरलेली रक्कम': `₹${item.paidAmount}`,
      'उर्वरित रक्कम': `₹${item.remainingAmount}`,
      'पेमेंट पद्धत': item.paymentMethod?.toUpperCase() || '',
      'Transaction ID': item.transactionId || '-',
      'बँक नाव': item.bankName || '-',
      'पेमेंट तारीख': item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('en-IN') : '',
      टिप्पणी: item.remarks || '-'
    }));

    // Create workbook with multiple sheets
    const wb = utils.book_new();

    // Main data sheet
    const ws1 = utils.json_to_sheet(excelData);
    ws1['!cols'] = [
      { wch: 8 }, // अनुक्रमांक
      { wch: 15 }, // महिना/वर्ष
      { wch: 15 }, // एकूण डेअरी रक्कम
      { wch: 15 }, // भरलेली रक्कम
      { wch: 15 }, // उर्वरित रक्कम
      { wch: 12 }, // पेमेंट पद्धत
      { wch: 15 }, // Transaction ID
      { wch: 20 }, // बँक नाव
      { wch: 15 }, // पेमेंट तारीख
      { wch: 25 } // टिप्पणी
    ];
    utils.book_append_sheet(wb, ws1, 'डेअरी पेमेंट तपशील');

    // Summary sheet
    const summaryData = [
      { विवरण: 'एकूण पेमेंट', मूल्य: reportData.summary?.totalPayments || 0 },
      { विवरण: 'एकूण भरलेली रक्कम', मूल्य: `₹${reportData.summary?.totalPaidAmount || 0}` },
      { विवरण: 'एकूण डेअरी रक्कम', मूल्य: `₹${reportData.summary?.totalDairyAmount || 0}` },
      { विवरण: 'एकूण उर्वरित रक्कम', मूल्य: `₹${reportData.summary?.totalRemainingAmount || 0}` },
      { विवरण: 'सरासरी पेमेंट', मूल्य: `₹${reportData.summary?.averagePaidAmount || 0}` },
      {
        विवरण: 'कॅश पेमेंट',
        मूल्य: `₹${reportData.summary?.paymentMethodBreakdown?.cash?.amount || 0} (${reportData.summary?.paymentMethodBreakdown?.cash?.count || 0} वेळा)`
      },
      {
        विवरण: 'ऑनलाइन पेमेंट',
        मूल्य: `₹${reportData.summary?.paymentMethodBreakdown?.online?.amount || 0} (${reportData.summary?.paymentMethodBreakdown?.online?.count || 0} वेळा)`
      }
    ];
    const ws2 = utils.json_to_sheet(summaryData);
    ws2['!cols'] = [{ wch: 25 }, { wch: 30 }];
    utils.book_append_sheet(wb, ws2, 'सारांश');

    // Monthly breakdown sheet
    if (reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0) {
      const monthlyData = reportData.monthlyBreakdown.map((item, idx) => ({
        अनुक्रमांक: idx + 1,
        'महिना/वर्ष': item.monthName,
        'पेमेंट संख्या': item.paymentCount,
        'महिना भरलेली': `₹${item.monthlyPaid}`,
        'महिना एकूण': `₹${item.monthlyTotal}`,
        'महिना उर्वरित': `₹${item.monthlyRemaining}`
      }));
      const ws3 = utils.json_to_sheet(monthlyData);
      ws3['!cols'] = [
        { wch: 8 }, // अनुक्रमांक
        { wch: 15 }, // महिना/वर्ष
        { wch: 12 }, // पेमेंट संख्या
        { wch: 15 }, // महिना भरलेली
        { wch: 15 }, // महिना एकूण
        { wch: 15 } // महिना उर्वरित
      ];
      utils.book_append_sheet(wb, ws3, 'महिनेवार तपशील');
    }

    writeFile(wb, `डेअरी_पेमेंट_अहवाल_${formData.sdate}_to_${formData.edate}.xlsx`);
  };

  const handleExportToPDF = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);
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

      pdf.save(`डेअरी-पेमेंट-अहवाल-${formData.sdate}-to-${formData.edate}.pdf`);
    });
  };

  const getMonthName = (month) => {
    const months = [
      'जानेवारी',
      'फेब्रुवारी',
      'मार्च',
      'एप्रिल',
      'मे',
      'जून',
      'जुलै',
      'ऑगस्ट',
      'सप्टेंबर',
      'ऑक्टोबर',
      'नोव्हेंबर',
      'डिसेंबर'
    ];
    return months[month - 1] || month;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.sdate) newErrors.sdate = 'सुरुवातीची तारीख आवश्यक आहे';
    if (!formData.edate) newErrors.edate = 'शेवटची तारीख आवश्यक आहे';
    if (formData.sdate && formData.edate && new Date(formData.sdate) > new Date(formData.edate)) {
      newErrors.edate = 'शेवटची तारीख सुरुवातीच्या तारखेपेक्षा मोठी असावी';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      await fetchReportData();
    } else {
      setErrors(formErrors);
    }
  };

  const handleReset = () => {
    setFormData({ sdate: '', edate: '' });
    setReportData(null);
    setErrors({});
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Pagination logic
  const filteredData =
    reportData?.payments?.filter(
      (item) =>
        !searchTerm ||
        (item.paymentMethod && item.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.bankName && item.bankName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.remarks && item.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.transactionId && item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
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
      <Row>
        <Col sm={12} style={{ display: 'flex', justifyContent: 'center' }}>
          <Card style={{ width: '700px' }}>
            <Card.Header>
              <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
                डेअरी पेमेंट अहवाल
              </Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sdate">सुरुवातीची तारीख</label>
                    <input type="date" name="sdate" value={formData.sdate} onChange={handleChange} />
                    {errors.sdate && <span className="error">{errors.sdate}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="edate">शेवटची तारीख</label>
                    <input type="date" name="edate" value={formData.edate} onChange={handleChange} />
                    {errors.edate && <span className="error">{errors.edate}</span>}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" disabled={loading}>
                    {loading ? 'लोड होत आहे...' : 'शोधा'}
                  </button>
                  <button type="button" onClick={handleReset}>
                    रद्द करा
                  </button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {/* Main Data Table */}
      <Col sm={12} className="mt-4">
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">डेअरी पेमेंट तपशील</Card.Title>
                {reportData && reportData.dateRange && (
                  <small className="text-muted">
                    {new Date(reportData.dateRange.startDate).toLocaleDateString('en-IN')} ते{' '}
                    {new Date(reportData.dateRange.endDate).toLocaleDateString('en-IN')}({reportData.dateRange.totalDays} दिवस)
                  </small>
                )}
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control
                  type="text"
                  value={searchTerm}
                  placeholder="शोधा (पेमेंट पद्धत, बँक, टिप्पणी...)"
                  onChange={handleSearchChange}
                  className="me-2"
                  style={{ maxWidth: '250px' }}
                />
                <Button
                  variant="success"
                  onClick={handleExportToExcel}
                  className="me-2"
                  disabled={!reportData || !reportData.payments || reportData.payments.length === 0}
                >
                  Excel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleExportToPDF}
                  disabled={!reportData || !reportData.payments || reportData.payments.length === 0}
                >
                  PDF
                </Button>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-card" style={{ height: '400px' }}>
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
                      <th>अनुक्रमांक</th>
                      <th>महिना/वर्ष</th>
                      <th>एकूण डेअरी रक्कम</th>
                      <th>भरलेली रक्कम</th>
                      <th>उर्वरित रक्कम</th>
                      <th>पेमेंट पद्धत</th>
                      <th>Transaction ID</th>
                      <th>बँक नाव</th>
                      <th>पेमेंट तारीख</th>
                      <th>टिप्पणी</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="10" className="text-center">
                          लोड होत आहे...
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center">
                          {reportData ? 'या कालावधीत कोणताही डेटा उपलब्ध नाही' : 'कृपया तारीख निवडून शोधा बटण दाबा'}
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{startIndex + idx + 1}</td>
                          <td>
                            {getMonthName(item.month)}/{item.year}
                          </td>
                          <td>₹{item.totalDairyAmount}</td>
                          <td>₹{item.paidAmount}</td>
                          <td>₹{item.remainingAmount}</td>
                          <td>
                            <span className={`badge ${item.paymentMethod === 'cash' ? 'bg-success' : 'bg-primary'}`}>
                              {item.paymentMethod?.toUpperCase()}
                            </span>
                          </td>
                          <td>{item.transactionId || '-'}</td>
                          <td>{item.bankName || '-'}</td>
                          <td>{item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('en-IN') : ''}</td>
                          <td>{item.remarks || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-controls d-flex align-items-center justify-content-end mt-3 px-3 pb-3">
                <Button variant="outline-secondary" size="sm" onClick={handlePrevPage} disabled={currentPage === 1} className="me-2">
                  मागील
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
                  पुढील
                </Button>
              </div>
            )}

            {/* Pagination Info */}
            <div className="d-flex justify-content-between align-items-center mt-2 px-3 pb-2">
              <small className="text-muted">
                Showing {totalItems === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries
                {searchTerm && ` (filtered)`}
              </small>
            </div>
          </Card.Body>
        </Card>
      </Col>
      {/* Monthly Breakdown Table */}
      {/* {reportData && reportData.monthlyBreakdown && reportData.monthlyBreakdown.length > 0 && (
        <Col sm={12} className="mt-4">
          <Card>
            <Card.Header>
              <Card.Title as="h4">महिनेवार तपशील</Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-card" style={{ height: '300px' }}>
                <PerfectScrollbar>
                  <Table responsive className="table-bordered mb-0 text-center">
                    <thead>
                      <tr>
                        <th>अनुक्रमांक</th>
                        <th>महिना/वर्ष</th>
                        <th>पेमेंट संख्या</th>
                        <th>महिना भरलेली</th>
                        <th>महिना एकूण</th>
                        <th>महिना उर्वरित</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.monthlyBreakdown.map((item, idx) => (
                        <tr key={`${item.year}-${item.month}`}>
                          <td>{idx + 1}</td>
                          <td>{item.monthName}</td>
                          <td>{item.paymentCount}</td>
                          <td>₹{item.monthlyPaid}</td>
                          <td>₹{item.monthlyTotal}</td>
                          <td>₹{item.monthlyRemaining}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </PerfectScrollbar>
              </div>
            </Card.Body>
          </Card>
        </Col>
      )} */}
    </React.Fragment>
  );
}

export default DairyPaymentReport;
