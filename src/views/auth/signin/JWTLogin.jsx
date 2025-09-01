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
      const apiUrl = import.meta.env.VITE_API_URL || 'https://dairyapi.demotest.in.net';

      // Try with Content-Type header
      const response = await axios.post(
        `${apiUrl}/api/auth/login`,
        {
          username: values.username,
          password: values.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Login response:', response.data);

      // Check if login was successful - handle different response structures
      if (response.data.success || response.data.token || response.status === 200) {
        // Store token if provided
        const token = response.data.token || response.data.accessToken || response.data.data?.token;
        if (token) {
          localStorage.setItem('token', token);
        }

        // Store user data if provided
        if (response.data.user || response.data.data?.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user || response.data.data.user));
        }

        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        setErrors({ submit: response.data.message || 'Login failed' });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        // Server responded with error status
        console.log('Error response:', error.response.data);
        const message =
          error.response.data?.message || error.response.data?.error || `Error ${error.response.status}: ${error.response.statusText}`;
        setErrors({ submit: message });
      } else if (error.request) {
        // Request was made but no response received
        setErrors({ submit: 'No response from server. Please check your network connection.' });
      } else {
        // Something else happened
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
        username: '',
        password: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        // role: Yup.string().required('Role is required'),
        username: Yup.string().max(255).required('Username is required'),
        password: Yup.string().max(255).required('Password is required')
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
            <label htmlFor="username">Email Address / Username</label>
            <input
              className="form-control"
              name="username"
              onBlur={handleBlur}
              onChange={handleChange}
              type="text"
              value={values.username}
            />
            {touched.username && errors.username && <small className="text-danger form-text">{errors.username}</small>}
          </div>
          <div className="form-group mb-4">
            <label htmlFor="password">Password</label>
            <input
              className="form-control"
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              type="password"
              value={values.password}
            />
            {touched.password && errors.password && <small className="text-danger form-text">{errors.password}</small>}
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
