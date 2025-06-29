import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';

// project import
import NavLeft from './NavLeft';
import NavRight from './NavRight';

import { ConfigContext } from '../../../contexts/ConfigContext';
import * as actionType from '../../../store/actions';

// assets
import logo from '../../../assets/images/auth/image.png';

// ==============================|| NAV BAR ||============================== //

const NavBar = () => {
  const [moreToggle, setMoreToggle] = useState(false);
  const configContext = useContext(ConfigContext);
  const { collapseMenu, layout } = configContext.state;
  const { dispatch } = configContext;

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
        <Link to="#" className={toggleClass.join(' ')} id="mobile-collapse" onClick={navToggleHandler}>
          <span />
        </Link>
        <Link to="/dashboard" className="b-brand d-flex align-items-center">
          <h5 className="d-none d-lg-block mb-0" style={{ color: 'white' }}>
            Admin
          </h5>
        </Link>
        <Link to="#" className={moreClass.join(' ')} onClick={() => setMoreToggle(!moreToggle)}>
          <i className="feather icon-more-vertical" />
        </Link>
      </div>
      <div className="d-flex justify-content-center align-items-center w-100 position-absolute">
        <h6 className="mb-0" style={{ color: 'white' }}>
          दान Temple Management Software
        </h6>
      </div>
      <div className={collapseClass.join(' ')} style={{ justifyContent: 'end' }}>
        <NavLeft />
        <NavRight />
      </div>
    </header>
  );
};

export default NavBar;
