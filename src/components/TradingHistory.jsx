import React, { useEffect, useState } from "react";
import "./TradingHistory.css";
import Header from "./Header";
import useTradingStore from "../store/useTradingStore";

const TradingHistory = () => {
  const { loading, error } = useTradingStore();
  const [sortConfig, setSortConfig] = useState({ key: 'datetime', direction: 'desc' });
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Zustand store에서 데이터 가져오기
  const result = useTradingStore((state) => state.result);

  // result에서 transactions 데이터 추출
  const transactions = result?.result?.transactions || [];

  // 정렬 함수
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'datetime') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortConfig.key === 'quantity' || sortConfig.key === 'price') {
        aValue = parseFloat(aValue.replace(/[^0-9.-]+/g, ''));
        bValue = parseFloat(bValue.replace(/[^0-9.-]+/g, ''));
      } else if (sortConfig.key === 'symbol' || sortConfig.key === 'type') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // 필터링 함수
  const filterData = (data) => {
    let filtered = data;

    // 타입 필터링
    if (filterType !== 'all') {
      filtered = filtered.filter(trade => 
        trade.type.toLowerCase() === filterType.toLowerCase()
      );
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(trade =>
        trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trade.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // 정렬 핸들러
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 필터링된 데이터
  const filteredAndSortedData = filterData(sortData(transactions));

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="trading-history-bg">
        <Header />
        <main className="trading-history-main">
          <div className="trading-history-container">
            <div className="trading-history-title">
              <span>Trading History</span>
            </div>
            <div className="loading-message">
              거래 내역을 불러오는 중...
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="trading-history-bg">
        <Header />
        <main className="trading-history-main">
          <div className="trading-history-container">
            <div className="trading-history-title">
              <span>Trading History</span>
            </div>
            <div className="error-message">
              오류: {error}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!transactions || transactions.length === 0) {
    return (
      <div className="trading-history-bg">
        <Header />
        <main className="trading-history-main">
          <div className="trading-history-container">
            <div className="trading-history-title">
              <span>Trading History</span>
            </div>
            <div className="no-data-message">
              거래 내역이 없습니다. 먼저 거래를 실행해주세요.
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="trading-history-bg">
      <Header />
      <main className="trading-history-main">
        <div className="trading-history-container">
          <div className="trading-history-title">
            <span>Trading History</span>
          </div>
          <div className="trading-history-controls">
            <div className="search-filter-container">
              <input
                type="text"
                placeholder="자산명 또는 거래 타입으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">모든 거래</option>
                <option value="buy">매수</option>
                <option value="sell">매도</option>
              </select>
            </div>
            <div className="results-info">
              총 {filteredAndSortedData.length}건의 거래 내역
            </div>
          </div>
          <div className="trading-history-table">
            <div className="table-header">
              <div 
                className="header-cell sortable" 
                onClick={() => handleSort('datetime')}
              >
                Date/Time
                {sortConfig.key === 'datetime' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div 
                className="header-cell sortable" 
                onClick={() => handleSort('symbol')}
              >
                Asset
                {sortConfig.key === 'symbol' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div 
                className="header-cell sortable" 
                onClick={() => handleSort('type')}
              >
                Type
                {sortConfig.key === 'type' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div 
                className="header-cell sortable" 
                onClick={() => handleSort('quantity')}
              >
                Quantity
                {sortConfig.key === 'quantity' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div 
                className="header-cell sortable" 
                onClick={() => handleSort('price')}
              >
                Price
                {sortConfig.key === 'price' && (
                  <span className="sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div className="header-cell">Profit/Loss</div>
            </div>
            <div className="table-body">
              {filteredAndSortedData.map((trade, index) => (
                <div key={index} className="table-row">
                  <div className="table-cell datetime-cell">{trade.datetime}</div>
                  <div className="table-cell asset-cell">{trade.symbol}</div>
                  <div className={`table-cell type-cell ${trade.type.toLowerCase() === 'buy' || trade.type.toLowerCase() === '매수' ? 'buy-type' : 'sell-type'}`}>
                    {trade.type}
                  </div>
                  <div className="table-cell quantity-cell">{trade.quantity}</div>
                  <div className="table-cell price-cell">${trade.price}</div>
                  <div className={`table-cell profit-cell ${trade.profitLoss ? (parseFloat(trade.profitLoss) >= 0 ? 'profit-positive' : 'profit-negative') : ''}`}>
                    {trade.profitLoss ? (parseFloat(trade.profitLoss) >= 0 ? `+ $${trade.profitLoss}` : `- $${Math.abs(parseFloat(trade.profitLoss))}`) : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TradingHistory;
