import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../common.scss';

function MilkDistributionReport() {
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

  // Fetch milk distribution report data from API
  const fetchReportData = async () => {
    if (!formData.sdate || !formData.edate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mytemplesoftware.in/api/milk-distribution/report?startDate=${formData.sdate}&endDate=${formData.edate}`,
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
      console.error('Error fetching milk distribution report:', err);
      setReportData(null);
    }
    setLoading(false);
  };

  // Export to Excel with Marathi headers
  const handleExportToExcel = () => {
    if (!reportData || !reportData.distributions || reportData.distributions.length === 0) {
      alert('डेटा उपलब्ध नाही');
      return;
    }

    // Main distributions data
    const excelData = reportData.distributions.map((item, idx) => ({
      अनुक्रमांक: idx + 1,
      तारीख: item.date ? new Date(item.date).toLocaleDateString('en-IN') : '',
      'सकाळी एकूण दूध': `${item.morning.totalMilk} L`,
      'सकाळी स्वयंपाकघर': `${item.morning.kitchen} L`,
      'सकाळी कुटी': `${item.morning.kuti} L`,
      'सकाळी डेअरी': `${item.morning.dairy} L`,
      'सकाळी डेअरी रक्कम': `₹${item.morning.dairyAmount}`,
      'संध्याकाळी एकूण दूध': `${item.evening.totalMilk} L`,
      'संध्याकाळी स्वयंपाकघर': `${item.evening.kitchen} L`,
      'संध्याकाळी कुटी': `${item.evening.kuti} L`,
      'संध्याकाळी डेअरी': `${item.evening.dairy} L`,
      'संध्याकाळी डेअरी रक्कम': `₹${item.evening.dairyAmount}`,
      'दैनंदिन एकूण दूध': `${item.dailyTotals.totalMilk} L`,
      'दैनंदिन एकूण वितरण': `${item.dailyTotals.totalDistributed} L`,
      'दैनंदिन एकूण डेअरी रक्कम': `₹${item.dailyTotals.totalDairyAmount}`
    }));

    // Create workbook
    const wb = utils.book_new();

    // Main data sheet
    const ws = utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 8 }, // अनुक्रमांक
      { wch: 12 }, // तारीख
      { wch: 15 }, // सकाळी एकूण दूध
      { wch: 15 }, // सकाळी स्वयंपाकघर
      { wch: 12 }, // सकाळी कुटी
      { wch: 12 }, // सकाळी डेअरी
      { wch: 15 }, // सकाळी डेअरी रक्कम
      { wch: 15 }, // संध्याकाळी एकूण दूध
      { wch: 15 }, // संध्याकाळी स्वयंपाकघर
      { wch: 12 }, // संध्याकाळी कुटी
      { wch: 12 }, // संध्याकाळी डेअरी
      { wch: 15 }, // संध्याकाळी डेअरी रक्कम
      { wch: 15 }, // दैनंदिन एकूण दूध
      { wch: 15 }, // दैनंदिन एकूण वितरण
      { wch: 18 } // दैनंदिन एकूण डेअरी रक्कम
    ];
    utils.book_append_sheet(wb, ws, 'दूध वितरण अहवाल');

    writeFile(wb, `दूध_वितरण_अहवाल_${formData.sdate}_to_${formData.edate}.xlsx`);
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

      pdf.save(`दूध-वितरण-अहवाल-${formData.sdate}-to-${formData.edate}.pdf`);
    });
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
    reportData?.distributions?.filter((item) => !searchTerm || (item.date && item.date.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    [];

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
                दूध वितरण अहवाल
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
                <Card.Title as="h4">दूध वितरण तपशील</Card.Title>
                {reportData && reportData.dateRange && (
                  <small className="text-muted">
                    {new Date(reportData.dateRange.startDate).toLocaleDateString('en-IN')} ते{' '}
                    {new Date(reportData.dateRange.endDate).toLocaleDateString('en-IN')} ({reportData.dateRange.totalDays} दिवस)
                  </small>
                )}
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control
                  type="text"
                  value={searchTerm}
                  placeholder="तारीख शोधा..."
                  onChange={handleSearchChange}
                  className="me-2"
                  style={{ maxWidth: '200px' }}
                />
                <Button
                  variant="success"
                  onClick={handleExportToExcel}
                  className="me-2"
                  disabled={!reportData || !reportData.distributions || reportData.distributions.length === 0}
                >
                  Excel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleExportToPDF}
                  disabled={!reportData || !reportData.distributions || reportData.distributions.length === 0}
                >
                  PDF
                </Button>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-card" style={{ height: '500px' }}>
              <PerfectScrollbar>
                <Table
                  responsive
                  ref={tableRef}
                  className="table-bordered mb-0 text-center"
                  style={{
                    border: '1px solid #dee2e6',
                    borderCollapse: 'collapse',
                    fontSize: '12px'
                  }}
                >
                  <thead>
                    <tr>
                      <th>अ.क्र.</th>
                      <th>तारीख</th>
                      <th colSpan="5">सकाळी</th>
                      <th colSpan="5">संध्याकाळी</th>
                      <th colSpan="3">दैनंदिन एकूण</th>
                    </tr>
                    <tr>
                      <th></th>
                      <th></th>
                      <th>एकूण दूध</th>
                      <th>स्वयंपाकघर</th>
                      <th>कुटी</th>
                      <th>डेअरी</th>
                      <th>डेअरी रक्कम</th>
                      <th>एकूण दूध</th>
                      <th>स्वयंपाकघर</th>
                      <th>कुटी</th>
                      <th>डेअरी</th>
                      <th>डेअरी रक्कम</th>
                      <th>एकूण दूध</th>
                      <th>एकूण वितरण</th>
                      <th>डेअरी रक्कम</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="15" className="text-center">
                          लोड होत आहे...
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan="15" className="text-center">
                          {reportData ? 'या कालावधीत कोणताही डेटा उपलब्ध नाही' : 'कृपया तारीख निवडून शोधा बटण दाबा'}
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{startIndex + idx + 1}</td>
                          <td>{item.date ? new Date(item.date).toLocaleDateString('en-IN') : ''}</td>
                          {/* Morning Data */}
                          <td>{item.morning.totalMilk} L</td>
                          <td>{item.morning.kitchen} L</td>
                          <td>{item.morning.kuti} L</td>
                          <td>{item.morning.dairy} L</td>
                          <td>₹{item.morning.dairyAmount}</td>
                          {/* Evening Data */}
                          <td>{item.evening.totalMilk} L</td>
                          <td>{item.evening.kitchen} L</td>
                          <td>{item.evening.kuti} L</td>
                          <td>{item.evening.dairy} L</td>
                          <td>₹{item.evening.dairyAmount}</td>
                          {/* Daily Totals */}
                          <td>{item.dailyTotals.totalMilk} L</td>
                          <td>{item.dailyTotals.totalDistributed} L</td>
                          <td>₹{item.dailyTotals.totalDairyAmount}</td>
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
    </React.Fragment>
  );
}

export default MilkDistributionReport;
