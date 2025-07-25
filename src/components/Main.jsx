import React, { useState } from "react";
import "./Main.css";
import Header from "./Header";

const Main = () => {
  const [initialCapital, setInitialCapital] = useState(100000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setDateError("시작일과 종료일을 모두 선택하세요.");
      return;
    }
    if (startDate >= endDate) {
      setDateError("투자 종료일은 시작일 이후여야 합니다.");
      return;
    }
    setDateError("");
    // ... 기존 제출 로직 ...
  };

  return (
    <div className="main-container">
      <div className="app-background">
        <Header />

        <main className="main-content">
          <div className="content-wrapper">
            <div className="welcome-section">
              <h2 className="welcome-title">
                Welcome to AMERICAN STOCK HUNTERS
              </h2>
            </div>

            <form className="trading-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <div className="field-container">
                  <div className="field-header">
                    <label className="field-label">Name</label>
                  </div>
                  <div className="input-container">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
              </div>

              <div className="form-field">
                <div className="field-container">
                  <div className="field-header">
                    <label className="field-label">Initial Capital</label>
                  </div>
                  <div className="input-container" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                      type="range"
                      className="form-input"
                      min={100000}
                      max={1000000}
                      step={1000}
                      value={initialCapital}
                      onChange={e => setInitialCapital(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ minWidth: '80px', textAlign: 'right', color: 'white' }}>{initialCapital.toLocaleString()} $</span>
                  </div>
                </div>
              </div>

              <div className="form-field period-field">
                <div className="date-field">
                  <div className="field-header">
                    <label className="field-label">Investment Period</label>
                  </div>
                  <div className="input-container">
                    <input
                      type="date"
                      className="form-input"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      placeholder="Start Date"
                      min="2024-01-01"
                      max="2025-04-30"
                    />
                  </div>
                </div>
                <div className="date-field">
                  <div className="field-header">
                    <label className="field-label">End Date</label>
                  </div>
                  <div className="input-container end-date">
                    <input
                      type="date"
                      className="form-input"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      placeholder="End Date"
                      min="2024-01-01"
                      max="2025-04-30"
                    />
                  </div>
                </div>
              </div>

              {dateError && (
                <div style={{ 
                  color: '#ffa1a1', 
                  marginTop: '8px', 
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 0, 0, 0.2)',
                  padding: '8px',
                  borderRadius: '6px' }}>{dateError}</div>
              )}

              <button className="trading-start-btn">Trading Start !</button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Main;
