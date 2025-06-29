import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import '../commonemp.scss';
import { useNavigate } from 'react-router';

function Emp() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);
  const [formData, setFormData] = useState({
    FullName: '',
    MobileNumber: '',
    Username: '',
    Password: '',
    Pancard: '',
    Dob: '',
    EmailId: '',
    City: '',
    Address: '',
    WorkingArea: '',
    Adharcard: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.FullName) newErrors.FullName = 'Full Name is required';
    if (!formData.MobileNumber) newErrors.MobileNumber = 'Mobile Number is required';
    if (!formData.Username) newErrors.Username = 'User Name is required';
    if (!formData.Password) newErrors.Password = 'Password is required';
    if (!formData.Pancard) newErrors.Pancard = 'Pancard is required';
    if (!formData.Dob) newErrors.Dob = 'Date of Birth is required';
    if (!formData.EmailId) newErrors.EmailId = 'Email ID is required';
    if (!formData.City) newErrors.City = 'City is required';
    if (!formData.Address) newErrors.Address = 'Address is required';
    if (!formData.WorkingArea) newErrors.WorkingArea = 'Working Area is required';
    if (!formData.Adharcard) newErrors.Adharcard = 'Adhar Card is required';
    return newErrors;
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/employees', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = res.data.employees;
      if (data) {
        if (Array.isArray(data)) {
          setTableData(data);
        } else {
          console.error('Expected data to be an array, but got:', data);
          setApiError('Failed to fetch table data. Please try again.');
        }
      } else {
        console.error('No data found in the response:', res.data);
        setApiError('No data found. Please try again later.');
      }
      console.log(res.data);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchTableData();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      // Handle form submission
      try {
        const response = await axios.post(`https://api.mytemplesoftware.in/api/employees`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(response);
        setFormData({
          FullName: '',
          MobileNumber: '',
          Username: '',
          Password: '',
          Pancard: '',
          Dob: '',
          EmailId: '',
          City: '',
          Address: '',
          WorkingArea: '',
          Adharcard: ''
        });
        setApiError('');
        if (response.status === 201) {
          setTimeout(() => {
            alert('Employee registered successfully');
            fetchTableData();
          }, 2000);
        }
      } catch (error) {
        console.error('There is an error submitting form data');
        alert('There is an error submitting form data');
        console.error(error);
        setApiError(error.message || 'Failed to submit data. Please try again');
      }
    } else {
      setErrors(formErrors);
    }
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(`https://api.mytemplesoftware.in/api/employees/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(response);
      if (response.status === 200) {
        alert('Employee deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      console.error('There is an error deleting employee');
      alert('There is an error deleting employee');
      console.error(error);
    }
  };

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
              नवीन कर्मचारी नोंदणी
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="FullName">पूर्ण नाव</label>
                  <input type="text" name="FullName" value={formData.FullName} onChange={handleChange} />
                  {errors.FullName && <span className="error">{errors.FullName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="MobileNumber">दूरध्वनी क्रमांक</label>
                  <input type="number" name="MobileNumber" value={formData.MobileNumber} onChange={handleChange} />
                  {errors.MobileNumber && <span className="error">{errors.MobileNumber}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Username">वापरकर्ता नाव</label>
                  <input type="text" name="Username" value={formData.Username} onChange={handleChange} />
                  {errors.Username && <span className="error">{errors.Username}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Password">पासवर्ड</label>
                  <input type="password" name="Password" value={formData.Password} onChange={handleChange} />
                  {errors.Password && <span className="error">{errors.Password}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Pancard">पॅन कार्ड</label>
                  <input type="text" name="Pancard" value={formData.Pancard} onChange={handleChange} />
                  {errors.Pancard && <span className="error">{errors.Pancard}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Adharcard">आधार कार्ड क्रमांक</label>
                  <input type="text" name="Adharcard" value={formData.Adharcard} onChange={handleChange} />
                  {errors.Adharcard && <span className="error">{errors.Adharcard}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="EmailId">ईमेल</label>
                  <input type="email" name="EmailId" value={formData.EmailId} onChange={handleChange} />
                  {errors.EmailId && <span className="error">{errors.EmailId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Dob">जन्मतारीख</label>
                  <input type="date" name="Dob" value={formData.Dob} onChange={handleChange} />
                  {errors.Dob && <span className="error">{errors.Dob}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="City">शहर</label>
                  <input type="text" name="City" value={formData.City} onChange={handleChange} />
                  {errors.City && <span className="error">{errors.City}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="WorkingArea">कार्य क्षेत्र</label>
                  <select name="WorkingArea" value={formData.WorkingArea} onChange={handleChange}>
                    <option value="">Select Working Area</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="accountant">Accountant</option>
                    <option value="peon">Peon</option>
                    <option value="driver">Driver</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.WorkingArea && <span className="error">{errors.WorkingArea}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Address">पत्ता</label>
                  <textarea rows={3} type="text" name="Address" value={formData.Address} onChange={handleChange} />
                  {errors.Address && <span className="error">{errors.Address}</span>}
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
                <Card.Title as="h5">Temple Master</Card.Title>
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
              <PerfectScrollbar options={{ suppressScrollX: true, wheelPropagation: false }}>
                <Table responsive ref={tableRef}>
                  <thead>
                    <tr>
                      <th>पूर्ण नाव</th>
                      <th>मोबाईल क्रमांक</th>
                      <th>पॅनकार्ड</th>
                      <th>जन्मतारीख</th>
                      <th>ईमेल आयडी</th>
                      <th>शहर</th>
                      <th>पत्ता</th>
                      <th>कार्यक्षेत्र</th>
                      <th>आधारकार्ड</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData
                      .filter((item) => item.FullName.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((item) => (
                        <tr key={item.Id}>
                          <td>{item.FullName}</td>
                          <td>{item.MobileNumber}</td>
                          <td>{item.Pancard}</td>
                          <td>{new Date(item.Dob).toLocaleDateString('en-IN')}</td>
                          <td>{item.EmailId}</td>
                          <td>{item.City}</td>
                          <td>{item.Address}</td>
                          <td>{item.WorkingArea}</td>
                          <td>{item.Adharcard}</td>
                          <td>
                            <Button variant="primary" onClick={() => navigate(`/editemp/${item.Id}`)}>
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
}

export default Emp;
