import React, { useState, useRef, useEffect } from 'react';
import { Row, Col, Card, Table, Button, Form } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import '../commonemp.scss';

function DonateMaster() {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [gotraList, setGotraList] = useState([]);
  const [tabData, setTabData] = useState([]); // State to hold table data
  const [formData, setFormData] = useState({
    FullName: '',
    MobileNumber: '',
    PanCard: '',
    AdharCard: '', // Fixed: changed from AdharCard to AdharCard to match form field
    GotraTypeId: '',
    City: '',
    Address: '',
    EmailId: '',
    DOB: '',
    RegisterDate: ''
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

  // Function to get gotra name by ID
  const getGotraNameById = (gotraId) => {
    const gotra = gotraList.find((g) => g.Id === gotraId);
    return gotra ? gotra.GotraName : 'Unknown';
  };

  // Function to confirm and handle delete
  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this devotee?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://api.mytemplesoftware.in/api/dengidar/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      // Remove the deleted item from the table data
      setTabData(tabData.filter((item) => item.Id !== id));
      alert('Devotee deleted successfully!');
    } catch (error) {
      console.error('Error deleting devotee:', error);
      alert('Failed to delete devotee. Please try again.');
    }
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/dengidar', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(res.data);
      setTabData(res.data.data);
    } catch (error) {
      console.log(error);
      setTabData([]);
    }
  };

  const getGotraList = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/gotra', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Gotra list:', res.data);

      // Handle both array and single object responses
      const gotras = res.data.gotras;
      if (gotras) {
        if (Array.isArray(gotras)) {
          setGotraList(gotras);
        } else {
          // If it's a single object, wrap it in an array
          setGotraList([gotras]);
        }
      } else {
        setGotraList([]);
      }
    } catch (error) {
      console.error('Error fetching gotra list:', error);
      setGotraList([]);
    }
  };
  useEffect(() => {
    fetchTableData();
    getGotraList();
  }, []);

  const formattedDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString('en-IN', options).replace(/\//g, '-');
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
    if (!formData.FullName) newErrors.FullName = 'Full Name is required';
    if (!formData.City) newErrors.City = 'City is required';
    if (!formData.Address) newErrors.Address = 'Address is required';
    if (!formData.MobileNumber) newErrors.MobileNumber = 'Mobile Number is required';
    if (!formData.EmailId) newErrors.EmailId = 'Email ID is required';
    if (!formData.PanCard) newErrors.PanCard = 'PAN Card is required';
    if (!formData.AdharCard) newErrors.AdharCard = 'Adhaar No. is required'; // Fixed field name
    if (!formData.GotraTypeId) newErrors.GotraTypeId = 'Gotra type is required';
    if (!formData.DOB) newErrors.DOB = 'Date of Birth is required';
    if (!formData.RegisterDate) newErrors.RegisterDate = 'Date is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      // Handle form submission
      try {
        const response = await axios.post('https://api.mytemplesoftware.in/api/dengidar', formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Form submitted successfully:', response.data);

        // Reset form on successful submission
        setFormData({
          FullName: '',
          MobileNumber: '',
          PanCard: '',
          AdharCard: '',
          GotraTypeId: '',
          City: '',
          Address: '',
          EmailId: '',
          DOB: '',
          RegisterDate: ''
        });

        // Clear any previous errors
        setErrors({});

        // Show success message
        alert('Devotee registered successfully!');

        // Refresh table data
        fetchTableData();
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to register devotee. Please try again.');
      }
      console.log(formData);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
              देणगीदार नोंदणी
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="FullName">पुर्ण नाव</label>
                  <input type="text" name="FullName" value={formData.FullName} onChange={handleChange} />
                  {errors.FullName && <span className="error">{errors.FullName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="MobileNumber">दूरध्वनी क्रमांक</label>
                  <input type="text" name="MobileNumber" value={formData.MobileNumber} onChange={handleChange} />
                  {errors.MobileNumber && <span className="error">{errors.MobileNumber}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="PanCard">पॅन कार्ड</label>
                  <input type="text" name="PanCard" value={formData.PanCard} onChange={handleChange} />
                  {errors.PanCard && <span className="error">{errors.PanCard}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="AdharCard">आधार क्रमांक</label>
                  <input type="number" name="AdharCard" value={formData.AdharCard} onChange={handleChange} />
                  {errors.AdharCard && <span className="error">{errors.AdharCard}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="City">शहर</label>
                  <input type="text" name="City" value={formData.City} onChange={handleChange} />
                  {errors.City && <span className="error">{errors.City}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="GotraTypeId">गोत्र प्रकार</label>
                  <select name="GotraTypeId" value={formData.GotraTypeId} onChange={handleChange}>
                    <option value="">Select Gotra Type</option>
                    {gotraList.map((gotra) => (
                      <option key={gotra.Id} value={gotra.Id}>
                        {gotra.GotraName}
                      </option>
                    ))}
                  </select>
                  {errors.GotraTypeId && <span className="error">{errors.GotraTypeId}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="EmailId">ई-मेल</label>
                  <input type="email" name="EmailId" value={formData.EmailId} onChange={handleChange} />
                  {errors.EmailId && <span className="error">{errors.EmailId}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="RegisterDate">दिनांक</label>
                  <input type="date" name="RegisterDate" value={formData.RegisterDate} onChange={handleChange} />
                  {errors.RegisterDate && <span className="error">{errors.RegisterDate}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="DOB">जन्मतारीख</label>
                  <input type="date" name="DOB" value={formData.DOB} onChange={handleChange} />
                  {errors.DOB && <span className="error">{errors.DOB}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Address">पत्ता</label>
                  <textarea rows={3} type="text" name="Address" value={formData.Address} onChange={handleChange} />
                  {errors.Address && <span className="error">{errors.Address}</span>}
                </div>
              </div>

              <div className="form-actions">
                <Button variant="primary" type="submit">
                  Submit
                </Button>
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
                      <th>दिनांक</th>
                      <th>पुर्ण नाव</th>
                      <th>दूरध्वनी क्रमांक</th>
                      <th>पॅन कार्ड</th>
                      <th>आधार क्रमांक</th>
                      <th>गोत्र</th>
                      <th>शहर</th>
                      <th>पत्ता</th>
                      <th>ई-मेल</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(tabData) &&
                      tabData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.Id}</td>
                          <td>{formattedDate(item.RegisterDate)}</td>
                          <td>{item.FullName}</td>
                          <td>{item.MobileNumber}</td>
                          <td>{item.PanCard}</td>
                          <td>{item.AdharCard}</td>
                          <td>{getGotraNameById(item.GotraTypeId)}</td>
                          <td>{item.City}</td>
                          <td>{item.Address}</td>
                          <td>{item.EmailId}</td>
                          <td>
                            {/* <Button className="me-2">Edit</Button> */}
                            <Button variant="warning" href={`/editdevotee/${item.Id}`}>
                              Edit
                            </Button>
                            <Button variant="danger" className="me-2" onClick={() => confirmDelete(item.id || item.Id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    {/* More rows */}
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

export default DonateMaster;
