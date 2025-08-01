import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
import "./Dashboard.css";
import Header from "./Header";
import { postTradingRequest, fetchNasdaqData } from "../api/tradingApi";
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

  // Zustand store에서 데이터 가져오기 (requestParams도 가져옵니다)
  const result = useTradingStore((state) => state.result);
  const setResult = useTradingStore((state) => state.setResult);
  const requestParams = useTradingStore(state => state.requestParams); // requestParams 가져오기

  // (1) Main.jsx에서 저장된 실제 요청 파라미터 (초기값 제거)
  const {
    name,
    initialCapital,
    startDate, // 이제 requestParams에서 직접 가져옵니다.
    endDate // 이제 requestParams에서 직접 가져옵니다.
  } = requestParams || {}; // requestParams가 undefined일 경우를 대비하여 빈 객체로 대체

  // (2) Nasdaq 전용 state
  const [nasdaqPoints, setNasdaqPoints] = useState([]);
  const [nasdaqPath, setNasdaqPath] = useState("");
  const [nasdaqFill, setNasdaqFill] = useState("");
  const [nasdaqZeroY, setNasdaqZeroY] = useState(0); // 0% 기준선 Y 좌표

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
  const generateChartPaths = (values, isPercentageChart = false) => {
    if (!values || values.length === 0) return { path: "", fillPath: "" };

    const padding = 30; // 40에서 30으로 줄임
    const chartAreaWidth = chartWidth - (padding * 2);
    const chartAreaHeight = chartHeight - (padding * 2);

    let minValue, maxValue;

    if (isPercentageChart) {
      // 나스닥 수익률 차트의 경우, 0%를 기준으로 최소/최대값 설정
      const currentMin = Math.min(...values.map(item => item.account_value));
      const currentMax = Math.max(...values.map(item => item.account_value));
      minValue = Math.min(0, currentMin); // 0%를 포함
      maxValue = Math.max(0, currentMax); // 0%를 포함
    } else {
      // 포트폴리오 가치 차트의 경우, 원래대로 계좌 잔고의 최소/최대값 사용
      minValue = Math.min(...values.map(item => item.account_value));
      maxValue = Math.max(...values.map(item => item.account_value));
    }

    const valueRange = maxValue - minValue;

    let pathD = "";
    let fillD = "";
    const points = [];

    // 0% 기준선 Y 좌표 계산
    const zeroY = isPercentageChart && valueRange !== 0
      ? chartHeight - padding - ((0 - minValue) / valueRange) * chartAreaHeight
      : chartHeight - padding; // 기본적으로 바닥에 둡니다.

    // X축 간격 계산
    const xStep = chartAreaWidth / (values.length - 1);

    values.forEach((item, index) => {
      const x = padding + (index * xStep);
      const normalizedValue = valueRange === 0 ? 0.5 : (item.account_value - minValue) / valueRange;
      const y = chartHeight - padding - (normalizedValue * chartAreaHeight);

      points.push({
        x,
        y,
        date: item.date,
        value: item.account_value,
        index
      });

      if (index === 0) {
        pathD += `M${x} ${y}`;
        // 채우기 시작점은 현재 값과 0% 기준선 중 낮은 값에서 시작
        fillD += `M${x} ${zeroY} L${x} ${y}`;
      } else {
        pathD += ` L${x} ${y}`;
        fillD += ` L${x} ${y}`;
      }
    });

    // 채우기 영역의 마지막 점과 0% 기준선을 연결하여 영역 닫기
    fillD += ` L${padding + ((values.length - 1) * xStep)} ${zeroY} Z`;

    if (!isPercentageChart) {
      setDataPoints(points);
    }

    return { path: pathD, fillPath: fillD, zeroYLine: zeroY }; // zeroYLine 반환 추가
  };

  // ===== 마우스 이벤트 핸들러 =====
  const handleMouseMove = (e) => {
    if (!dataPoints.length) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    // const mouseY = e.clientY - svgRect.top; // Nasdaq 차트에도 툴팁을 적용하려면 이 값을 사용해야 함

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

      // 툴팁 위치를 마우스 위치가 아닌 해당 데이터 포인트의 차트 내 x, y 좌표를 기준으로 설정
      // 이렇게 하면 툴팁이 차트 라인을 따라다니게 됩니다.
      const tooltipX = closestPoint.x + svgRect.left; // SVG 내부 좌표에 SVG 컨테이너의 왼쪽 위치 더하기
      const tooltipY = closestPoint.y + svgRect.top; // SVG 내부 좌표에 SVG 컨테이너의 상단 위치 더하기


      setTooltip({
        show: true,
        x: tooltipX,
        y: tooltipY,
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
    // 데이터 포인트가 하나일 경우 xStep을 0으로 설정하여 NaN 방지
    const xStep = accountValues.length > 1 ? chartAreaWidth / (accountValues.length - 1) : 0;

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
  const fetchTradingData = async (params) => {
    try {
      setLoading(true);
      setError(null);

      if (!params || !params.startDate || !params.endDate) {
        // params가 없으면 API 호출하지 않고 로딩 해제
        setLoading(false);
        setError("트레이딩 기간 정보가 부족합니다.");
        return;
      }

      const response = await postTradingRequest(params);

      if (response.status === "success") {
        setResult(response); // Zustand store에 저장
        updateChartPaths(response.result);

        // NASDAQ 데이터도 여기서 같이 가져오도록 수정
        const nas = await fetchNasdaqData({
          startDate: params.startDate,
          endDate: params.endDate
        });
        if (nas.status === "success") {
          const nv = nas.result.nasdaq_values.map(d => ({
            date: d.date,
            account_value: d.value
          }));
          const { path, fillPath, zeroYLine } = generateChartPaths(nv, true); // true를 전달하여 나스닥 수익률 차트임을 알림
          setNasdaqPoints(nv);
          setNasdaqPath(path);
          setNasdaqFill(fillPath);
          setNasdaqZeroY(zeroYLine); // 0% 기준선 저장
        } else {
          console.error("NASDAQ 데이터 가져오기 실패:", nas.message);
        }
      } else {
        setError(`트레이딩 데이터를 가져오는데 실패했습니다: ${response.message || '알 수 없는 오류'}`);
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

      const sampleNasdaq = {
        "status": "success",
        "result": {

          "nasdaq_values": [
            { "date": "2025-01-02T00:00:00", "value": 0.0000 },
            { "date": "2025-01-03T00:00:00", "value": 0.5000 },
            { "date": "2025-01-04T00:00:00", "value": 1.2000 },
            { "date": "2025-01-05T00:00:00", "value": 0.8000 },
            { "date": "2025-01-06T00:00:00", "value": -0.3000 },
            { "date": "2025-01-07T00:00:00", "value": -1.5000 }, { "date": "2025-01-08T00:00:00", "value": -0.8000 },
            { "date": "2025-01-09T00:00:00", "value": 0.2000 },
            { "date": "2025-01-10T00:00:00", "value": 1.5000 },
            { "date": "2025-01-11T00:00:00", "value": 2.0000 },
            { "date": "2025-01-12T00:00:00", "value": 1.8000 },
            { "date": "2025-01-13T00:00:00", "value": 1.0000 },
            { "date": "2025-01-14T00:00:00", "value": 0.5000 },
            { "date": "2025-01-15T00:00:00", "value": 0.8000 }
          ]
        }
      };
      const nv = sampleNasdaq.result.nasdaq_values.map(d => ({
        date: d.date,
        account_value: d.value
      }));
      const { path, fillPath, zeroYLine } = generateChartPaths(nv, true);
      setNasdaqPoints(nv);
      setNasdaqPath(path);
      setNasdaqFill(fillPath);
      setNasdaqZeroY(zeroYLine);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateChartSize(); // 초기 차트 크기 설정

    // requestParams와 result를 모두 의존성 배열에 추가하여 정확한 시점에 호출
    if (requestParams && requestParams.startDate && requestParams.endDate && !result?.result) {
      fetchTradingData(requestParams);
    } else if (result?.result) {
      // 이미 결과가 스토어에 있으면 차트만 업데이트
      updateChartPaths(result.result);
      // NASDAQ 데이터도 업데이트 (requestParams.startDate와 endDate를 사용하여 호출)
      fetchNasdaqData({ startDate: requestParams.startDate, endDate: requestParams.endDate })
        .then(nas => {
          if (nas.status === "success") {
            const nv = nas.result.nasdaq_values.map(d => ({
              date: d.date,
              account_value: d.value
            }));
            const { path, fillPath, zeroYLine } = generateChartPaths(nv, true); // true를 전달하여 나스닥 수익률 차트임을 알림
            setNasdaqPoints(nv);
            setNasdaqPath(path);
            setNasdaqFill(fillPath);
            setNasdaqZeroY(zeroYLine);
          }
        })
        .catch(console.error);
      setLoading(false);
    } else {
      // requestParams가 없으면 (예: 새로고침 시) 에러 처리 또는 초기화
      setError("시뮬레이션 기간 정보가 없어 데이터를 불러올 수 없습니다. 메인 페이지에서 다시 시작해주세요.");
      setLoading(false);
    }
  }, [requestParams, result, chartWidth, chartHeight]); // chartWidth, chartHeight도 의존성에 추가하여 리사이즈 시 재계산

  // 사용자가 입력한 기간이 준비되면 Nasdq 호출 보장 (이 useEffect는 제거해도 됩니다. 위 useEffect에 통합됨)
  // useEffect(() => {
  //   if (startDate && endDate) {
  //     fetchNasdaqData({ startDate, endDate })
  //       .then(nas => {
  //         if (nas.status === "success") {
  //           const nv = nas.result.nasdaq_values.map(d => ({
  //             date: d.date,
  //             account_value: d.value
  //           }));
  //           const { path, fillPath } = generateChartPaths(nv);
  //           setNasdaqPoints(nv);
  //           setNasdaqPath(path);
  //           setNasdaqFill(fillPath);
  //         }
  //       })
  //       .catch(console.error);
  //   }
  // }, [startDate, endDate]); // 이 부분을 위에 통합했으므로 제거해도 됨

  // 윈도우 리사이즈 시 차트 크기 업데이트
  useEffect(() => {
    const handleResize = () => {
      updateChartSize();
      if (result && result.result) {
        updateChartPaths(result.result);
      }
      if (nasdaqPoints.length > 0) {
        // 리사이즈 시 Nasdaq 차트도 다시 그리기
        const { path, fillPath, zeroYLine } = generateChartPaths(nasdaqPoints, true);
        setNasdaqPath(path);
        setNasdaqFill(fillPath);
        setNasdaqZeroY(zeroYLine);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [result, nasdaqPoints, chartWidth, chartHeight]); // chartWidth, chartHeight도 의존성에 추가

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
              <div style={{ color: '#94ADC7' }}>위험 1단위당 초과수익</div>
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
                const xStep = tradingData.account_values.length > 1 ? chartAreaWidth / (tradingData.account_values.length - 1) : 0;
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

          {/* ────────── Nasdaq Index 차트 ────────── */}
          <div className="chart-section" style={{ marginTop: 40 }}>
            <div className="chart-header">
              <div>
                <div className="chart-title">Nasdaq Index (%)</div>
                {/* 나스닥 지수의 현재 수익률 표시 (선택 사항) */}
                {nasdaqPoints.length > 0 && (
                  <div className={`chart-percentage ${nasdaqPoints[nasdaqPoints.length - 1].account_value >= 0 ? 'positive' : 'negative'}`}>
                    {nasdaqPoints[nasdaqPoints.length - 1].account_value >= 0 ? '+' : ''}{nasdaqPoints[nasdaqPoints.length - 1].account_value.toFixed(2)}%
                  </div>
                )}
                <div className="chart-period">Last {nasdaqPoints.length} Days</div>
              </div>
            </div>
            <div className="chart-visualization">
              <svg
                width={chartWidth}
                height={chartHeight}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                // 나스닥 차트에도 툴팁과 마우스 이벤트를 적용하려면 여기에 추가
                // onMouseMove={handleMouseMoveForNasdaq}
                // onMouseLeave={handleMouseLeaveForNasdaq}
                style={{ cursor: 'crosshair' }}
              >
                <g clipPath="url(#clip0_nasdaq)">
                  {generateGridLines(nasdaqPoints).horizontalLines.map((l, i) => (
                    <line key={i} {...l} stroke="#334d66" strokeWidth="1" opacity="0.3" />
                  ))}
                  {generateGridLines(nasdaqPoints).verticalLines.map((l, i) => (
                    <line key={i} {...l} stroke="#334d66" strokeWidth="1" opacity="0.3" />
                  ))}

                  {/* 0% 기준선 (나스닥 차트에만 해당) */}
                  {/* nasdaqZeroY가 0보다 클 때만 그리는 것이 아니라, 유효한 값일 경우 그려야 합니다. */}
                  {nasdaqPoints.length > 0 && (
                    <line
                      x1={30} // padding 값과 동일하게 설정
                      y1={nasdaqZeroY}
                      x2={chartWidth - 30} // padding 값과 동일하게 설정
                      y2={nasdaqZeroY}
                      stroke="#94adc7" // 0% 기준선 색상
                      strokeWidth="1"
                      strokeDasharray="4 2" // 점선으로 표시
                      opacity="0.8"
                    />
                  )}

                  {/* 채우기 영역 */}
                  <path
                    d={nasdaqFill}
                    fill={nasdaqPoints.length > 0 && nasdaqPoints[nasdaqPoints.length - 1].account_value >= 0 ? "url(#paint0_linear_nasdaq_green)" : "url(#paint0_linear_nasdaq_red)"}
                  />
                  {/* 라인 차트 */}
                  <path d={nasdaqPath} stroke="#dce8f5" strokeWidth="3" fill="none" />
                </g>
                <defs>
                  {/* 나스닥용 녹색 그라데이션 */}
                  <linearGradient id="paint0_linear_nasdaq_green" x1="0" y1="0" x2="0" y2={chartHeight}>
                    <stop stopColor="#3ecf8e" stopOpacity="0.3" />
                    <stop offset="1" stopColor="#3ecf8e" stopOpacity="0" />
                  </linearGradient>
                  {/* 나스닥용 빨간색 그라데이션 */}
                  <linearGradient id="paint0_linear_nasdaq_red" x1="0" y1="0" x2="0" y2={chartHeight}>
                    <stop stopColor="#ff6b6b" stopOpacity="0.3" />
                    <stop offset="1" stopColor="#ff6b6b" stopOpacity="0" />
                  </linearGradient>

                  <clipPath id="clip0_nasdaq">
                    <rect width={chartWidth} height={chartHeight} />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="chart-months" style={{ position: 'relative', height: 20, padding: '0 20px', marginTop: '12px' }}>
              {generateXAxisLabels(nasdaqPoints).map((lab, i) => {
                const padding = 30; // generateChartPaths와 동일한 패딩 사용
                const chartAreaWidth = chartWidth - (padding * 2);
                const xStep = nasdaqPoints.length > 1 ? chartAreaWidth / (nasdaqPoints.length - 1) : 0; // 데이터가 하나일 경우 0으로 나눔 방지
                const xPosition = padding + (lab.position * xStep);
                const percentage = (xPosition / chartWidth) * 100;
                return (
                  <span
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${percentage}%`,
                      transform: 'translateX(-50%)',
                      color: '#94adc7',
                      fontSize: 12,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {lab.text}
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
                left: `${tooltip.x + 10}px`, // 마우스 위치 + 10px
                top: `${tooltip.y - 10}px`, // 마우스 위치 - 10px
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;