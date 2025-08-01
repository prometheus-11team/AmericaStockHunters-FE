// 🔁 FastAPI와 통신하는 함수 (POST /api/v1/trades)

import axios from 'axios';

export const postTradingRequest = async (requestData) => {
  console.log('API 요청 데이터:', requestData);
  
  try {
    const res = await axios.post('http://localhost:8000/api/v1/trades', requestData);
    console.log('API 응답:', res.data);
    return res.data;
  } catch (error) {
    console.error('API 요청 실패:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * GET /api/v1/nasdaq?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export const fetchNasdaqData = async ({ startDate, endDate }) => {
  try {
    const res = await axios.get('http://localhost:8000/api/v1/nasdaq', {
      params: { startDate, endDate }
    });
    return res.data;
  } catch (error) {
    console.error('fetchNasdaqData error:', error.response?.data || error.message);
    throw error;
  }
};