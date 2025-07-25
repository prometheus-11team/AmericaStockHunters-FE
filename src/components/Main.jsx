import React, { useState } from "react";
import "./Main.css";
import Header from "./Header";

const Main = () => {
  const [initialCapital, setInitialCapital] = useState(100000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  const handleSubmit = async (e) => {
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

    // 이름, 초기자본 값 가져오기
    const name = e.target.elements[0].value;
    const body = {
      name,
      initialCapital,
      startDate,
      endDate
    };
    try {
      const res = await fetch('/api/v1/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setSubmitMessage('트레이딩이 시작됩니다!');
        setSubmitStatus('success');
      } else {
        setSubmitMessage('요청에 실패했습니다.');
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitMessage('네트워크 오류가 발생했습니다.');
      setSubmitStatus('error');
    }
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
                  color: '#feb9b9', 
                  marginTop: '8px', 
                  textAlign: 'center', 
                  }}><b>{dateError}</b></div>
              )}
              {submitMessage && (
                <div style={{ 
                  color: submitStatus ==='success' ? '#d1ffdb' : '#fed8b9', 
                  marginTop: '12px', 
                  textAlign: 'center' 
                }}><b>{submitMessage}</b>
                </div>
              )}

              <button className="trading-start-btn">Trading Start </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Main;
