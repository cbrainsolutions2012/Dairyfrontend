import React, { useEffect, useState } from 'react';
import '../commonemp.scss';
import { Card, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router';

function EditTemple() {
  const { id } = useParams();
  // console.log(tr_number);
  const token = localStorage.getItem('token') || '';
  // console.log(user_id);

  const navigate = useNavigate();

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
  const [apiError, setApiError] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert PAN card input to uppercase
    const finalValue = name === 'Pancard' ? value.toUpperCase() : value;
    setFormData({ ...formData, [name]: finalValue });
  };

  const fetchFormData = async (id) => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/temples/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 200) {
        const data = res.data.temple;
        setFormData({
          TempleName: data.TempleName || '',
          MobileNo: data.MobileNo || '',
          City: data.City || '',
          RegNumber: data.RegNumber || '',
          Website: data.Website || '',
          OwnerName: data.OwnerName || '',
          EmailId: data.EmailId || '',
          Pancard: data.Pancard || '',
          GSTNumber: data.GSTNumber || '',
          Address: data.Address || ''
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
      const res = await axios.put(`https://api.mytemplesoftware.in/api/temples/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setApiError('');

      if (res.status === 200) {
        alert('Temple updated successfully');
        navigate('/templereg');
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
                <button type="button" onClick={() => setFormData({})}>
                  Cancel
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>

      {/*</Row> */}
    </React.Fragment>
  );
}

export default EditTemple;
