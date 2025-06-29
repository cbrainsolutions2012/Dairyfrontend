import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// react-bootstrap
import { Card, Row, Col } from 'react-bootstrap';

// project import
import Breadcrumb from '../../../layouts/AdminLayout/Breadcrumb';

// assets
import logoDark from '../../../assets/images/logo-dark.png';
import axios from 'axios';

// ==============================|| RESET PASSWORD 1 ||============================== //

const ResetPassword1 = () => {
  const [old_password, setOldPassword] = useState('');
  const [new_password, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new_password != confirmPassword) {
      setError('New password do not match');
      return;
    }

    try {
      const res = await axios.post('http://api.mytemplesoftware.in/api/admin/admin_change_password/', { old_password, new_password });

      if (res.status === 201) {
        setSuccess('Password Changed Successfully.');
        setError('');

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to Changed Password. Try Again.');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while changing password');
    }
  };

  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper">
        <div className="auth-content text-center">
          <Card className="borderless">
            <Row className="align-items-center text-center">
              <Col>
                <Card.Body className="card-body">
                  {/* <img src={logoDark} alt="" className="img-fluid mb-4" /> */}
                  <h4 className="mb-3 f-w-400">Change your password</h4>
                  {error && <div className="alert alert-danger">{error}</div>}
                  {success && <div className="alert alert-success">{success}</div>}

                  <form onSubmit={handleSubmit}>
                    <div className="input-group mb-4">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Old password"
                        value={old_password}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group mb-4">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="New password"
                        value={new_password}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group mb-4">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Confirm New password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-block btn-primary mb-4">
                      Change password
                    </button>
                  </form>

                  {/* <p className="mb-0 text-muted">
                    Don’t have an account?{' '}
                    <NavLink to="/auth/signup-1" className="f-w-400">
                      Signup
                    </NavLink>
                  </p> */}
                </Card.Body>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ResetPassword1;
