import React, { useEffect, useRef, useState } from 'react';
import '../commonemp.scss';
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { writeFile, utils } from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

const MilkDistribution = () => {
  const token = localStorage.getItem('token');

  const [formData, setFormData] = useState({
    date: '',
    totalMorningMilk: '',
    totalEveningMilk: '',
    morningKitchenMilk: '',
    morningKutiMilk: '',
    morningDairyMilk: '',
    morningDairyRate: '',
    eveningKitchenMilk: '',
    eveningKutiMilk: '',
    eveningDairyMilk: '',
    eveningDairyRate: ''
  });

  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [totalMilkData, setTotalMilkData] = useState({
    totalMorningMilk: 0,
    totalEveningMilk: 0,
    totalMilk: 0,
    existingDistribution: null
  });
  const [fetchError, setFetchError] = useState('');

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
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.totalMorningMilk) newErrors.totalMorningMilk = 'Total morning milk is required';
    if (!formData.totalEveningMilk) newErrors.totalEveningMilk = 'Total evening milk is required';

    // Check if at least one distribution field has value
    const distributionFields = [
      'morningKitchenMilk',
      'morningKutiMilk',
      'morningDairyMilk',
      'eveningKitchenMilk',
      'eveningKutiMilk',
      'eveningDairyMilk'
    ];

    const hasDistribution = distributionFields.some((field) => formData[field] && parseFloat(formData[field]) > 0);

    if (!hasDistribution) {
      newErrors.distribution = 'At least one distribution field is required';
    }

    // Validate morning distribution doesn't exceed total morning milk
    const totalMorningDistribution =
      parseFloat(formData.morningKitchenMilk || 0) + parseFloat(formData.morningKutiMilk || 0) + parseFloat(formData.morningDairyMilk || 0);

    if (totalMorningDistribution > parseFloat(formData.totalMorningMilk || 0)) {
      newErrors.morningDistribution = `Morning distribution (${totalMorningDistribution}L) exceeds available morning milk (${formData.totalMorningMilk}L)`;
    }

    // Validate evening distribution doesn't exceed total evening milk
    const totalEveningDistribution =
      parseFloat(formData.eveningKitchenMilk || 0) + parseFloat(formData.eveningKutiMilk || 0) + parseFloat(formData.eveningDairyMilk || 0);

    if (totalEveningDistribution > parseFloat(formData.totalEveningMilk || 0)) {
      newErrors.eveningDistribution = `Evening distribution (${totalEveningDistribution}L) exceeds available evening milk (${formData.totalEveningMilk}L)`;
    }

    // If dairy milk is provided, rate should be provided too
    if (formData.morningDairyMilk && !formData.morningDairyRate) {
      newErrors.morningDairyRate = 'Morning dairy rate is required when dairy milk is specified';
    }
    if (formData.eveningDairyMilk && !formData.eveningDairyRate) {
      newErrors.eveningDairyRate = 'Evening dairy rate is required when dairy milk is specified';
    }

    // Validate distribution doesn't exceed available milk if we have the data
    if (totalMilkData.totalMorningMilk > 0) {
      const morningDistribution =
        parseFloat(formData.morningKitchenMilk || 0) +
        parseFloat(formData.morningKutiMilk || 0) +
        parseFloat(formData.morningDairyMilk || 0);

      if (morningDistribution > totalMilkData.totalMorningMilk) {
        newErrors.morningDistribution = `Morning distribution (${morningDistribution}L) exceeds available milk (${totalMilkData.totalMorningMilk}L)`;
      }
    }

    if (totalMilkData.totalEveningMilk > 0) {
      const eveningDistribution =
        parseFloat(formData.eveningKitchenMilk || 0) +
        parseFloat(formData.eveningKutiMilk || 0) +
        parseFloat(formData.eveningDairyMilk || 0);

      if (eveningDistribution > totalMilkData.totalEveningMilk) {
        newErrors.eveningDistribution = `Evening distribution (${eveningDistribution}L) exceeds available milk (${totalMilkData.totalEveningMilk}L)`;
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const submitData = {
          date: formData.date,
          morningKitchenMilk: parseFloat(formData.morningKitchenMilk) || 0,
          morningKutiMilk: parseFloat(formData.morningKutiMilk) || 0,
          morningDairyMilk: parseFloat(formData.morningDairyMilk) || 0,
          morningDairyRate: parseFloat(formData.morningDairyRate) || 0,
          eveningKitchenMilk: parseFloat(formData.eveningKitchenMilk) || 0,
          eveningKutiMilk: parseFloat(formData.eveningKutiMilk) || 0,
          eveningDairyMilk: parseFloat(formData.eveningDairyMilk) || 0,
          eveningDairyRate: parseFloat(formData.eveningDairyRate) || 0
        };

        let res;
        if (isEditing && editingId) {
          // Update existing record
          res = await axios.put(`https://api.mytemplesoftware.in/api/milk-distribution/${editingId}`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 200) {
            alert('Milk Distribution record updated successfully');
            setIsEditing(false);
            setEditingId(null);
          }
        } else {
          // Add new record
          res = await axios.post(`https://api.mytemplesoftware.in/api/milk-distribution/distribute`, submitData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (res.status === 200) {
            alert('Milk Distribution record added successfully');
          }
        }

        setApiError('');
        setFormData({
          date: '',
          totalMorningMilk: '',
          totalEveningMilk: '',
          morningKitchenMilk: '',
          morningKutiMilk: '',
          morningDairyMilk: '',
          morningDairyRate: '',
          eveningKitchenMilk: '',
          eveningKutiMilk: '',
          eveningDairyMilk: '',
          eveningDairyRate: ''
        });
        setFetchError('');
        fetchTableData();
      } catch (error) {
        console.error('There is an error submitting form data');
        setApiError(error.response?.data?.message || 'Failed to submit data. Please try again');
      }
    } else {
      setErrors(formErrors);
    }
  };

  const fetchTotalMilkByDate = async () => {
    if (!formData.date) {
      setFetchError('Please select a date first');
      return;
    }

    try {
      setFetchError('');
      const res = await axios.get(`https://api.mytemplesoftware.in/api/milk-distribution/total-milk/${formData.date}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.data.success) {
        const data = res.data.data;
        // Update form data with fetched values
        setFormData((prev) => ({
          ...prev,
          totalMorningMilk: data.totalMorningMilk.toString(),
          totalEveningMilk: data.totalEveningMilk.toString()
        }));

        setTotalMilkData(data);

        // If existing distribution found, populate the form
        if (data.existingDistribution) {
          const existing = data.existingDistribution;
          setFormData((prev) => ({
            ...prev,
            morningKitchenMilk: existing.MorningKitchenMilk?.toString() || '',
            morningKutiMilk: existing.MorningKutiMilk?.toString() || '',
            morningDairyMilk: existing.MorningDairyMilk?.toString() || '',
            morningDairyRate: existing.MorningDairyRate?.toString() || '',
            eveningKitchenMilk: existing.EveningKitchenMilk?.toString() || '',
            eveningKutiMilk: existing.EveningKutiMilk?.toString() || '',
            eveningDairyMilk: existing.EveningDairyMilk?.toString() || '',
            eveningDairyRate: existing.EveningDairyRate?.toString() || ''
          }));
          setIsEditing(true);
          setEditingId(existing.Id);
        }

        if (data.totalMorningMilk === 0 && data.totalEveningMilk === 0) {
          setFetchError('No milk data available for this date. Please check cow management records.');
        }
      }
    } catch (error) {
      console.log('Error fetching total milk:', error);
      setFetchError('Error fetching milk data. Please try again.');
      setFormData((prev) => ({
        ...prev,
        totalMorningMilk: '',
        totalEveningMilk: ''
      }));
      setTotalMilkData({
        totalMorningMilk: 0,
        totalEveningMilk: 0,
        totalMilk: 0,
        existingDistribution: null
      });
    }
  };

  const fetchTableData = async () => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/milk-distribution`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      const data = res.data.data?.distributions || [];
      setTableData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log(error);
      setTableData([]);
    }
  };

  useEffect(() => {
    fetchTableData();
  }, []);

  const handleExportToExcel = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove();
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
    });

    const wb = utils.table_to_book(clonedTable);
    writeFile(wb, 'Milk_Distribution_Data.xlsx');
  };

  const handleExportToPDF = () => {
    const table = tableRef.current;
    if (!table) return;

    const clonedTable = table.cloneNode(true);
    const headers = clonedTable.querySelectorAll('th');
    const rows = clonedTable.querySelectorAll('tr');
    const actionIndex = headers.length - 1;

    headers[actionIndex].remove();
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells[actionIndex]) {
        cells[actionIndex].remove();
      }
    });

    clonedTable.style.position = 'absolute';
    clonedTable.style.top = '-9999px';
    document.body.appendChild(clonedTable);

    html2canvas(clonedTable).then((canvas) => {
      document.body.removeChild(clonedTable);

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

      pdf.save('Milk_Distribution_Data.pdf');
    });
  };

  const confirmDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this Milk Distribution record?')) {
      handleDelete(id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`https://api.mytemplesoftware.in/api/milk-distribution/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        alert('Milk Distribution record deleted successfully');
        setTableData((prevData) => prevData.filter((item) => item.Id !== id));
      }
    } catch (error) {
      setApiError('Milk Distribution record not deleted. Please try again.');
      alert('Failed to delete Milk Distribution record. Please try again.');
    }
  };

  const filteredTableData = tableData.filter((item) => {
    return item.Date?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEdit = (record) => {
    const formattedDate = record.Date ? record.Date.split('T')[0] : '';

    // Auto-populate all form fields from the record
    setFormData({
      date: formattedDate,
      totalMorningMilk: record.TotalMorningMilk?.toString() || '',
      totalEveningMilk: record.TotalEveningMilk?.toString() || '',
      morningKitchenMilk: record.MorningKitchenMilk?.toString() || '',
      morningKutiMilk: record.MorningKutiMilk?.toString() || '',
      morningDairyMilk: record.MorningDairyMilk?.toString() || '',
      morningDairyRate: record.MorningDairyRate?.toString() || '',
      eveningKitchenMilk: record.EveningKitchenMilk?.toString() || '',
      eveningKutiMilk: record.EveningKutiMilk?.toString() || '',
      eveningDairyMilk: record.EveningDairyMilk?.toString() || '',
      eveningDairyRate: record.EveningDairyRate?.toString() || ''
    });
    setIsEditing(true);
    setEditingId(record.Id);
    setErrors({});
    setFetchError('');
  };

  const handleCancelEdit = () => {
    setFormData({
      date: '',
      totalMorningMilk: '',
      totalEveningMilk: '',
      morningKitchenMilk: '',
      morningKutiMilk: '',
      morningDairyMilk: '',
      morningDairyRate: '',
      eveningKitchenMilk: '',
      eveningKutiMilk: '',
      eveningDairyMilk: '',
      eveningDairyRate: ''
    });
    setIsEditing(false);
    setEditingId(null);
    setErrors({});
    setFetchError('');
  };

  return (
    <React.Fragment>
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              {isEditing ? 'दूध वितरण संपादित करा' : 'दूध वितरण नोंदणी'}
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">दिनांक</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} />
                  {errors.date && <span className="error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label>&nbsp;</label>
                  <button type="button" onClick={fetchTotalMilkByDate} className="fetch-btn">
                    Fetch Milk Data
                  </button>
                </div>
              </div>

              {fetchError && (
                <div className="error" style={{ textAlign: 'center', margin: '10px 0', color: '#dc3545' }}>
                  {fetchError}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="totalMorningMilk">एकूण सकाळचे दूध (लिटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="totalMorningMilk"
                    value={formData.totalMorningMilk}
                    onChange={handleChange}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="totalEveningMilk">एकूण संध्याकाळचे दूध (लिटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="totalEveningMilk"
                    value={formData.totalEveningMilk}
                    onChange={handleChange}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </div>
              </div>

              <h6 style={{ textAlign: 'center', margin: '20px 0', color: '#495057' }}>सकाळचे दूध वितरण</h6>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="morningKitchenMilk">स्वयंपाकघर दूध (लिटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="morningKitchenMilk"
                    value={formData.morningKitchenMilk}
                    onChange={handleChange}
                    max={totalMilkData.totalMorningMilk || undefined}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="morningKutiMilk">कुटी दूध (लिटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="morningKutiMilk"
                    value={formData.morningKutiMilk}
                    onChange={handleChange}
                    max={totalMilkData.totalMorningMilk || undefined}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="morningDairyMilk">डेअरी दूध (लिटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="morningDairyMilk"
                    value={formData.morningDairyMilk}
                    onChange={handleChange}
                    max={totalMilkData.totalMorningMilk || undefined}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="morningDairyRate">सकाळ डेअरी दर (रुपये प्रति लिटर)</label>
                  <input type="number" step="0.01" name="morningDairyRate" value={formData.morningDairyRate} onChange={handleChange} />
                  {errors.morningDairyRate && <span className="error">{errors.morningDairyRate}</span>}
                </div>
              </div>

              <h6 style={{ textAlign: 'center', margin: '20px 0', color: '#495057' }}>संध्याकाळचे दूध वितरण</h6>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="eveningKitchenMilk">स्वयंपाकघर दूध (लिटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="eveningKitchenMilk"
                    value={formData.eveningKitchenMilk}
                    onChange={handleChange}
                    max={totalMilkData.totalEveningMilk || undefined}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="eveningKutiMilk">कुटी दूध (लिटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="eveningKutiMilk"
                    value={formData.eveningKutiMilk}
                    onChange={handleChange}
                    max={totalMilkData.totalEveningMilk || undefined}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="eveningDairyMilk">डेअरी दूध (लिटर)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="eveningDairyMilk"
                    value={formData.eveningDairyMilk}
                    onChange={handleChange}
                    max={totalMilkData.totalEveningMilk || undefined}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="eveningDairyRate">संध्याकाळ डेअरी दर (रुपये प्रति लिटर)</label>
                  <input type="number" step="0.01" name="eveningDairyRate" value={formData.eveningDairyRate} onChange={handleChange} />
                  {errors.eveningDairyRate && <span className="error">{errors.eveningDairyRate}</span>}
                </div>
              </div>

              {errors.distribution && (
                <div className="error" style={{ textAlign: 'center', margin: '10px 0' }}>
                  {errors.distribution}
                </div>
              )}

              {errors.morningDistribution && (
                <div className="error" style={{ textAlign: 'center', margin: '10px 0' }}>
                  {errors.morningDistribution}
                </div>
              )}

              {errors.eveningDistribution && (
                <div className="error" style={{ textAlign: 'center', margin: '10px 0' }}>
                  {errors.eveningDistribution}
                </div>
              )}

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
                <Card.Title as="h4">दूध वितरण यादी</Card.Title>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                <Form.Control type="text" placeholder="Search by Date" value={searchTerm} onChange={handleSearchChange} className="me-2" />
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
                      <th>सकाळ स्वयंपाकघर</th>
                      <th>सकाळ कुटी</th>
                      <th>सकाळ डेअरी</th>
                      <th>सकाळ डेअरी दर</th>
                      <th>सकाळ डेअरी रक्कम</th>
                      <th>संध्याकाळ स्वयंपाकघर</th>
                      <th>संध्याकाळ कुटी</th>
                      <th>संध्याकाळ डेअरी</th>
                      <th>संध्याकाळ डेअरी दर</th>
                      <th>संध्याकाळ डेअरी रक्कम</th>
                      <th>एकूण डेअरी रक्कम</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredTableData) &&
                      filteredTableData.map((item) => (
                        <tr key={item.Id}>
                          <td>{item.Date ? new Date(item.Date).toLocaleDateString('en-GB') : ''}</td>
                          <td>{item.MorningKitchenMilk} L</td>
                          <td>{item.MorningKutiMilk} L</td>
                          <td>{item.MorningDairyMilk} L</td>
                          <td>₹{item.MorningDairyRate}</td>
                          <td>₹{item.MorningDairyAmount}</td>
                          <td>{item.EveningKitchenMilk} L</td>
                          <td>{item.EveningKutiMilk} L</td>
                          <td>{item.EveningDairyMilk} L</td>
                          <td>₹{item.EveningDairyRate}</td>
                          <td>₹{item.EveningDairyAmount}</td>
                          <td>₹{(parseFloat(item.MorningDairyAmount || 0) + parseFloat(item.EveningDairyAmount || 0)).toFixed(2)}</td>
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

export default MilkDistribution;
