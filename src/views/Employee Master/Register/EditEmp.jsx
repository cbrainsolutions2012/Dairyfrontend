import React, { useEffect, useState } from 'react';
import '../commonemp.scss';
import { Card, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router';

function EditEmp() {
  const { id } = useParams();
  // console.log(tr_number);
  const token = localStorage.getItem('token') || '';
  // console.log(user_id);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    FullName: '',
    MobileNumber: '',
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
    const { name, value } = e.target;
    // Convert PAN card input to uppercase
    const finalValue = name === 'Pancard' ? value.toUpperCase() : value;
    setFormData({ ...formData, [name]: finalValue });
  };

  const fetchFormData = async (id) => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/employees/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const date = new Date(res.data.employee.Dob);
      const formattedDate = date.toISOString().split('T')[0]; // Format date to
      if (res.status === 200) {
        const data = res.data.employee;
        setFormData({
          FullName: data.FullName || '',
          MobileNumber: data.MobileNumber || '',
          Pancard: data.Pancard || '',
          Dob: formattedDate || '',
          EmailId: data.EmailId || '',
          City: data.City || '',
          Address: data.Address || '',
          WorkingArea: data.WorkingArea || '',
          Adharcard: data.Adharcard || ''
        });
      } else {
        console.error('Failed to fetch form data:', res.statusText);
        setApiError('Failed to fetch form data. Please try again.');
      }

      console.log('Fetched form data:', res.data.data);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  };

  //   const validate = () => {
  //     const newErrors = {};
  //     if (!formData.SevaName) newErrors.SevaName = 'Seva Name is required';
  //     return newErrors;
  //   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // const formErrors = validate();
    // if (Object.keys(formErrors).length === 0) {
    // Handle form submission

    try {
      // const res = await axios.post(`http://api.mytemplesoftware.in/api/admin/gotra_list/${tr_number}`, formData);
      const res = await axios.put(`https://api.mytemplesoftware.in/api/employees/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setApiError('');

      if (res.status === 200) {
        alert('Employee updated successfully');
        navigate('/empmaster');
      }
    } catch (error) {
      console.error('There is an error submitting form data');
      setApiError(error.message || 'Failed to submit data. Please try again');
    }
    console.log(formData);
    // } else {
    //   setErrors(formErrors);
    // }
  };

  useEffect(() => {
    fetchFormData(id);
  }, [id]);

  console.log('Fetched form data:', formData);

  return (
    <React.Fragment>
      {/* <Row> */}
      <Col sm={12}>
        <Card>
          <Card.Header>
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
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

      {/*</Row> */}
    </React.Fragment>
  );
}

export default EditEmp;
