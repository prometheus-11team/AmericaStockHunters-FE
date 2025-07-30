import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
import "./Dashboard.css";
import Header from "./Header";
import { postTradingRequest } from "../api/tradingApi";
import useTradingStore from "../store/useTradingStore";

const Dashboard = () => {
  const [chartPath, setChartPath] = useState("");
  const [fillPath, setFillPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartWidth, setChartWidth] = useState(852);
  const [chartHeight, setChartHeight] = useState(186);
  const [tooltip, setTooltip] = useState({ 
    show: false, 
    x: 0, 
    y: 0, 
    date: '', 
    value: 0 
  });
  const [dataPoints, setDataPoints] = useState([]); // 데이터 포인트 좌표 저장



  // Zustand store에서 데이터 가져오기
  const result = useTradingStore((state) => state.result);
  const setResult = useTradingStore((state) => state.setResult);

  // 차트 크기 조정 함수
  const updateChartSize = () => {
    const container = document.querySelector('.chart-section');
    if (container) {
      const containerWidth = container.offsetWidth;
      // 전체 컨테이너 너비에서 패딩을 제외한 크기 사용
      const availableWidth = containerWidth - 40; // 좌우 패딩 20px씩 제외 (1vw ≈ 20px)
      const newWidth = Math.max(500, Math.min(availableWidth, 1600)); // 최대 크기 증가
      const newHeight = Math.max(200, newWidth * 0.28); // 비율을 28%로 증가하여 더 높게
      setChartWidth(newWidth);
      setChartHeight(newHeight);
    }
  };

  // 차트 데이터를 SVG 경로로 변환하는 함수
  const generateChartPaths = (accountValues) => {
    if (!accountValues || accountValues.length === 0) return { path: "", fillPath: "" };

    const padding = 30; // 40에서 30으로 줄임
    const chartAreaWidth = chartWidth - (padding * 2);
    const chartAreaHeight = chartHeight - (padding * 2);

    // 최소값과 최대값 계산
    const values = accountValues.map(item => item.account_value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // X축 간격 계산
    const xStep = chartAreaWidth / (accountValues.length - 1);

    // 경로 생성
    let pathD = "";
    let fillD = "";
    const points = [];


    accountValues.forEach((item, index) => {
      const x = padding + (index * xStep);
      const normalizedValue = valueRange === 0 ? 0.5 : (item.account_value - minValue) / valueRange;
      const y = chartHeight - padding - (normalizedValue * chartAreaHeight);

      // 데이터 포인트 좌표와 데이터 저장
      points.push({
        x,
        y,
        date: item.date,
        value: item.account_value,
        index
      });

      if (index === 0) {
        pathD += `M${x} ${y}`;
        fillD += `M${x} ${chartHeight - padding} L${x} ${y}`;
      } else {
        pathD += ` L${x} ${y}`;
        fillD += ` L${x} ${y}`;
      }
    });

    // 채우기 경로 완성
    fillD += ` L${padding + ((accountValues.length - 1) * xStep)} ${chartHeight - padding} Z`;

    // 데이터 포인트 좌표 저장
    setDataPoints(points); 
    return { path: pathD, fillPath: fillD };
  };

  // ===== 마우스 이벤트 핸들러 =====
  const handleMouseMove = (e) => {
    if (!dataPoints.length) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    // 가장 가까운 데이터 포인트 찾기
    let closestPoint = null;
    let minDistance = Infinity;

    dataPoints.forEach(point => {
      const distance = Math.abs(point.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });

    if (closestPoint && minDistance < 30) { // 30px 이내에서만 반응
      const date = new Date(closestPoint.date);
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      setTooltip({
        show: true,
        x: e.clientX,
        y: e.clientY,
        date: formattedDate,
        value: closestPoint.value
      });
    } else {
      setTooltip(prev => ({ ...prev, show: false }));
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }));
  };

  // 그리드 라인 생성 함수
  const generateGridLines = (accountValues) => {
    if (!accountValues || accountValues.length === 0) return { horizontalLines: [], verticalLines: [] };

    const padding = 30; 
    const chartAreaWidth = chartWidth - (padding * 2);
    const chartAreaHeight = chartHeight - (padding * 2);

    // 수평 그리드 라인 (Y축)
    const values = accountValues.map(item => item.account_value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    
    const horizontalLines = [];
    const gridLines = 5; // 5개의 수평 그리드 라인
    
    for (let i = 0; i <= gridLines; i++) {
      const y = padding + (i * chartAreaHeight / gridLines);
      horizontalLines.push({
        x1: padding,
        y1: y,
        x2: chartWidth - padding,
        y2: y
      });
    }

    // 수직 그리드 라인 (X축)
    const verticalLines = [];
    const xStep = chartAreaWidth / (accountValues.length - 1);
    
    for (let i = 0; i < accountValues.length; i++) {
      const x = padding + (i * xStep);
      verticalLines.push({
        x1: x,
        y1: padding,
        x2: x,
        y2: chartHeight - padding
      });
    }

    return { horizontalLines, verticalLines };
  };

  // X축 레이블 생성 (입력 길이에 따라 전체 기간을 12등분)
  const generateXAxisLabels = (accountValues) => {
    if (!accountValues || accountValues.length === 0) return [];
    
    const dataLength = accountValues.length;
    const maxLabels = 12; // 최대 12개의 레이블
    const labels = [];
    
    if (dataLength <= maxLabels) {
      // 데이터 포인트가 12개 이하면 모든 포인트 표시
      for (let i = 0; i < dataLength; i++) {
        const item = accountValues[i];
        const date = new Date(item.date);
        labels.push({
          text: `${date.getMonth() + 1}/${date.getDate()}`,
          position: i
        });
      }
    } else {
      // 데이터 포인트가 12개 초과면 12등분으로 나누어 표시
      const step = Math.floor(dataLength / (maxLabels - 1));
      
      for (let i = 0; i < maxLabels; i++) {
        const index = i === maxLabels - 1 ? dataLength - 1 : i * step;
        const item = accountValues[index];
        const date = new Date(item.date);
        labels.push({
          text: `${date.getMonth() + 1}/${date.getDate()}`,
          position: index
        });
      }
    }
    
    return labels;
  };

  // 차트 경로 업데이트 함수
  const updateChartPaths = (tradingData) => {
    if (tradingData && tradingData.account_values) {
      const { path, fillPath } = generateChartPaths(tradingData.account_values);
      setChartPath(path);
      setFillPath(fillPath);
    }
  };

  // API에서 트레이딩 데이터 가져오기 (Zustand에 데이터가 없을 때만)
  const fetchTradingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 실제 API 호출 (샘플 데이터 대신)
      const response = await postTradingRequest({
        // API 요청에 필요한 데이터
        symbol: "AAPL",
        start_date: "2025-01-01",
        end_date: "2025-01-15",
        initial_capital: 100000
      });
      
      if (response.status === "success") {
        setResult(response); // Zustand store에 저장
        updateChartPaths(response.result);
      } else {
        setError("트레이딩 데이터를 가져오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("API 호출 실패:", error);
      setError("API 호출 중 오류가 발생했습니다.");
      
      // 에러 발생 시 샘플 데이터 사용 (개발용)
      const sampleResponse = {
        "status": "success",
        "message": "jisu 의 트레이딩이 완료됨",
        "result": {
          "initial_capital": 100000,
          "final_asset": 83188.72421618654,
          "profit": -16811.275783813457,
          "profit_rate": -16.81,
          "sharpe_ratio": -2.3375,
          "account_values": [
            {
              "date": "2025-01-02T00:00:00",
              "account_value": 100000
            },
            {
              "date": "2025-01-03T00:00:00",
              "account_value": 98500
            },
            {
              "date": "2025-01-04T00:00:00",
              "account_value": 97200
            },
            {
              "date": "2025-01-05T00:00:00",
              "account_value": 95800
            },
            {
              "date": "2025-01-06T00:00:00",
              "account_value": 94500
            },
            {
              "date": "2025-01-07T00:00:00",
              "account_value": 93200
            },
            {
              "date": "2025-01-08T00:00:00",
              "account_value": 91800
            },
            {
              "date": "2025-01-09T00:00:00",
              "account_value": 90500
            },
            {
              "date": "2025-01-10T00:00:00",
              "account_value": 89200
            },
            {
              "date": "2025-01-11T00:00:00",
              "account_value": 87900
            },
            {
              "date": "2025-01-12T00:00:00",
              "account_value": 86600
            },
            {
              "date": "2025-01-13T00:00:00",
              "account_value": 85300
            },
            {
              "date": "2025-01-14T00:00:00",
              "account_value": 84000
            },
            {
              "date": "2025-01-15T00:00:00",
              "account_value": 83188.72421618654
            }
          ]
        }
      };
      
      setResult(sampleResponse); // Zustand store에 저장
      updateChartPaths(sampleResponse.result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 초기 차트 크기 설정
    updateChartSize();
    
    // Zustand store에 데이터가 있으면 사용, 없으면 API 호출
    if (result && result.result) {
      updateChartPaths(result.result);
      setLoading(false);
    } else {
      fetchTradingData();
    }
  }, [result]);

  // 윈도우 리사이즈 시 차트 크기 업데이트
  useEffect(() => {
    const handleResize = () => {
      updateChartSize();
      if (result && result.result) {
        updateChartPaths(result.result);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [result]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-background">
          <Header />
          <main className="dashboard-main">
            <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>
              트레이딩 데이터를 불러오는 중...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-background">
          <Header />
          <main className="dashboard-main">
            <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '50px' }}>
              {error}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!result || !result.result) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-background">
          <Header />
          <main className="dashboard-main">
            <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>
              데이터를 불러올 수 없습니다.
            </div>
          </main>
        </div>
      </div>
    );
  }

  const tradingData = result.result;
  const profitRate = tradingData.profit_rate;
  const isPositive = profitRate >= 0;
  const profitRateDisplay = isPositive ? `+${profitRate.toFixed(2)}%` : `${profitRate.toFixed(2)}%`;
  const xAxisLabels = generateXAxisLabels(tradingData.account_values);
  const { horizontalLines, verticalLines } = generateGridLines(tradingData.account_values);

  // 소수점 첫째자리 반올림
  const roundedProfit = Math.round(tradingData.profit * 10) / 10;
  const roundedFinalAsset = Math.round(tradingData.final_asset * 10) / 10;

  return (
    <div className="dashboard-container">
      <div className="dashboard-background">
        <Header />
        <main className="dashboard-main">
          <h2 className="dashboard-title">Dashboard</h2>
          <div className="metrics-section">
            <div className="metrics-card">
              <div className="card-label">Total Profit/Loss</div>
              <div className="card-value">$ {roundedProfit.toLocaleString()}</div>
              <div className={`card-change ${isPositive ? 'positive' : 'negative'}`}>
                {profitRateDisplay}
              </div>
            </div>
            <div className="metrics-card">
              <div className="card-label">Current Balance</div>
              <div className="card-value">$ {roundedFinalAsset.toLocaleString()}</div>
              <div className={`card-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{roundedProfit.toLocaleString()}
              </div>
            </div>
            <div className="metrics-card">
              <div className="card-label">Sharpe Ratio</div>
              <div className="card-value">{tradingData.sharpe_ratio.toFixed(2)}</div>
              {/* <div className={`card-change ${tradingData.sharpe_ratio >= 0 ? 'positive' : 'negative'}`}>
                {tradingData.sharpe_ratio >= 0 ? '+' : ''}{tradingData.sharpe_ratio.toFixed(2)}
              </div> */}
              <div style={{ color: '#94ADC7'}}>위험 1단위당 초과수익</div>
            </div>
          </div>
          <div className="chart-section">
            <div className="chart-header">
              <div>
                <div className="chart-title">Portfolio Value</div>
                <div className={`chart-percentage ${isPositive ? 'positive' : 'negative'}`}>
                  {profitRateDisplay}
                </div>
                <div className="chart-period">
                  Last {tradingData.account_values.length} Days 
                  <span className={isPositive ? 'positive' : 'negative'}> {profitRateDisplay}</span>
                </div>
              </div>
            </div>
            <div className="chart-visualization">
              <svg
                className="performance-chart"
                width={chartWidth}
                height={chartHeight}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'crosshair' }}
              >
                <g clipPath="url(#clip0_15_687)">
                  {/* 그리드 라인 */}
                  {horizontalLines.map((line, index) => (
                    <line
                      key={`h-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#334d66"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  ))}
                  {verticalLines.map((line, index) => (
                    <line
                      key={`v-${index}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#334d66"
                      strokeWidth="1"
                      opacity="0.3"
                    />
                  ))}
                  
                  {/* 채우기 영역 */}
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d={fillPath}
                    fill={isPositive ? "url(#paint0_linear_green)" : "url(#paint0_linear_red)"}
                  />
                  
                  {/* 라인 차트 */}
                  <path
                    d={chartPath}
                    stroke="#dce8f5"
                    strokeWidth="3"
                    fill="none"
                  />
                  {/* 데이터 포인트 (호버시 더 잘 보이게) */}
                  {dataPoints.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#dce8f5"
                      stroke="#fff"
                      strokeWidth="2"
                      opacity="0"
                      style={{ 
                        transition: 'opacity 0.2s',
                        pointerEvents: 'none'
                      }}
                      className="chart-point"
                    />
                  ))}
                </g>
                <defs>
                  {/* 초록색 그라데이션 (양수) */}
                  <linearGradient
                    id="paint0_linear_green"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={chartHeight}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#3ecf8e" stopOpacity="0.3" />
                    <stop
                      offset="0.5"
                      stopColor="#3ecf8e"
                      stopOpacity="0.1"
                    />
                    <stop
                      offset="1"
                      stopColor="#3ecf8e"
                      stopOpacity="0"
                    />
                  </linearGradient>
                  
                  {/* 빨간색 그라데이션 (음수) */}
                  <linearGradient
                    id="paint0_linear_red"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={chartHeight}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#ff6b6b" stopOpacity="0.3" />
                    <stop
                      offset="0.5"
                      stopColor="#ff6b6b"
                      stopOpacity="0.1"
                    />
                    <stop
                      offset="1"
                      stopColor="#ff6b6b"
                      stopOpacity="0"
                    />
                  </linearGradient>
                  
                  <clipPath id="clip0_15_687">
                    <rect width={chartWidth} height={chartHeight} fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="chart-months" style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '0 20px',
              marginTop: '12px'
            }}>
              {xAxisLabels.map((label, index) => {
                const padding = 30;
                const chartAreaWidth = chartWidth - (padding * 2);
                const xStep = chartAreaWidth / (tradingData.account_values.length - 1);
                const xPosition = padding + (label.position * xStep);
                const percentage = (xPosition / chartWidth) * 100;
                
                return (
                  <span 
                    key={index} 
                    style={{ 
                      position: 'absolute',
                      left: `${percentage}%`,
                      transform: 'translateX(-50%)',
                      color: '#94adc7',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {label.text}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 툴팁 */}
          {tooltip.show && (
            <div
              style={{
                position: 'fixed',
                left: `${tooltip.x + 10}px`,
                top: `${tooltip.y - 10}px`,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                zIndex: 1000,
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <div style={{ marginBottom: '4px' }}>
                <strong>Date:</strong> {tooltip.date}
              </div>
              <div>
                <strong>Portfolio Value:</strong> ${tooltip.value.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
            </div>
          )}
          <div className="actions-section">
            <button className="start-bot-btn">Start Bot</button>
            <button className="stop-bot-btn">Stop Bot</button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
