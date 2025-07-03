import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../common.scss';

function Income() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ sdate: '', edate: '' });
  const [errors, setErrors] = useState({});
  const [incomeData, setIncomeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Fetch income report data from API
  const fetchIncomeData = async () => {
    if (!formData.sdate || !formData.edate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mytemplesoftware.in/api/reports/income?startDate=${formData.sdate}&endDate=${formData.edate}&detailed=true`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setIncomeData(data.data);
      } else {
        setIncomeData([]);
      }
    } catch (err) {
      setIncomeData([]);
    }
    setLoading(false);
  };

  // Export to Excel with Marathi headers
  const handleExportToExcel = () => {
    if (!incomeData || incomeData.length === 0) {
      alert('डेटा उपलब्ध नाही');
      return;
    }
    const excelData = incomeData.map((item, idx) => ({
      अनुक्रमांक: idx + 1,
      तारीख: item.Date ? new Date(item.Date).toLocaleDateString('en-IN') : '',
      'पक्षाचे नाव': item.PartyName || '',
      वर्णन: item.Description || '',
      रक्कम: item.Amount || '',
      'बँकेचे नाव': item.BankName || '',
      काउंटर: item.CounterName || '',
      'Transaction Type': item.TransactionType || '',
      'Reference Id': item.ReferenceId || '',
      'Reference Table': item.ReferenceTable || ''
    }));
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 8 }, // अनुक्रमांक
      { wch: 15 }, // तारीख
      { wch: 20 }, // पक्षाचे नाव
      { wch: 30 }, // वर्णन
      { wch: 12 }, // रक्कम
      { wch: 20 }, // बँकेचे नाव
      { wch: 15 }, // काउंटर
      { wch: 15 }, // Transaction Type
      { wch: 12 }, // Reference Id
      { wch: 15 } // Reference Table
    ];
    utils.book_append_sheet(wb, ws, 'उत्पन्न अहवाल');
    writeFile(wb, `उत्पन्न_अहवाल_${formData.sdate}_to_${formData.edate}.xlsx`);
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
      pdf.save('उत्पन्न-अहवाल.pdf');
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.sdate) newErrors.sdate = 'Date is required';
    if (!formData.edate) newErrors.edate = 'Date is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      await fetchIncomeData();
    } else {
      setErrors(formErrors);
    }
  };

  // Pagination logic
  const filteredData = incomeData.filter(
    (item) =>
      !searchTerm ||
      (item.PartyName && item.PartyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.Description && item.Description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.BankName && item.BankName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
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
              <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
                उत्पन्न अहवाल
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
                  <button type="submit">शोधा</button>
                  <button type="button" onClick={() => setFormData({ sdate: '', edate: '' })}>
                    रद्द करा
                  </button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h5">उत्पन्न अहवाल</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" value={searchTerm} placeholder="Search" onChange={handleSearchChange} />
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
                      <th>अनुक्रमांक</th>
                      <th>तारीख</th>
                      <th>पक्षाचे नाव</th>
                      <th>वर्णन</th>
                      <th>रक्कम</th>
                      <th>बँकेचे नाव</th>
                      <th>व्यवहार प्रकार</th>
                      <th>संदर्भ टेबल</th>
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
                          डेटा उपलब्ध नाही
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, idx) => (
                        <tr key={item.Id}>
                          <td>{startIndex + idx + 1}</td>
                          <td>{item.Date ? new Date(item.Date).toLocaleDateString('en-IN') : ''}</td>
                          <td>{item.PartyName}</td>
                          <td>{item.Description}</td>
                          <td>{item.Amount}</td>
                          <td>{item.BankName}</td>
                          <td>{item.TransactionType}</td>
                          <td>{item.ReferenceTable}</td>
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

export default Income;
