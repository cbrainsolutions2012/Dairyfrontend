import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function GoSevaReceipt() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ sdate: '', edate: '' });
  const [errors, setErrors] = useState({});
  const [receiptData, setReceiptData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Fetch GoSeva receipts report data from API
  const fetchReceiptData = async () => {
    if (!formData.sdate || !formData.edate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mytemplesoftware.in/api/reports/goseva-receipts?startDate=${formData.sdate}&endDate=${formData.edate}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReceiptData(data.data);
      } else {
        setReceiptData([]);
      }
    } catch (err) {
      setReceiptData([]);
    }
    setLoading(false);
  };

  // Export to Excel with Marathi headers
  const handleExportToExcel = () => {
    if (!receiptData || receiptData.length === 0) {
      alert('डेटा उपलब्ध नाही');
      return;
    }
    const excelData = receiptData.map((item, idx) => ({
      अनुक्रमांक: idx + 1,
      'पावती क्रमांक': item.ReceiptNo || '',
      'देणगीदार नाव': item.DonarName || '',
      'संपर्क क्रमांक': item.DengidarPhone || '',
      शहर: item.DengidarCity || '',
      रक्कम: item.Amount || '',
      'कालावधी (महिने)': item.DurationMonths || '',
      'सुरुवात तारीख': item.StartDate ? new Date(item.StartDate).toLocaleDateString('en-IN') : '',
      'समाप्ती तारीख': item.EndDate ? new Date(item.EndDate).toLocaleDateString('en-IN') : '',
      स्थिती: item.Status || '',
      'देयक प्रकार': item.PaymentType || '',
      नोट: item.Note || '',
      'कर्मचारी नाव': item.CreatedByName || ''
    }));
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 8 }, // अनुक्रमांक
      { wch: 15 }, // पावती क्रमांक
      { wch: 20 }, // देणगीदार नाव
      { wch: 15 }, // संपर्क क्रमांक
      { wch: 15 }, // शहर
      { wch: 12 }, // रक्कम
      { wch: 15 }, // कालावधी (महिने)
      { wch: 15 }, // सुरुवात तारीख
      { wch: 15 }, // समाप्ती तारीख
      { wch: 12 }, // स्थिती
      { wch: 12 }, // देयक प्रकार
      { wch: 20 }, // नोट
      { wch: 20 } // कर्मचारी नाव
    ];
    utils.book_append_sheet(wb, ws, 'गोसेवा पावती अहवाल');
    writeFile(wb, `गोसेवा_पावती_अहवाल_${formData.sdate}_to_${formData.edate}.xlsx`);
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
      pdf.save('गोसेवा-पावती.pdf');
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
      await fetchReceiptData();
    } else {
      setErrors(formErrors);
    }
  };

  // Pagination logic
  const filteredData = receiptData.filter(
    (item) =>
      !searchTerm ||
      (item.DonarName && item.DonarName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.DengidarPhone && item.DengidarPhone.includes(searchTerm)) ||
      (item.DengidarCity && item.DengidarCity.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.Status && item.Status.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <Card style={{ width: '800px' }}>
            <Card.Header>
              <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
                गोसेवा पावती अहवाल
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
                <Card.Title as="h4">गोसेवा पावती अहवाल</Card.Title>
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
                      <th>पावती क्रमांक</th>
                      <th>देणगीदार नाव</th>
                      <th>संपर्क क्रमांक</th>
                      <th>शहर</th>
                      <th>रक्कम</th>
                      <th>कालावधी (महिने)</th>
                      <th>सुरुवात तारीख</th>
                      <th>समाप्ती तारीख</th>
                      <th>स्थिती</th>
                      <th>देयक प्रकार</th>
                      <th>नोट</th>
                      <th>कर्मचारी नाव</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="13" className="text-center">
                          लोड होत आहे...
                        </td>
                      </tr>
                    ) : currentData.length === 0 ? (
                      <tr>
                        <td colSpan="13" className="text-center">
                          डेटा उपलब्ध नाही
                        </td>
                      </tr>
                    ) : (
                      currentData.map((item, idx) => (
                        <tr key={item.Id}>
                          <td>{startIndex + idx + 1}</td>
                          <td>{item.ReceiptNo}</td>
                          <td>{item.DonarName}</td>
                          <td>{item.DengidarPhone}</td>
                          <td>{item.DengidarCity}</td>
                          <td>{item.Amount}</td>
                          <td>{item.DurationMonths}</td>
                          <td>{item.StartDate ? new Date(item.StartDate).toLocaleDateString('en-IN') : ''}</td>
                          <td>{item.EndDate ? new Date(item.EndDate).toLocaleDateString('en-IN') : ''}</td>
                          <td>{item.Status}</td>
                          <td>{item.PaymentType}</td>
                          <td>{item.Note}</td>
                          <td>{item.CreatedByName}</td>
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

export default GoSevaReceipt;
