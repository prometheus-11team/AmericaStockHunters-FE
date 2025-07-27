// 🌐 Zustand로 전역 상태 관리 (트레이딩 데이터 관리)

import { create } from 'zustand';

const useTradingStore = create((set, get) => ({
  // 트레이딩 결과 데이터
  result: null,
  
  // UI 상태
  loading: false,
  error: null,
  
  // 트레이딩 요청 파라미터
  tradingParams: {
    name: '',
    initialCapital: 100000,
    startDate: '',
    endDate: ''
  },
  
  // Actions
  setResult: (newResult) => set({ 
    result: newResult,
    loading: false,
    error: null 
  }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ 
    error,
    loading: false 
  }),
  
  setTradingParams: (params) => set({ 
    tradingParams: { ...get().tradingParams, ...params } 
  }),
  
  // 상태 초기화
  resetResult: () => set({ 
    result: null,
    loading: false,
    error: null 
  }),
  
  resetAll: () => set({ 
    result: null,
    loading: false,
    error: null,
    tradingParams: {
      name: '',
      initialCapital: 100000,
      startDate: '',
      endDate: ''
    }
  }),
  
  // 트레이딩 데이터 가져오기 (Main에서 사용)
  fetchTradingData: async (params) => {
    const state = get();
    
    // 이미 로딩 중이면 중복 호출 방지
    if (state.loading) {
      return { success: false, error: "이미 요청 중입니다." };
    }
    
    // 동일한 파라미터로 이미 데이터가 있으면 중복 호출 방지
    if (state.result && state.result.result) {
      return { success: true, data: state.result };
    }
    
    const { postTradingRequest } = await import('../api/tradingApi');
    
    set({ loading: true, error: null });
    
    try {
      const result = await postTradingRequest(params);
      
      if (result.status === "success") {
        set({ 
          result,
          loading: false,
          error: null 
        });
        return { success: true, data: result };
      } else {
        const errorMessage = result.message || "알 수 없는 오류";
        set({ 
          error: errorMessage,
          loading: false 
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("API 호출 실패:", error);
      const errorMessage = "네트워크 오류가 발생했습니다. 백엔드 서버를 확인해주세요.";
      set({ 
        error: errorMessage,
        loading: false 
      });
      return { success: false, error: errorMessage };
    }
  }
}));

export default useTradingStore;