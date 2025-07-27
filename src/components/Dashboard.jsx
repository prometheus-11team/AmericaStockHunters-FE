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

  // Zustand store에서 데이터 가져오기
  const result = useTradingStore((state) => state.result);
  const setResult = useTradingStore((state) => state.setResult);

  // 차트 데이터를 SVG 경로로 변환하는 함수
  const generateChartPaths = (accountValues) => {
    if (!accountValues || accountValues.length === 0) return { path: "", fillPath: "" };

    const width = 852;
    const height = 186;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    // 최소값과 최대값 계산
    const values = accountValues.map(item => item.account_value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // X축 간격 계산
    const xStep = chartWidth / (accountValues.length - 1);

    // 경로 생성
    let pathD = "";
    let fillD = "";

    accountValues.forEach((item, index) => {
      const x = padding + (index * xStep);
      const normalizedValue = valueRange === 0 ? 0.5 : (item.account_value - minValue) / valueRange;
      const y = height - padding - (normalizedValue * chartHeight);

      if (index === 0) {
        pathD += `M${x} ${y}`;
        fillD += `M${x} ${height - padding} L${x} ${y}`;
      } else {
        pathD += ` L${x} ${y}`;
        fillD += ` L${x} ${y}`;
      }
    });

    // 채우기 경로 완성
    fillD += ` L${padding + ((accountValues.length - 1) * xStep)} ${height - padding} Z`;

    return { path: pathD, fillPath: fillD };
  };

  // 월별 라벨 생성
  const generateMonthLabels = (accountValues) => {
    if (!accountValues || accountValues.length === 0) return [];
    
    return accountValues.map((item, index) => {
      const date = new Date(item.date);
      const month = date.toLocaleDateString('ko-KR', { month: 'short' });
      return month;
    });
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
    // Zustand store에 데이터가 있으면 사용, 없으면 API 호출
    if (result && result.result) {
      updateChartPaths(result.result);
      setLoading(false);
    } else {
      fetchTradingData();
    }
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-background">
        <Header />
        <main className="dashboard-main">
          <h2 className="dashboard-title">Dashboard</h2>
          <div className="metrics-section">
            <div className="metrics-card">
              <div className="card-label">Total Profit/Loss</div>
              <div className="card-value">${tradingData.profit.toLocaleString()}</div>
              <div className={`card-change ${isPositive ? 'positive' : 'negative'}`}>
                {profitRateDisplay}
              </div>
            </div>
            <div className="metrics-card">
              <div className="card-label">Current Balance</div>
              <div className="card-value">${tradingData.final_asset.toLocaleString()}</div>
              <div className={`card-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{tradingData.profit.toLocaleString()}
              </div>
            </div>
            <div className="metrics-card">
              <div className="card-label">Sharpe Ratio</div>
              <div className="card-value">{tradingData.sharpe_ratio.toFixed(2)}</div>
              <div className={`card-change ${tradingData.sharpe_ratio >= 0 ? 'positive' : 'negative'}`}>
                {tradingData.sharpe_ratio >= 0 ? '+' : ''}{tradingData.sharpe_ratio.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="chart-section">
            <div className="chart-header">
              <div>
                <div className="chart-title">Performance Chart</div>
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
                width="852"
                height="186"
                viewBox="0 0 852 186"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_15_687)">
                  {/* 채우기 영역 */}
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d={fillPath}
                    fill="url(#paint0_linear_15_687)"
                  />
                  {/* 라인 차트 */}
                  <path
                    d={chartPath}
                    stroke="#94ADC7"
                    strokeWidth="3"
                    fill="none"
                  />
                </g>
                <defs>
                  <linearGradient
                    id="paint0_linear_15_687"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="186"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#243647" />
                    <stop
                      offset="0.5"
                      stopColor="#243647"
                      stopOpacity="0"
                    />
                  </linearGradient>
                  <clipPath id="clip0_15_687">
                    <rect width="852" height="186" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="chart-months">
              {generateMonthLabels(tradingData.account_values).map((month, index) => (
                <span key={index}>{month}</span>
              ))}
            </div>
          </div>
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