import React, { useEffect, useState } from 'react';
import '../commonemp.scss';
import { Card, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router';

function editSeva() {
  const { id } = useParams();
  // console.log(tr_number);
  const token = localStorage.getItem('token') || '';
  // console.log(user_id);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    SevaName: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchFormData = async (id) => {
    try {
      const res = await axios.get(`https://api.mytemplesoftware.in/api/seva/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200) {
        const data = res.data.seva;
        setFormData({
          SevaName: data.SevaName || ''
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

  const validate = () => {
    const newErrors = {};
    if (!formData.SevaName) newErrors.SevaName = 'Seva Name is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      // Handle form submission

      try {
        // const res = await axios.post(`http://api.mytemplesoftware.in/api/admin/gotra_list/${tr_number}`, formData);
        const res = await axios.put(`https://api.mytemplesoftware.in/api/seva/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setApiError('');

        if (res.status === 200) {
          alert('Seva updated successfully');
          navigate('/pooja');
        }
      } catch (error) {
        console.error('There is an error submitting form data');
        setApiError(error.message || 'Failed to submit data. Please try again');
      }
      console.log(formData);
    } else {
      setErrors(formErrors);
    }
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
              सेवा नोंदणी
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="SevaName">सेवेचे नाव</label>
                  <input type="text" name="SevaName" value={formData.SevaName} onChange={handleChange} />
                  {errors.SevaName && <span className="error">{errors.SevaName}</span>}
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

export default editSeva;
