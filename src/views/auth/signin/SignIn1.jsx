import React from 'react';
import { NavLink, Link } from 'react-router-dom';

// react-bootstrap
// third party

// project import
import Breadcrumb from '../../../layouts/AdminLayout/Breadcrumb';
import AuthLogin from './JWTLogin';

// assets
import logoDark from '../../../assets/images/auth/Khatgaon.jpeg';

// ==============================|| SIGN IN 1 ||============================== //

const Signin1 = () => {
  return (
    <React.Fragment>
      <Breadcrumb />
      <div className="auth-wrapper d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: '#7ec0fa' }}>
        <div
          className="login-container d-flex flex-row shadow-lg"
          style={{ maxWidth: 900, width: '100%', minHeight: 520, borderRadius: 18, overflow: 'hidden', background: '#fff' }}
        >
          {/* Left side - Image as background */}
          <div
            className="login-image d-none d-md-block"
            style={{
              flex: 1,
              backgroundImage: `url(${logoDark})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: 520
            }}
          ></div>
          {/* Right side - AuthLogin */}
          <div
            className="login-form d-flex align-items-center justify-content-center"
            style={{ flex: 1, minWidth: 200, minHeight: 520, padding: 40 }}
          >
            <div className="w-100 text-center" style={{ maxWidth: 300, margin: '0 auto' }}>
              <h3 className="mb-4 fw-bold" style={{ letterSpacing: 1 }}>
                Admin
              </h3>
              <AuthLogin />
              <h5>
                <b>Developed by Agastya Techasyst India PVT LTD</b>
              </h5>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Signin1;
