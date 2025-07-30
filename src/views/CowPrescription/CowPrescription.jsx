import React, { useEffect, useRef, useState } from 'react';
import '../commonemp.scss';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const CowPrescription = () => {
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    Date: '',
    CowId: '',
    TabletName: '',
    MorningTablet: '',
    EveningTablet: '',
    NoOfDays: '',
    DoctorName: ''
  });

  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState({});
  const [tableData, setTableData] = useState([]);
  const [cowList, setCowList] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.Date) newErrors.Date = 'Date is required';
    if (!formData.CowId) newErrors.CowId = 'Cow selection is required';
    if (!formData.TabletName) newErrors.TabletName = 'Tablet Name is required';
    if (!formData.MorningTablet) newErrors.MorningTablet = 'Morning Tablet is required';
    if (!formData.EveningTablet) newErrors.EveningTablet = 'Evening Tablet is required';
    if (!formData.NoOfDays) newErrors.NoOfDays = 'Number of Days is required';
    if (!formData.DoctorName) newErrors.DoctorName = 'Doctor Name is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const submitData = {
          Date: formData.Date,
          CowId: parseInt(formData.CowId),
          TabletName: formData.TabletName,
          MorningTablet: parseInt(formData.MorningTablet),
          EveningTablet: parseInt(formData.EveningTablet),
          NoOfDays: parseInt(formData.NoOfDays),
          DoctorName: formData.DoctorName
        };

        let res;
        if (isEditing && editingId) {
          // Update existing prescription
          res = await axios.put(`https://api.mytemplesoftware.in/api/cow-prescription/${editingId}`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 200) {
            alert('Cow Prescription updated successfully');
            setIsEditing(false);
            setEditingId(null);
          }
        } else {
          // Add new prescription
          res = await axios.post(`https://api.mytemplesoftware.in/api/cow-prescription`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 201) {
            alert('Cow Prescription added successfully');
          }
        }

        setApiError('');
        setFormData({
          Date: '',
          CowId: '',
          TabletName: '',
          MorningTablet: '',
          EveningTablet: '',
          NoOfDays: '',
          DoctorName: ''
        });
        fetchTableData();
      } catch (error) {
        console.error('There is an error submitting form data');
        setApiError(error.message || 'Failed to submit data. Please try again');
      }
      console.log(formData);
    } else {
      setErrors(formErrors);
    }
  };

  const fetchCowList = async () => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/cows`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('cows from api', res.data.cows);
      const data = res.data.cows || [];
      setCowList(data);
    } catch (error) {
      console.log('Error fetching cows:', error);
      setCowList([]);
    }
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/cow-prescription`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('res from api', res.data.prescriptions);
      const data = res.data.prescriptions;

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
    fetchCowList();
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
    writeFile(wb, 'Cow_Prescription_Data.xlsx');
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

      pdf.save('Cow_Prescription_Data.pdf');
    });
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are You want to Delete this Cow Prescription?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/cow-prescription/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        alert('Cow Prescription deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      setApiError('Cow Prescription not deleted. Please try again.');
      alert('Failed to delete Cow Prescription. Please try again.');
    }
  };

  // Filter table data based on search term
  const filteredTableData = tableData.filter((item) => {
    return (
      (item.CowName && item.CowName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.TabletName && item.TabletName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.DoctorName && item.DoctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.Date && item.Date.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleEdit = (record) => {
    // Format the date properly for date input
    const formattedDate = record.Date ? record.Date.split('T')[0] : '';

    setFormData({
      Date: formattedDate,
      CowId: record.CowId.toString(),
      TabletName: record.TabletName,
      MorningTablet: record.MorningTablet.toString(),
      EveningTablet: record.EveningTablet.toString(),
      NoOfDays: record.NoOfDays.toString(),
      DoctorName: record.DoctorName
    });
    setIsEditing(true);
    setEditingId(record.Id);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setFormData({
      Date: '',
      CowId: '',
      TabletName: '',
      MorningTablet: '',
      EveningTablet: '',
      NoOfDays: '',
      DoctorName: ''
    });
    setIsEditing(false);
    setEditingId(null);
    setErrors({});
  };

  return (
    <React.Fragment>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'गाय प्रिस्क्रिप्शन संपादित करा' : 'गाय प्रिस्क्रिप्शन नोंदणी'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="Date">दिनांक</label>
                  <input type="date" name="Date" value={formData.Date} onChange={handleChange} />
                  {errors.Date && <span className="error">{errors.Date}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="CowId">गाय निवडा</label>
                  <select name="CowId" value={formData.CowId} onChange={handleChange}>
                    <option value="">गाय निवडा</option>
                    {cowList.map((cow) => (
                      <option key={cow.Id} value={cow.Id}>
                        {cow.CowName}
                      </option>
                    ))}
                  </select>
                  {errors.CowId && <span className="error">{errors.CowId}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="TabletName">गोळी नाव</label>
                  <input type="text" name="TabletName" value={formData.TabletName} onChange={handleChange} />
                  {errors.TabletName && <span className="error">{errors.TabletName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="DoctorName">डॉक्टर नाव</label>
                  <input type="text" name="DoctorName" value={formData.DoctorName} onChange={handleChange} />
                  {errors.DoctorName && <span className="error">{errors.DoctorName}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="MorningTablet">सकाळची गोळी</label>
                  <input type="number" name="MorningTablet" value={formData.MorningTablet} onChange={handleChange} min="0" />
                  {errors.MorningTablet && <span className="error">{errors.MorningTablet}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="EveningTablet">संध्याकाळची गोळी</label>
                  <input type="number" name="EveningTablet" value={formData.EveningTablet} onChange={handleChange} min="0" />
                  {errors.EveningTablet && <span className="error">{errors.EveningTablet}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="NoOfDays">दिवसांची संख्या</label>
                  <input type="number" name="NoOfDays" value={formData.NoOfDays} onChange={handleChange} min="1" />
                  {errors.NoOfDays && <span className="error">{errors.NoOfDays}</span>}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit">{isEditing ? 'Update' : 'Submit'}</button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="cancel-btn">
                    Cancel
                  </button>
                )}
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
                <Card.Title as="h4">गाय प्रिस्क्रिप्शन यादी</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control
                  type="text"
                  placeholder="Search by Cow, Tablet, Doctor Name or Date"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="me-2"
                />
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
                  className="table-bordered mb-0 text-center"
                  style={{
                    border: '1px solid #dee2e6',
                    borderCollapse: 'collapse'
                  }}
                >
                  <thead>
                    <tr>
                      <th>दिनांक</th>
                      <th>गाय नाव</th>
                      <th>गोळी नाव</th>
                      <th>सकाळची गोळी</th>
                      <th>संध्याकाळची गोळी</th>
                      <th>दिवसांची संख्या</th>
                      <th>डॉक्टर नाव</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredTableData) &&
                      filteredTableData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.Date ? new Date(item.Date).toLocaleDateString('en-GB') : ''}</td>
                          <td>{item.CowName}</td>
                          <td>{item.TabletName}</td>
                          <td>{item.MorningTablet}</td>
                          <td>{item.EveningTablet}</td>
                          <td>{item.NoOfDays} दिवस</td>
                          <td>{item.DoctorName}</td>
                          <td>
                            <Button className="me-2" variant="primary" onClick={() => handleEdit(item)}>
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
    </React.Fragment>
  );
};

export default CowPrescription;
