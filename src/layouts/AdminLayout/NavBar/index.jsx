import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// project import
import NavLeft from './NavLeft';
import NavRight from './NavRight';

import { ConfigContext } from '../../../contexts/ConfigContext';
import * as actionType from '../../../store/actions';

// ==============================|| NAV BAR ||============================== //

const NavBar = () => {
  const [moreToggle, setMoreToggle] = useState(false);
  const configContext = useContext(ConfigContext);
  const { collapseMenu, layout } = configContext.state;
  const { dispatch } = configContext;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  let headerClass = ['navbar', 'pcoded-header', 'navbar-expand-lg', 'header-blue', 'headerpos-fixed'];
  if (layout === 'vertical') {
    headerClass = [...headerClass, 'headerpos-fixed'];
  }

  let toggleClass = ['mobile-menu'];
  if (collapseMenu) {
    toggleClass = [...toggleClass, 'on'];
  }

  const navToggleHandler = () => {
    dispatch({ type: actionType.COLLAPSE_MENU });
  };

  let moreClass = ['mob-toggler'];
  let collapseClass = ['collapse navbar-collapse'];
  if (moreToggle) {
    moreClass = [...moreClass, 'on'];
    collapseClass = [...collapseClass, 'd-block'];
  }

  return (
    <header className={headerClass.join(' ')} style={{ zIndex: 1009 }}>
      <div className="m-header d-flex align-items-center">
        <Link to="#" className={toggleClass.join(' ')} id="mobile-collapse" onClick={navToggleHandler} style={{ zIndex: 1010 }}>
          <span />
        </Link>
        {/* <Link to="/dashboard" className="b-brand d-flex align-items-center">
          <h5 className="d-none d-lg-block mb-0" style={{ color: 'white' }}>
            Admin
          </h5>
        </Link> */}
        <Link
          to="#"
          className={moreClass.join(' ')}
          onClick={() => setMoreToggle(!moreToggle)}
          style={{
            zIndex: 1010,
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px'
          }}
        >
          <i className="feather icon-more-vertical" />
        </Link>
      </div>
      <div className="d-flex justify-content-center align-items-center w-100 position-absolute">
        <h5 className="mb-0" style={{ color: 'white' }}>
          कामधेनू दुध संकलन केंद्र
        </h5>
      </div>
      <div className={collapseClass.join(' ')} style={{ justifyContent: 'end', zIndex: 1008 }}>
        {/* Desktop Navigation */}
        <div className="d-none d-lg-flex">
          <NavLeft />
          <NavRight />
        </div>

        {/* Mobile Clean Menu */}
        <div className="d-lg-none w-100">
          <div className="mobile-menu-clean" style={{ padding: '10px 0' }}>
            <Link
              to="/reset-password"
              className="d-flex align-items-center text-dark text-decoration-none p-3 border-bottom"
              style={{
                backgroundColor: 'white',
                borderBottom: '1px solid #e9ecef'
              }}
              onClick={() => setMoreToggle(false)}
            >
              <i className="feather icon-settings me-3" style={{ fontSize: '18px' }} />
              <span>Change Password</span>
            </Link>
            <Link
              to="#"
              className="d-flex align-items-center text-dark text-decoration-none p-3"
              style={{
                backgroundColor: 'white'
              }}
              onClick={(e) => {
                e.preventDefault();
                setMoreToggle(false);
                handleLogout();
              }}
            >
              <i className="feather icon-log-out me-3" style={{ fontSize: '18px' }} />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
