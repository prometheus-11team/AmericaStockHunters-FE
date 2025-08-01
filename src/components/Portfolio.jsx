import React, { useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./Portfolio.css";
import Header from "./Header";
import useTradingStore from "../store/useTradingStore";

const COLORS = [
  "#0e7841",
  "#0072E3",
  "#FFB300",
  "#FF5630",
  "#36B37E",
  "#6554C0",
  "#FF6F61",
];

const Portfolio = () => {
  const portfolioStatus = useTradingStore(
    (state) => state.result?.result?.portfolio_status || []
  );
  const result = useTradingStore((state) => state.result);
  console.log("result.result.portfolio_status:", result.result.portfolio_status);
  console.log("portfolioStatus:", portfolioStatus);


  // PieChart용 데이터: symbol, share
  const pieData = portfolioStatus.map((item) => ({
    name: item.symbol,
    value: item.share,
  }));

  // 테이블용 데이터: symbol, qty, avg, now, profit_rate, total, profit
  // (portfolioStatus 그대로 사용)

  return (
    <div className="portfolio-container">
      <div className="portfolio-background">
        <div className="portfolio-layout">
          <Header />

          {/* Main Portfolio Content */}
          <div className="portfolio-main">
            <div className="portfolio-content">
              <div className="portfolio-widgets-container">
                {/* Portfolio Donut Chart */}
                <div className="portfolio-chart-widget">
                  <div className="portfolio-widget-title">
                    포트폴리오 비중
                  </div>
                  {pieData.length === 0 ? (
                    <div>포트폴리오 데이터가 없습니다.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={90}
                          outerRadius={150}
                          fill="#8884d8"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(1)}%`
                          }
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                        <Legend
                          verticalAlign="middle"
                          align="right"
                          layout="vertical"
                          iconType="circle"
                          wrapperStyle={{ fontSize: "16px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Portfolio Holdings Table */}
                <div className="portfolio-table-widget">
                  <div className="portfolio-widget-title">
                    보유 종목 상세 리스트
                  </div>
                  <div className="portfolio-table-container">
                    <div className="portfolio-table-header">
                      <div className="header-cell col-symbol">보유종목</div>
                      <div className="header-cell col-qty">보유량</div>
                      <div className="header-cell col-avg">평균단가</div>
                      <div className="header-cell col-current">현재가</div>
                      <div className="header-cell col-profit">수익률</div>
                      <div className="header-cell col-total">총 보유금액</div>
                      <div className="header-cell col-profit-amount">증감액</div>
                    </div>
                    {portfolioStatus.map((row) => (
                      <div className="portfolio-table-row" key={row.symbol}>
                        <div className="row-cell col-symbol symbol-cell">{row.symbol}</div>
                        <div className="row-cell col-qty">{row.qty?.toLocaleString()}</div>
                        <div className="row-cell col-avg">
                          {row.avg?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div className="row-cell col-current">
                          {row.now?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div
                          className={`row-cell col-profit ${
                            row.profit_rate >= 0 ? "profit-positive" : "profit-negative"
                          }`}
                        >
                          {row.profit_rate >= 0 ? "+" : ""}
                          {row.profit_rate?.toFixed(2)}%
                        </div>
                        <div className="row-cell col-total">
                          {row.total?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                        <div
                          className={`row-cell col-profit-amount ${
                            row.profit >= 0 ? "profit-positive" : "profit-negative"
                          }`}
                        >
                          {row.profit >= 0 ? "+" : ""}
                          {row.profit?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* 거래내역 및 사이드바 메트릭스 완전히 제거됨 */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
