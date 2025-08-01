import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import Header from "./Header";
import { postTradingRequest } from "../api/tradingApi";
import useTradingStore from "../store/useTradingStore";
import Papa from 'papaparse';

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
  const [hoveredPointIndex, setHoveredPointIndex] = useState(null); // 호버된 포인트 인덱스

  const [nasdaqAcc, setNasdaqAcc] = useState([])            // 필터된 기간의 누적 수익률 배열
  const [nasdaqReturnRate, setNasdaqReturnRate] = useState(0) // 전체 return(%)

  // Zustand store에서 데이터 가져오기
  const result = useTradingStore((state) => state.result);
  const setResult = useTradingStore((state) => state.setResult);

  const nasdaqData = useTradingStore(state => state.nasdaqData);
  const setNasdaqData = useTradingStore(state => state.setNasdaqData);
  const tradingParams = useTradingStore(state => state.tradingParams);
  const getFilteredNasdaqData = useTradingStore(state => state.getFilteredNasdaqData);

  const [nasdaqPath, setNasdaqPath] = useState("");
  const [nasdaqFillPath, setNasdaqFillPath] = useState("");
  const [nasdaqLines, setNasdaqLines] = useState({ horizontalLines: [], verticalLines: [] });
  const { horizontalLines: nh, verticalLines: nv } = nasdaqLines; 

  // 1) CSV 로드
  useEffect(() => {
    fetch('/nasdaq_2024_2025.csv')
      .then(res => res.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: ({ data }) => {
            const parsed = data.map(row => ({
              Date: row.Date,
              Close: parseFloat(row.Close)
            }));
            setNasdaqData(parsed);
          }
        });
      })
      .catch(err => console.error("CSV 로드 오류:", err));
  }, [setNasdaqData]);

  const updateChartSize = () => {
    const container = document.querySelector('.chart-section');
    if (!container) return;
    const w = Math.max(500, Math.min(container.offsetWidth - 40, 1600));
    setChartWidth(w);
    setChartHeight(Math.max(200, w * 0.28));
  };

     // 3) SVG path 생성 함수
   const generateChartPaths = (values) => {
     if (!values.length) return { path: "", fillPath: "" };
     const p = 30, w = chartWidth - p*2, h = chartHeight - p*2;
     const ys = values.map(v => v.account_value);
     const min = Math.min(...ys), max = Math.max(...ys), range = max - min || 1;
     const step = w / (values.length - 1);
     let d = "", f = "";
     const points = []; // 데이터 포인트 좌표 저장
     
     values.forEach((pt,i) => {
       const x = p + i*step;
       const y = chartHeight - p - ((pt.account_value - min)/range)*h;
       
       // 데이터 포인트 좌표와 데이터 저장
       points.push({
         x,
         y,
         date: pt.date,
         value: pt.account_value,
         index: i
       });
       
       if (i===0) {
         d = `M${x} ${y}`;
         f = `M${x} ${chartHeight-p} L${x} ${y}`;
       } else {
         d += ` L${x} ${y}`;
         f += ` L${x} ${y}`;
       }
     });
     f += ` L${p + (values.length-1)*step} ${chartHeight-p} Z`;
     
     // 데이터 포인트 좌표 저장
     setDataPoints(points);
     return { path: d, fillPath: f };
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
    let closestIndex = -1;

    dataPoints.forEach((point, index) => {
      const distance = Math.abs(point.x - mouseX);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
        closestIndex = index;
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
      setHoveredPointIndex(closestIndex);
    } else {
      setTooltip(prev => ({ ...prev, show: false }));
      setHoveredPointIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }));
    setHoveredPointIndex(null);
  };

  


  const generateGridLines = (values) => {
    if (!values.length) return { horizontalLines:[], verticalLines:[] };
    const p = 30, w = chartWidth - p*2, h = chartHeight - p*2;
    const hLines = [], vLines = [];
    for (let i=0; i<=5; i++) {
      const yy = p + (i*h/5);
      hLines.push({ x1:p, y1:yy, x2:chartWidth-p, y2:yy });
    }
    const step = w/(values.length-1);
    values.forEach((_,i) => {
      const xx = p + i*step;
      vLines.push({ x1:xx, y1:p, x2:xx, y2:chartHeight-p });
    });
    return { horizontalLines:hLines, verticalLines:vLines };
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



    // MAIN useEffect: 리사이즈 + API 호출
    useEffect(() => {
      updateChartSize();
        if (!result?.result) {
            // 처음 마운트 시에는 API 요청
            fetchTradingData();
          } else {
            // tradingData 객체 전체를 넘겨 주고
            updateChartPaths(result.result);
            // 바로 로딩 상태 해제
            setLoading(false);
          }
      window.addEventListener("resize", updateChartSize);
      return () => window.removeEventListener("resize", updateChartSize);
    }, [result, chartWidth, chartHeight]);
  
    // NASDAQ 차트 경로 업데이트: CSV 데이터 + 필터링
    useEffect(() => {
      if (
        nasdaqData.length > 0 &&
        tradingParams.startDate &&
        tradingParams.endDate
      ) {
        console.log("▶ 전체 NASDAQ 데이터:", nasdaqData.length, nasdaqData[0], nasdaqData[nasdaqData.length-1]);
        // 날짜 문자열을 JS Date 객체로 변환
        const start = new Date(tradingParams.startDate);
        const end = new Date(tradingParams.endDate);
        // 해당 기간 데이터만 필터
        const slice = nasdaqData.filter((row) => {
          const d = new Date(row.Date);
          return d >= start && d <= end;
        });

        console.log("▶ 필터된 구간:", tradingParams.startDate, "~", tradingParams.endDate, "→", slice.length, "개");

        if (slice.length >= 2) {
          // 기준가 대비 누적 수익률 (initial capital 비례)
          const base = slice[0].Close;
          const acc = slice.map((r) => ({
            date: r.Date,
            account_value: (r.Close / base) * 100, // 100 단위 수익률
          }));
          console.log("▶ 누적 수익률 데이터 예시:", acc.slice(0,3));

          setNasdaqAcc(acc)
          const last = acc[acc.length - 1].account_value
          const ret  = last - 100          // 이미 *100 했으니까 100을 빼면 %리턴
          setNasdaqReturnRate(ret)
          // 경로 및 그리드 계산
          const { path, fillPath } = generateChartPaths(acc);
          console.log("▶ 생성된 path:", path.substring(0,50), "…");
          setNasdaqPath(path);
          setNasdaqFillPath(fillPath);
          setNasdaqLines(generateGridLines(acc));
        }
      }
    }, [nasdaqData, tradingParams, chartWidth, chartHeight]);

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
  const nasdaqDays       = nasdaqAcc.length
  const nasdaqReturnText = `${nasdaqReturnRate >= 0 ? '+' : ''}${nasdaqReturnRate.toFixed(2)}%`

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
                  {/* 데이터 포인트 (호버된 포인트만 표시) */}
                  {hoveredPointIndex !== null && dataPoints[hoveredPointIndex] && (
                    <circle
                      key={hoveredPointIndex}
                      cx={dataPoints[hoveredPointIndex].x}
                      cy={dataPoints[hoveredPointIndex].y}
                      r="8"
                      fill="#ff6b6b"
                      stroke="#fff"
                      strokeWidth="3"
                      style={{ 
                        transition: 'all 0.2s ease',
                        pointerEvents: 'none'
                      }}
                      className="chart-point"
                    />
                  )}
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
          {/* Nasdaq Chart */}
          <div className="chart-section">
            <div className="chart-header">
              <div>
                <div className="chart-title" style={{color:'#ffa500'}}>Nasdaq Index Returns</div>
                <div className={`chart-percentage  ${nasdaqReturnRate >= 0 ? 'positive' : 'negative'}`}>
                  {nasdaqReturnText}
                </div>
                {/* <div className="chart-period">
                  Last {nasdaqDays} Days 
                  <span className={nasdaqReturnRate >= 0 ? 'positive' : 'negative'}>
                    {' '}{nasdaqReturnText}
                  </span>
                </div> */}
              </div>
            </div>
            <div className="chart-visualization">
              <svg className="performance-chart" width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} fill="none">
                <g>
                  {nh.map((ln,i)=><line key={i} {...ln} stroke="#334d66" strokeWidth="1" opacity="0.3"/>)}
                  {nv.map((ln,i)=><line key={i} {...ln} stroke="#334d66" strokeWidth="1" opacity="0.3"/>)}
                  <path d={nasdaqFillPath} fill="url(#paint_nasdaq)"/>
                  <path d={nasdaqPath} stroke="#ffa500" strokeWidth="2" fill="none"/>
                </g>
                <defs>
                  <linearGradient id="paint_nasdaq" x1="0" y1="0" x2="0" y2={chartHeight} gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffa500" stopOpacity="0.3"/>
                    <stop offset="1" stopColor="#ffa500" stopOpacity="0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="chart-months" style={{ display:'flex', justifyContent:'space-between', padding:'0 20px', marginTop:'12px' }}>
              {/* {generateXAxisLabels(getFilteredNasdaqData(tradingParams.startDate, tradingParams.endDate)) */}
              {generateXAxisLabels(nasdaqAcc)
                .map((lbl,i)=>(
                <span key={i} style={{position:'absolute', left:`${(30 + lbl.position*((chartWidth-60)/(
                  getFilteredNasdaqData(tradingParams.startDate, tradingParams.endDate).length-1)))/chartWidth*100}%`, transform:'translateX(-50%)',color:'#94adc7',fontSize:'12px',whiteSpace:'nowrap'}}>
                  {lbl.text}
                </span>
              ))}
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
          <div className="chart-period">{tradingParams.startDate} ~ {tradingParams.endDate}</div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;