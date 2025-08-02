import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../commonemp.scss';

function EditAttendance() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState({
    Date: '',
    EmployeeId: '',
    EmployeeName: '',
    StartingHour: '',
    EndingHour: '',
    Status: 'Present',
    Notes: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceRecord();
    fetchEmployees();
  }, [id]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('https://api.mytemplesoftware.in/api/employees', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.data.employees) {
        setEmployees(res.data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendanceRecord = async () => {
    try {
      const response = await axios.get(`https://api.mytemplesoftware.in/api/attendance/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.attendance) {
        const attendance = response.data.attendance;
        setFormData({
          Date: attendance.Date.split('T')[0],
          EmployeeId: attendance.EmployeeId,
          EmployeeName: attendance.EmployeeName,
          StartingHour: attendance.StartingHour,
          EndingHour: attendance.EndingHour || '',
          Status: attendance.Status,
          Notes: attendance.Notes || ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance record:', error);
      alert('Error fetching attendance record');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-fill employee name when employee is selected
    if (name === 'EmployeeId') {
      const selectedEmployee = employees.find((emp) => emp.Id.toString() === value);
      if (selectedEmployee) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          EmployeeName: selectedEmployee.FullName
        }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.Date) newErrors.Date = 'Date is required';
    if (!formData.EmployeeId) newErrors.EmployeeId = 'Employee is required';
    if (!formData.StartingHour) newErrors.StartingHour = 'Starting Hour is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      try {
        const response = await axios.put(`https://api.mytemplesoftware.in/api/attendance/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          alert('Attendance record updated successfully');
          navigate('/attendance');
        }
      } catch (error) {
        console.error('Error updating attendance record:', error);
        alert(error.response?.data?.message || 'Error updating attendance record');
      }
    } else {
      setErrors(formErrors);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    // Handle different time formats
    if (timeString.includes('T')) {
      return timeString.split('T')[1].substring(0, 5);
    }
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Row>
        <Col sm={12}>
          <Card>
            <Card.Header>
              <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
                उपस्थिती संपादित करा
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit} className="register-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="Date">तारीख *</label>
                    <input type="date" name="Date" value={formData.Date} onChange={handleChange} required />
                    {errors.Date && <span className="error">{errors.Date}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="EmployeeId">कर्मचारी *</label>
                    <select name="EmployeeId" value={formData.EmployeeId} onChange={handleChange} required>
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.Id} value={employee.Id}>
                          {employee.FullName}
                        </option>
                      ))}
                    </select>
                    {errors.EmployeeId && <span className="error">{errors.EmployeeId}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="StartingHour">प्रारंभ वेळ *</label>
                    <input type="time" name="StartingHour" value={formatTime(formData.StartingHour)} onChange={handleChange} required />
                    {errors.StartingHour && <span className="error">{errors.StartingHour}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="EndingHour">समाप्ती वेळ</label>
                    <input type="time" name="EndingHour" value={formatTime(formData.EndingHour)} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="Status">स्थिती</label>
                    <select name="Status" value={formData.Status} onChange={handleChange}>
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                      <option value="Half Day">Half Day</option>
                      <option value="Late">Late</option>
                      <option value="Early Leave">Early Leave</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="Notes">टिप्पणी</label>
                    <textarea
                      rows={3}
                      name="Notes"
                      value={formData.Notes}
                      onChange={handleChange}
                      placeholder="Enter any notes or remarks"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => navigate('/attendance')} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Attendance
                  </button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
}

export default EditAttendance;
