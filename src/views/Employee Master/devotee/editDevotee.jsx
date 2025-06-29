import React, { useState, useEffect } from 'react';
import { Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import '../commonemp.scss';
import { useParams, useNavigate } from 'react-router-dom';

function EditDevotee() {
  const [gotraList, setGotraList] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to get gotra name by ID
  const getGotraNameById = (gotraId) => {
    const gotra = gotraList.find((g) => g.Id === gotraId);
    return gotra ? gotra.GotraName : 'Unknown';
  };

  const fetchFormData = async (id) => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/dengidar/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Fetched form data:', res.data.data);

      const data = res.data.data;
      // Format dates for input fields (YYYY-MM-DD format)
      const formattedData = {
        ...data,
        DOB: data.DOB ? new Date(data.DOB).toISOString().split('T')[0] : '',
        RegisterDate: data.RegisterDate ? new Date(data.RegisterDate).toISOString().split('T')[0] : ''
      };

      setFormData(formattedData);
    } catch (error) {
      console.error('Error fetching form data:', error);
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
    getGotraList();
    fetchFormData(id);
  }, [id]);

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
        // Send the data as-is without converting to ISO string
        // The API expects YYYY-MM-DD format for dates
        const updatedData = {
          ...formData
        };

        const response = await axios.put(`https://api.mytemplesoftware.in/api/dengidar/${id}`, updatedData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Form submitted successfully:', response.data);

        // Clear any previous errors
        setErrors({});

        // Show success message
        alert('Devotee updated successfully!');

        navigate('/devotee'); // Redirect to the devotee list page
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to update devotee. Please try again.');
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

      {/*</Row> */}
    </React.Fragment>
  );
}

export default EditDevotee;
