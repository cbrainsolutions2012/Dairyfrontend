import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import '../commonemp.scss';
import { useNavigate } from 'react-router';

function TempleProfile() {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableData, setTableData] = useState([]);
  const [formData, setFormData] = useState({
    TempleName: '',
    MobileNo: '',
    City: '',
    RegNumber: '',
    Website: '',
    OwnerName: '',
    EmailId: '',
    Pancard: '',
    GSTNumber: '',
    Address: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search term:', searchTerm);
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/temples', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        const data = res.data.temples;
        setTableData(data);
      } else {
        console.error('Failed to fetch table data:', res.statusText);
        alert('Failed to fetch table data. Please try again.');
      }
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

  const validate = () => {
    const newErrors = {};
    if (!formData.TempleName) newErrors.TempleName = 'Temple Name is required';
    // if (!formData.City) newErrors.City = 'City is required';
    // if (!formData.Address) newErrors.Address = 'Address is required';
    // if (!formData.MobileNo) newErrors.MobileNo = 'Mobile No. is required';
    // if (!formData.EmailId) newErrors.EmailId = 'Email ID is required';
    // if (!formData.Pancard) newErrors.Pancard = 'Pancard is required';
    if (!formData.RegNumber) newErrors.RegNumber = 'Registration Number is required';
    // if (!formData.Website) newErrors.Website = 'Website URL is required';
    if (!formData.OwnerName) newErrors.OwnerName = 'Owner Name is required';
    // if (!formData.GSTNumber) newErrors.GSTNumber = 'GST Number is required';
    if (!formData.MobileNo.match(/^\d{10}$/)) newErrors.MobileNo = 'Mobile No. must be 10 digits';
    // if (formData.EmailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.EmailId)) {
    //   newErrors.EmailId = 'Invalid email format';
    // }
    // if (formData.Pancard && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.Pancard)) {
    // newErrors.Pancard = 'Invalid PAN card format';
    // }
    // if (formData.GSTNumber && !/^[0-9]{2}[A-Z]{4}[0-9]{7}[A-Z][A-Z0-9][A-Z0-9]$/.test(formData.GSTNumber)) {
    //   newErrors.GSTNumber = 'Invalid GST Number format';
    // }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        // Handle form submission
        const res = await axios.post('https://api.mytemplesoftware.in/api/temples', formData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (res.status === 201) {
          alert('Temple profile created successfully');
          setFormData({
            TempleName: '',
            MobileNo: '',
            City: '',
            RegNumber: '',
            Website: '',
            OwnerName: '',
            EmailId: '',
            Pancard: '',
            GSTNumber: '',
            Address: ''
          });
          setErrors({});
          // Refresh table data instead of manually adding to state
          fetchTableData();
        }
      } catch (error) {
        console.error('There is an error submitting form data:', error);
        if (error.response && error.response.data && error.response.data.message) {
          setErrors({ submit: error.response.data.message });
          alert(`Failed to submit data: ${error.response.data.message}`);
        } else {
          setErrors({ submit: 'Failed to submit data. Please try again' });
          alert('Failed to submit data. Please try again');
        }
      }
    } else {
      setErrors(formErrors);
    }
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this temple profile?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/temples/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.status === 200) {
        alert('Temple profile deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      console.error('There is an error deleting the temple profile');
      alert('Failed to delete temple profile. Please try again');
    }
  };

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
              ट्रस्ट ची माहिती
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="TempleName">मंदिराचे नाव / ट्रस्टचे नाव</label>
                  <input type="text" name="TempleName" value={formData.TempleName} onChange={handleChange} />
                  {errors.TempleName && <span className="error">{errors.TempleName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="MobileNo">दूरध्वनी क्रमांक</label>
                  <input type="text" name="MobileNo" value={formData.MobileNo} onChange={handleChange} />
                  {errors.MobileNo && <span className="error">{errors.MobileNo}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="City">शहर</label>
                  <input type="text" name="City" value={formData.City} onChange={handleChange} />
                  {errors.City && <span className="error">{errors.City}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Website">वेबसाइट URL</label>
                  <input type="text" name="Website" value={formData.Website} onChange={handleChange} />
                  {errors.Website && <span className="error">{errors.Website}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="OwnerName">प्रमुखाचे नाव</label>
                  <input type="text" name="OwnerName" value={formData.OwnerName} onChange={handleChange} />
                  {errors.OwnerName && <span className="error">{errors.OwnerName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="EmailId">ईमेल</label>
                  <input type="email" name="EmailId" value={formData.EmailId} onChange={handleChange} />
                  {errors.EmailId && <span className="error">{errors.EmailId}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Pancard">पॅन कार्ड क्रमांक</label>
                  <input type="text" name="Pancard" value={formData.Pancard} onChange={handleChange} />
                  {errors.Pancard && <span className="error">{errors.Pancard}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="RegNumber">रजिस्ट्रेशन क्रमांक</label>
                  <input type="text" name="RegNumber" value={formData.RegNumber} onChange={handleChange} />
                  {errors.RegNumber && <span className="error">{errors.RegNumber}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="GSTNumber">पिनकोड</label>
                  <input type="text" name="GSTNumber" value={formData.GSTNumber} onChange={handleChange} />
                  {errors.GSTNumber && <span className="error">{errors.GSTNumber}</span>}
                </div>
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
              <PerfectScrollbar>
                <Table responsive ref={tableRef}>
                  <thead>
                    <tr>
                      <th>आयडी</th>
                      <th>मंदिराचे नाव / ट्रस्टचे नाव</th>
                      <th>दूरध्वनी क्रमांक</th>
                      <th>शहर</th>
                      <th>वेबसाइट URL</th>
                      <th>प्रमुखाचे नाव</th>
                      <th>ईमेल</th>
                      <th>पॅन कार्ड क्रमांक</th>
                      <th>रजिस्ट्रेशन क्रमांक</th>
                      <th>जीएसटी क्रमांक</th>
                      <th>पत्ता</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((item, index) => (
                      <tr key={index}>
                        <td>{item.Id}</td>
                        <td>{item.TempleName}</td>
                        <td>{item.MobileNo}</td>
                        <td>{item.City}</td>
                        <td>{item.Website}</td>
                        <td>{item.OwnerName}</td>
                        <td>{item.EmailId}</td>
                        <td>{item.Pancard}</td>
                        <td>{item.RegNumber}</td>
                        <td>{item.GSTNumber}</td>
                        <td>{item.Address}</td>
                        <td>
                          <Button className="me-2" variant="primary" onClick={() => navigate(`/edittemple/${item.Id}`)}>
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

export default TempleProfile;
