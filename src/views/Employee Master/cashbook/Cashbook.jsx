import React, { useState, useRef } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../commonemp.scss';

function Cashbook() {
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

  return (
    <Col sm={12}>
      <Card>
        <Card.Header>
          <Row>
            <Col md={6}>
              <Card.Title as="h5">रोख नोंदवही</Card.Title>
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
                    <th>पक्षाचे नाव</th>
                    <th>दिनांक</th>
                    <th>रक्कम</th>
                    <th>पॅन कार्ड क्रमांक</th>
                    <th>व्यवहार प्रकार (क्रेडिट/डेबिट)</th>
                    <th>कारवाई</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>Example Party</td>
                    <td>08-11-2016</td>
                    <td>485</td>
                    <td>ABCDE1234F</td>
                    <td>Credit</td>
                    <td>
                      <Button variant="primary" className="me-2">
                        Edit
                      </Button>
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
  );
}

export default Cashbook;
