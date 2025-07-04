import React from 'react';
import { Row, Col, Alert, Button } from 'react-bootstrap';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const JWTLogin = () => {
  const navigate = useNavigate();

  const handleLogin = async (values, setSubmitting, setErrors) => {
    try {
      const response = await axios.post(
        'https://api.mytemplesoftware.in/api/auth/login',
        {
          Username: values.Username,
          Password: values.Password
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        }
      );
      // Check if user is admin (handle both boolean false and numeric 0)
      if (response.data.user.IsAdmin === false || response.data.user.IsAdmin === 0) {
        setErrors({ submit: 'You are not authorized to access this application.' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      } else {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response) {
        setErrors({ submit: error.response.data.message || 'Something went wrong' });
      } else if (error.request) {
        setErrors({ submit: 'No response from server. Please check your network.' });
      } else {
        setErrors({ submit: 'Request failed. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        // role: '', // This is for the select dropdown
        Username: '',
        Password: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        // role: Yup.string().required('Role is required'),
        Username: Yup.string().max(255).required('Username is required'),
        Password: Yup.string().max(255).required('Password is required')
      })}
      onSubmit={(values, { setSubmitting, setErrors }) => {
        handleLogin(values, setSubmitting, setErrors);
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          {/* <div className="form-group mb-3">
            <select className="form-control" name="role" onBlur={handleBlur} onChange={handleChange} value={values.role}>
              <option value="">Select Login</option>
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
            {touched.role && errors.role && <small className="text-danger form-text">{errors.role}</small>}
          </div> */}
          <div className="form-group mb-3">
            <label htmlFor="Username">Email Address / Username</label>
            <input
              className="form-control"
              name="Username"
              onBlur={handleBlur}
              onChange={handleChange}
              type="text"
              value={values.Username}
            />
            {touched.Username && errors.Username && <small className="text-danger form-text">{errors.Username}</small>}
          </div>
          <div className="form-group mb-4">
            <label htmlFor="Password">Password</label>
            <input
              className="form-control"
              name="Password"
              onBlur={handleBlur}
              onChange={handleChange}
              type="password"
              value={values.Password}
            />
            {touched.Password && errors.Password && <small className="text-danger form-text">{errors.Password}</small>}
          </div>

          {errors.submit && (
            <Col sm={12}>
              <Alert variant="danger">{errors.submit}</Alert>
            </Col>
          )}

          <Row>
            <Col mt={2}>
              <Button className="btn-block mb-4" color="primary" disabled={isSubmitting} size="large" type="submit" variant="primary">
                Sign In
              </Button>
            </Col>
          </Row>
        </form>
      )}
    </Formik>
  );
};

export default JWTLogin;
