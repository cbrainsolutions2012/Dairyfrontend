import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import '../commonemp.scss';
import { useNavigate } from 'react-router';

function ConterMaster() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    counterNo: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.counterNo) newErrors.counterNo = 'Counter No. is required';
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
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get('http://api.mytemplesoftware.in/api/admin/employee_registration/');
      console.log(res.data);
    } catch (error) {
      console.log(error);
    }
  };
  // useEffect(() => {
  //   fetchTableData();
  // }, []);

  const handleExportToExcel = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // Remove the "Action" column from the cloned table

    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove(); // header remove

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
    });

    // Convert the modified table to a workbook and export

    const wb = utils.table_to_book(clonedTable);
    writeFile(wb, 'temple-master.xlsx');
  };

  const handleExportToPDF = () => {
    // get table
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);

    // remove action feild
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove(); //remove header

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
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

  const employeeNames = ['John Doe', 'Jane Smith', 'Bob Johnson']; // Replace with actual employee names
  const counterNumbers = ['1', '2', '3', '4', '5']; // Replace with actual counter numbers

  return (
    <React.Fragment>
      <Col sm={12} style={{ display: 'flex', justifyContent: 'center' }}>
        <Card style={{ width: '600px' }}>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              काउंटर नोंदणी
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">कर्मचारी नाव</label>
                  <select name="name" value={formData.name} onChange={handleChange}>
                    <option value="">कर्मचारी निवडा</option>
                    {employeeNames.map((name, index) => (
                      <option key={index} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {errors.name && <span className="error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="counterNo">काउंटर क्रमांक</label>
                  <select name="counterNo" value={formData.counterNo} onChange={handleChange}>
                    <option value="">काउंटर निवडा</option>
                    {counterNumbers.map((number, index) => (
                      <option key={index} value={number}>
                        {number}
                      </option>
                    ))}
                  </select>
                  {errors.counterNo && <span className="error">{errors.counterNo}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="success">
                  Submit
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h4">Temple Master</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" placeholder="Search" value={searchTerm} onChange={handleSearchChange} className="me-2" />
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
                      <th>Temple Name</th>
                      <th>Reg. No.</th>
                      <th>City</th>
                      <th>Contact No.</th>
                      <th>PAN Card No.</th>
                      <th>Start Date</th>
                      <th>Amount</th>
                      <th>Contact Name</th>
                      <th>Action</th>
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
                      <td>
                        <Button variant="danger">Delete</Button>
                      </td>
                    </tr>
                    {/* More rows */}
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

export default ConterMaster;
