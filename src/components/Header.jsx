import React from "react";
import { Link } from "react-router-dom";
import useTradingStore from "../store/useTradingStore";

const Header = () => {
  // Zustand store에서 tradingParams 가져오기
  const tradingParams = useTradingStore((state) => state.tradingParams);

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <img
            className="logo-image"
            src="https://api.builder.io/api/v1/image/assets/TEMP/358c8a24857f988331c14db54789fc990f06d8c7?width=100"
            alt="America Stock Hunters Logo"
          />
          <div className="logo-text-container">
            <Link to="/" className="company-name" style={{ textDecoration: 'none', color: '#fff' }}>
              AMERICAN STOCK HUNTERS
            </Link>
          </div>
        </div>
        <div className="navigation-section">
          <nav className="navigation-menu">
            <Link className="nav-item" to="/dashboard">Dashboard</Link>
            <Link className="nav-item" to="/TradingHistory">Trading History</Link>
            <Link className="nav-item" to="/Overview">Overview</Link>
            <Link className="nav-item" to="/Portfolio">Portfolio</Link>
            <Link className="nav-item" to="/Intro">Introduction</Link>
          </nav>
          <div className="user-section">
            {tradingParams.name && (
              <span className="user-name" style={{ 
                color: '#fff', 
                marginRight: '12px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {tradingParams.name}
              </span>
            )}
            <img
              className="user-avatar"
              src="pm-logo.png"
              alt="User Avatar"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 