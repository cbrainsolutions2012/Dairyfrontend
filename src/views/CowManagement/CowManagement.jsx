import React, { useEffect, useRef, useState } from 'react';
import '../commonemp.scss';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const CowManagement = () => {
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    Date: '',
    CowId: '',
    MorningFood: '',
    EveningFood: '',
    MorningMilk: '',
    EveningMilk: ''
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
    if (!formData.MorningFood) newErrors.MorningFood = 'Morning Food is required';
    if (!formData.EveningFood) newErrors.EveningFood = 'Evening Food is required';
    if (!formData.MorningMilk) newErrors.MorningMilk = 'Morning Milk is required';
    if (!formData.EveningMilk) newErrors.EveningMilk = 'Evening Milk is required';
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
          MorningFood: parseFloat(formData.MorningFood),
          EveningFood: parseFloat(formData.EveningFood),
          MorningMilk: parseFloat(formData.MorningMilk),
          EveningMilk: parseFloat(formData.EveningMilk)
        };

        let res;
        if (isEditing && editingId) {
          // Update existing record
          res = await axios.put(`https://api.mytemplesoftware.in/api/cow-management/${editingId}`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 200) {
            alert('Cow Management record updated successfully');
            setIsEditing(false);
            setEditingId(null);
          }
        } else {
          // Add new record
          res = await axios.post(`https://api.mytemplesoftware.in/api/cow-management`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 201) {
            alert('Cow Management record added successfully');
          }
        }

        setApiError('');
        setFormData({
          Date: '',
          CowId: '',
          MorningFood: '',
          EveningFood: '',
          MorningMilk: '',
          EveningMilk: ''
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
      const res = await axios.get(`https://api.mytemplesoftware.in/api/cow-management`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('res from api', res.data.managementRecords);
      const data = res.data.managementRecords;

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
    writeFile(wb, 'Cow_Management_Data.xlsx');
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

      pdf.save('Cow_Management_Data.pdf');
    });
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are You want to Delete this Cow Management record?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/cow-management/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        alert('Cow Management record deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      setApiError('Cow Management record not deleted. Please try again.');
      alert('Failed to delete Cow Management record. Please try again.');
    }
  };

  // Filter table data based on search term
  const filteredTableData = tableData.filter((item) => {
    return item.CowName.toLowerCase().includes(searchTerm.toLowerCase()) || item.Date.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEdit = (record) => {
    // Format the date properly for date input
    const formattedDate = record.Date ? record.Date.split('T')[0] : '';

    setFormData({
      Date: formattedDate,
      CowId: record.CowId.toString(),
      MorningFood: record.MorningFood.toString(),
      EveningFood: record.EveningFood.toString(),
      MorningMilk: record.MorningMilk.toString(),
      EveningMilk: record.EveningMilk.toString()
    });
    setIsEditing(true);
    setEditingId(record.Id);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setFormData({
      Date: '',
      CowId: '',
      MorningFood: '',
      EveningFood: '',
      MorningMilk: '',
      EveningMilk: ''
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
              {isEditing ? 'गाय व्यवस्थापन संपादित करा' : 'गाय व्यवस्थापन नोंदणी'}
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
                  <label htmlFor="MorningFood">सकाळचे खाद्य (किलो)</label>
                  <input type="number" step="0.1" name="MorningFood" value={formData.MorningFood} onChange={handleChange} />
                  {errors.MorningFood && <span className="error">{errors.MorningFood}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="EveningFood">संध्याकाळचे खाद्य (किलो)</label>
                  <input type="number" step="0.1" name="EveningFood" value={formData.EveningFood} onChange={handleChange} />
                  {errors.EveningFood && <span className="error">{errors.EveningFood}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="MorningMilk">सकाळचे दूध (लिटर)</label>
                  <input type="number" step="0.1" name="MorningMilk" value={formData.MorningMilk} onChange={handleChange} />
                  {errors.MorningMilk && <span className="error">{errors.MorningMilk}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="EveningMilk">संध्याकाळचे दूध (लिटर)</label>
                  <input type="number" step="0.1" name="EveningMilk" value={formData.EveningMilk} onChange={handleChange} />
                  {errors.EveningMilk && <span className="error">{errors.EveningMilk}</span>}
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
                <Card.Title as="h4">गाय व्यवस्थापन यादी</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control
                  type="text"
                  placeholder="Search by Cow Name or Date"
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
                      <th>सकाळचे खाद्य</th>
                      <th>संध्याकाळचे खाद्य</th>
                      <th>सकाळचे दूध</th>
                      <th>संध्याकाळचे दूध</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredTableData) &&
                      filteredTableData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.Date ? new Date(item.Date).toLocaleDateString('en-GB') : ''}</td>
                          <td>{item.CowName}</td>
                          <td>{item.MorningFood} किलो</td>
                          <td>{item.EveningFood} किलो</td>
                          <td>{item.MorningMilk} लिटर</td>
                          <td>{item.EveningMilk} लिटर</td>
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

export default CowManagement;
