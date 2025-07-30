import React, { useEffect, useRef, useState } from 'react';
import '../commonemp.scss';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaEdit, FaTrashAlt } from 'react-icons/fa'; // Import icons for edit and delete buttons

const Cow = () => {
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    CowName: ''
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.CowName) newErrors.CowName = 'Cow Name is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        let res;
        if (isEditing && editingId) {
          // Update existing cow
          res = await axios.put(`https://api.mytemplesoftware.in/api/cows/${editingId}`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 200) {
            alert('Cow updated successfully');
            setIsEditing(false);
            setEditingId(null);
          }
        } else {
          // Add new cow
          res = await axios.post(`https://api.mytemplesoftware.in/api/cows`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 201) {
            alert('Cow added successfully');
          }
        }

        setApiError('');
        setFormData({
          CowName: ''
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

  const fetchTableData = async () => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/cows`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('res from api', res.data.cows);
      const data = res.data.cows;

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
    writeFile(wb, 'Cow_Data.xlsx');
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

      pdf.save('Cow_Data.pdf');
    });
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are You want to Delete this Cow?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/cows/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        alert('Cow deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      setApiError('Cow not deleted. Please try again.');
      alert('Failed to delete Cow. Please try again.');
    }
  };

  // Filter table data based on search term
  const filteredTableData = tableData.filter((item) => item.CowName.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleEdit = (cow) => {
    setFormData({
      CowName: cow.CowName
    });
    setIsEditing(true);
    setEditingId(cow.Id);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setFormData({
      CowName: ''
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
              {isEditing ? 'गाय संपादित करा' : 'गाय नोंदणी'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="CowName">गाय नाव</label>
                  <input type="text" name="CowName" value={formData.CowName} onChange={handleChange} />
                  {errors.CowName && <span className="error">{errors.CowName}</span>}
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
                <Card.Title as="h4">गाय यादी</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" placeholder="Search" value={searchTerm} onChange={handleSearchChange} className="me-2" />
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
                      <th>गाय नाव</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredTableData) &&
                      filteredTableData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.CowName}</td>
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

export default Cow;
