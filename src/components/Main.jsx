import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Main.css";
import Header from "./Header";
import { postTradingRequest } from '../api/tradingApi';
import useTradingStore from '../store/useTradingStore';

const Main = () => {
  const [name, setName] = useState("");
  const [initialCapital, setInitialCapital] = useState(100000);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const navigate = useNavigate();
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'

  const setResult = useTradingStore((state) => state.setResult);
  const setTradingParams = useTradingStore((state) => state.setTradingParams);
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setSubmitMessage("이름을 입력해주세요.");
      setSubmitStatus("error");
      return;
    }

    if (!startDate || !endDate) {
      setDateError("시작일과 종료일을 모두 선택하세요.");
      return;
    }

    if (startDate >= endDate) {
      setDateError("투자 종료일은 시작일 이후여야 합니다.");
      return;
    }

    setDateError("");

    // 버튼을 눌렀을 때만 Zustand 스토어에 저장
    setTradingParams({
      name,
      initialCapital,
      startDate,
      endDate
    });

    const body = {
      name,
      initialCapital,
      startDate,
      endDate,
    };

    try {
      const result = await postTradingRequest(body);  // axios 요청

      if (result.status === "success") {
        setResult(result);               // Zustand에 저장
        navigate("/dashboard");          // 페이지 이동
      } else {
        // 더 명확한 에러 메시지 표시
        const errorMessage = result.message || "알 수 없는 오류";
        setSubmitMessage(`요청 실패: ${errorMessage}`);
        setSubmitStatus("error");
      }
    } catch (err) {
      console.error("API 요청 오류:", err);
      setSubmitMessage("네트워크 오류가 발생했습니다. 백엔드 서버를 확인해주세요.");
      setSubmitStatus("error");
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
