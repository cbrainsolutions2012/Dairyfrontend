import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../common.scss';

function TotalDevotee() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ sdate: '', edate: '' });
  const [errors, setErrors] = useState({});
  const [devoteeData, setDevoteeData] = useState([]);
  const [loading, setLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Fetch devotee report data from API
  const fetchDevoteeData = async () => {
    if (!formData.sdate || !formData.edate) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mytemplesoftware.in/api/reports/dengidar?startDate=${formData.sdate}&endDate=${formData.edate}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}` // Ensure you have the token stored in localStorage
          }
        }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDevoteeData(data.data);
      } else {
        setDevoteeData([]);
      }
    } catch (err) {
      setDevoteeData([]);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    // Optionally filter by searchTerm if needed
  };

  // Export devoteeData to Excel with Marathi headers
  const handleExportToExcel = () => {
    if (!devoteeData || devoteeData.length === 0) {
      alert('डेटा उपलब्ध नाही');
      return;
    }
    const excelData = devoteeData.map((item, idx) => ({
      अनुक्रमांक: idx + 1,
      'पूर्ण नाव': item.FullName || '',
      'संपर्क क्रमांक': item.MobileNumber || '',
      शहर: item.City || '',
      पत्ता: item.Address || '',
      'गोत्र नाव': item.GotraName || '',
      'रजिस्टर तारीख': item.RegisterDate ? new Date(item.RegisterDate).toLocaleDateString('en-IN') : '',
      'कर्मचारी नाव': item.CreatedByName || '',
      'एकूण पावत्या': item.totalReceipts || 0,
      'एकूण रक्कम': item.totalAmount || '0.00'
    }));
    const wb = utils.book_new();
    const ws = utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 8 }, // अनुक्रमांक
      { wch: 20 }, // पूर्ण नाव
      { wch: 15 }, // संपर्क क्रमांक
      { wch: 15 }, // शहर
      { wch: 30 }, // पत्ता
      { wch: 15 }, // गोत्र नाव
      { wch: 15 }, // रजिस्टर तारीख
      { wch: 20 }, // कर्मचारी नाव
      { wch: 12 }, // एकूण पावत्या
      { wch: 15 } // एकूण रक्कम
    ];
    utils.book_append_sheet(wb, ws, 'एकूण भक्त अहवाल');
    writeFile(wb, `एकूण_भक्त_अहवाल_${formData.sdate}_to_${formData.edate}.xlsx`);
  };

  const handleExportToPDF = () => {
    // ...existing code...
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
      pdf.save('TotalDevotee_Data.pdf');
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
      await fetchDevoteeData();
    } else {
      setErrors(formErrors);
    }
  };

  // Filtered and paginated data
  const filteredData = devoteeData.filter(
    (item) =>
      !searchTerm ||
      (item.FullName && item.FullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.MobileNumber && item.MobileNumber.includes(searchTerm)) ||
      (item.City && item.City.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <Card style={{ width: '600px' }}>
            <Card.Header>
              <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
                एकूण भक्त अहवाल
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
                <Card.Title as="h4">एकूण भक्त अहवाल</Card.Title>
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
                      <th>पूर्ण नाव</th>
                      <th>संपर्क क्रमांक</th>
                      <th>शहर</th>
                      <th>पत्ता</th>
                      <th>गोत्र नाव</th>
                      <th>रजिस्टर तारीख</th>
                      <th>कर्मचारी नाव</th>
                      <th>एकूण पावत्या</th>
                      <th>एकूण रक्कम</th>
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
                          <td>{item.FullName}</td>
                          <td>{item.MobileNumber}</td>
                          <td>{item.City}</td>
                          <td>{item.Address}</td>
                          <td>{item.GotraName}</td>
                          <td>{item.RegisterDate ? new Date(item.RegisterDate).toLocaleDateString('en-IN') : ''}</td>
                          <td>{item.CreatedByName}</td>
                          <td>{item.totalReceipts}</td>
                          <td>{item.totalAmount}</td>
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

export default TotalDevotee;
