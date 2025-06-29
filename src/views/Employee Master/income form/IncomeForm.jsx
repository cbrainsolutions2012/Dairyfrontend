import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../commonemp.scss';

function IncomeForm() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
  };

  const handleExportToExcel = () => {
    console.log('excel');
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // Remove the "Action" column from the cloned table
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    if (headers[actionIndex]) headers[actionIndex].remove(); // header remove

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) cells[actionIndex].remove();
    });

    // Convert the modified table to a workbook and export
    const wb = utils.table_to_book(clonedTable);
    writeFile(wb, 'temple-master.xlsx');
  };

  const handleExportToPDF = () => {
    console.log('pdf');

    // get table
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // remove action field
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    if (headers[actionIndex]) headers[actionIndex].remove(); // remove header

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) cells[actionIndex].remove();
    });

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

      pdf.save('temple-master.pdf');
    });
  };

  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    date: '',
    note: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.note) newErrors.note = 'Note is required';
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
              <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
                उत्पन्न प्रकार
              </Card.Title>
            </Card.Header>
            <Card.Body className="p-0">
              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">नाव</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} />
                    {errors.name && <span className="error">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="amount">रक्कम</label>
                    <input type="text" name="contactNo" value={formData.amount} onChange={handleChange} />
                    {errors.amount && <span className="error">{errors.amount}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">दिनांक</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} />
                    {errors.date && <span className="error">{errors.date}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="note">नोंद</label>
                    <input type="text" name="note" value={formData.note} onChange={handleChange} />
                    {errors.note && <span className="error">{errors.note}</span>}
                  </div>
                </div>
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
                <Card.Title as="h5">उत्पन्न</Card.Title>
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
                <Table responsive ref={tableRef}>
                  <thead>
                    <tr>
                      <th>अनुक्रमांक</th>
                      <th>नाव</th>
                      <th>दिनांक</th>
                      <th>रक्कम</th>
                      <th>नोंद</th>
                      <th>कारवाई</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>08-11-2016</td>
                      <td>786</td>
                      <td>485</td>
                      <td>769</td>
                      <td>769</td>
                      <td>
                        <Button variant="danger">Delete</Button>
                      </td>
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

export default IncomeForm;
