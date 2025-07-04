import React, { useEffect, useRef, useState } from 'react';
import '../commonemp.scss';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

function Pooja() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    SevaName: ''
  });

  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState({});
  const [tableData, setTableData] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.SevaName) newErrors.SevaName = 'Pooja Name is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      // Handle form submission

      try {
        // const res = await axios.post(`http://api.mytemplesoftware.in/api/admin/gotra_list/${tr_number}`, formData);
        const res = await axios.post(`https://api.mytemplesoftware.in/api/seva`, formData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log(formData);
        console.log(res);
        setFormData({
          ...formData,
          SevaName: ''
        });
        setApiError('');
        if (res.status === 201) {
          alert('Seva added successfully');
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
    writeFile(wb, 'Seva_Data.xlsx');
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

      pdf.save('Seva_Data.pdf');
    });
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/seva`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = res.data.sevas;
      console.log('Fetched data:', data);

      if (data) {
        if (Array.isArray(data)) {
          setTableData(data);
        } else {
          console.error('Data is not an array:', data);
          setApiError('Failed to fetch data. Please try again.');
        }
      } else {
        console.error('No data found');
        setApiError('No data found. Please try again.');
        setTableData([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure want to delete this Pooja.')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/seva/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.status === 200) {
        alert('Seva deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      setApiError('Seva not deleted. Please try again.');
      alert('Failed to delete Seva. Please try again.');
    }
  };

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              सेवा नोंदणी
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="SevaName">सेवेचे नाव</label>
                  <input type="text" name="SevaName" value={formData.SevaName} onChange={handleChange} />
                  {errors.SevaName && <span className="error">{errors.SevaName}</span>}
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
                <Card.Title as="h4">सेवा यादी</Card.Title>
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
                      <th>सेवेचे नाव</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(tableData) &&
                      tableData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.SevaName}</td>
                          <td>
                            <Button className="me-2" variant="primary" onClick={() => navigate(`/editseva/${item.Id}`)}>
                              <FaEdit />
                            </Button>
                            <Button variant="danger" onClick={() => confirmDelete(item.Id)}>
                              <FaTrashAlt />
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
}

export default Pooja;
