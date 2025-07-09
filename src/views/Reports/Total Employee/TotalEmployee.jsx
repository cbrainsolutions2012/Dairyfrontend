import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../common.scss';

function TotalEmployee() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
  };

  const handleExportToExcel = () => {
    const table = tableRef.current;
    if (!table) {
      alert('No table data found to export');
      return;
    }

    try {
      // Convert the table directly to a workbook
      const wb = utils.table_to_book(table);

      // Add timestamp to filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `Total_Employee_Report_${timestamp}.xlsx`;

      writeFile(wb, filename);
      alert(`Excel file exported successfully as ${filename}`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export Excel file. Please try again.');
    }
  };

  const handleExportToPDF = () => {
    console.log('pdf');

    // get table
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

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

      pdf.save('TotalEmployee_Data.pdf');
    });
  };

  const [formData, setFormData] = useState({
    sdate: '',
    edate: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.sdate) newErrors.sdate = 'Date is required';
    if (!formData.edate) newErrors.edate = 'Date is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      // Handle form submission
      console.log(formData);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <React.Fragment>
      <Row>
        <Col sm={12} style={{ display: 'flex', justifyContent: 'center' }}>
          <Card style={{ width: '600px' }}>
            <Card.Header>
              <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
                एकूण कर्मचार्‍यांचा अहवाल
              </Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="sdate">नाव</label>
                    <input type="date" name="sdate" value={formData.sdate} onChange={handleChange} />
                    {errors.sdate && <span className="error">{errors.sdate}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="edate">रक्कम</label>
                    <input type="date" name="edate" value={formData.edate} onChange={handleChange} />
                    {errors.edate && <span className="error">{errors.edate}</span>}
                  </div>
                </div>
                {/* <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Date</label>
                    <input style={{ width: '50%' }} type="date" name="city" value={formData.date} onChange={handleChange} />
                    {errors.date && <span className="error">{errors.date}</span>}
                  </div>
                </div> */}
                <div className="form-actions">
                  <button type="submit">Submit</button>
                  <button type="button" onClick={() => setFormData({})}>
                    Cancel
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
                <Card.Title as="h4">एकूण कर्मचार्‍यांचा अहवाल</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" value={searchTerm} placeholder="Search" onChange={handleSearchChange} />
                <Button variant="primary" onClick={handleSearch} className="me-2">
                  Search
                </Button>
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
                      <th>अनुक्रमांक</th>
                      <th>कर्मचारी नाव</th>
                      <th>मोबाइल क्रमांक</th>
                      <th>शहर</th>
                      <th>ईमेल आयडी</th>
                      <th>पत्ता</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>08-11-2016</td>
                      <td>786</td>
                      <td>485</td>
                      <td>769</td>
                      <td>45,3%</td>
                      <td>6,7%</td>
                      <td>8,56</td>
                      <td>10:55</td>
                    </tr>
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </React.Fragment>
  );
}

export default TotalEmployee;
