import React, { useState } from 'react';
import '../commonemp.scss';
import { Card, Col, Row } from 'react-bootstrap';

function Donation() {
  const [formData, setFormData] = useState({
    donationName: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.donationName) newErrors.donationName = 'Donation Type is required';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length === 0) {
      // Handle form submission
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
            <Card.Title as="h4" style={{ display: 'flex', justifyContent: 'center' }}>
              सेवेचे प्रकार
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="donationName">दान प्रकार</label>
                  <input type="text" name="donationName" value={formData.donationName} onChange={handleChange} />
                  {errors.donationName && <span className="error">{errors.donationName}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">Submit</button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
      {/*</Row> */}
    </React.Fragment>
  );
}

export default Donation;
