import React, { useState } from 'react';
import '../commonemp.scss';

import { Button, Card, Col, Row } from 'react-bootstrap';

function Donar() {
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    contactNo: '',
    emailId: '',
    panCard: '',
    adhaar: '',
    amount: '',
    gotratype: '',
    poojatype: '',
    paymenttype: '',
    donationtype: '',
    dob: '',
    date: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full Name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.contactNo) newErrors.contactNo = 'Contact No. is required';
    if (!formData.emailId) newErrors.emailId = 'Email ID is required';
    if (!formData.panCard) newErrors.panCard = 'PAN Card is required';
    if (!formData.adhaar) newErrors.adhhar = 'Adhaar No. is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    if (!formData.donationtype) newErrors.donationtype = 'Donation type is required';
    if (!formData.paymenttype) newErrors.paymenttype = 'Payment type is required';
    if (!formData.date) newErrors.date = 'Date is required';
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
            <Card.Title as="h5" style={{ display: 'flex', justifyContent: 'center' }}>
              दाता माहिती
            </Card.Title>
          </Card.Header>
          <Card.Body className="p-0">
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fullName">पुर्ण नाव</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
                  <Button>Search</Button>
                  {errors.fullName && <span className="error">{errors.fullName}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="contactNo">दूरध्वनी क्रमांक</label>
                  <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} />
                  <Button>Search</Button>
                  {errors.contactNo && <span className="error">{errors.contactNo}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymenttype">पेमेंट पद्धत</label>
                  <input type="text" name="paymenttype" value={formData.paymenttype} onChange={handleChange} />
                  {errors.paymenttype && <span className="error">{errors.paymenttype}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="emailId">ई-मेल</label>
                  <input type="email" name="emailId" value={formData.emailId} onChange={handleChange} />
                  {errors.emailId && <span className="error">{errors.emailId}</span>}
                </div>
              </div>
              <div className="form-row"></div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="panCard">पॅन कार्ड क्रमांक</label>
                  <input type="text" name="panCard" value={formData.panCard} onChange={handleChange} />
                  {errors.panCard && <span className="error">{errors.panCard}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="donationtype">दान प्रकार</label>
                  <input type="text" name="donationType" value={formData.donationType} onChange={handleChange} />
                  {errors.donationtype && <span className="error">{errors.donationtype}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">दिनांक</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} />
                  {errors.date && <span className="error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="amount">रक्कम</label>
                  <input type="text" name="amount" value={formData.amount} onChange={handleChange} />
                  {errors.amount && <span className="error">{errors.amount}</span>}
                </div>
              </div>
              <div className="form-row"></div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="address">पत्ता</label>
                  <textarea rows={3} type="text" name="address" value={formData.address} onChange={handleChange} />
                  {errors.address && <span className="error">{errors.address}</span>}
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

export default Donar;
