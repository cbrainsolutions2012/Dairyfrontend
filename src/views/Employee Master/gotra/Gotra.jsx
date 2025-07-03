import React, { useEffect, useRef, useState } from 'react';
import '../commonemp.scss';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router';

const Gotra = () => {
  // console.log(tr_number);
  const token = localStorage.getItem('token');
  // console.log(user_id);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    GotraName: ''
  });

  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
  };

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState({});
  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.GotraName) newErrors.GotraName = 'Gotra Name is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      // Handle form submission

      try {
        // const res = await axios.post(`http://api.mytemplesoftware.in/api/admin/gotra_list/${tr_number}`, formData);
        const res = await axios.post(`https://api.mytemplesoftware.in/api/gotra`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setApiError('');
        setFormData({
          GotraName: ''
        });
        if (res.status === 201) {
          alert('Gotra added successfully');
          // Refresh the table data by fetching from API again
          fetchTableData();
        }
      } catch (error) {
        console.error('There is an error submitting form data');
        setApiError(error.message || 'Failed to submit data. Please try again');
      }
      console.log(formData);
    } else {
      setErrors(formErrors);
    }
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/gotra`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('res from api', res.data.gotras);
      const data = res.data.gotras;

      // Handle both single object and array responses
      if (data) {
        if (Array.isArray(data)) {
          setTableData(data);
        } else {
          // If it's a single object, wrap it in an array
          setTableData([data]);
        }
      } else {
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
      setTableData([]);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  console.log('table data', tableData);

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
    writeFile(wb, 'Gotra_Data.xlsx');
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

      pdf.save('Gotra_Data.pdf');
    });
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are You want to Delete this Gotra?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/gotra/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        alert('Gotra deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      setApiError('Gotra not deleted. Please try again.');
      alert('Failed to delete Gotra. Please try again.');
    }
  };

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
              गोत्र नोंदणी
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="GotraName">गोत्र</label>
                  <input type="text" name="GotraName" value={formData.GotraName} onChange={handleChange} />
                  {errors.GotraName && <span className="error">{errors.GotraName}</span>}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit">Submit</button>
              </div>
            </form>
            {apiError && typeof apiError === 'string' && <div className="error">{apiError}</div>}
          </Card.Body>
        </Card>
      </Col>

      <Col sm={12}>
        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <Card.Title as="h5">गोत्र यादी</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" placeholder="Search" value={searchTerm} onChange={handleSearchChange} className="me-2" />
                {/* <Button variant="primary" onClick={handleSearch} className="me-2">
                  Search
                </Button> */}
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
                <Table responsive ref={tableRef} className="mb-0 text-center">
                  <thead>
                    <tr>
                      <th>गोत्र नाव</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(tableData) &&
                      tableData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.GotraName}</td>
                          <td>
                            {/* <Button className="me-2">Edit</Button> */}
                            <Button className="me-2" variant="primary" onClick={() => navigate(`/editgotra/${item.Id}`)}>
                              Edit
                            </Button>
                            <Button variant="danger" onClick={() => confirmDelete(item.Id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
              </PerfectScrollbar>
            </div>
          </Card.Body>
        </Card>
      </Col>

      {/*</Row> */}
    </React.Fragment>
  );
};

export default Gotra;
