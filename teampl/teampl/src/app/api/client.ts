/// <reference types="vite/client" />
import axios from 'axios';

// Vite 환경 변수에서 기본 API 주소를 가져옵니다. 
// (.env 파일에 VITE_API_BASE_URL이 정의되어 있어야 함)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// 전역 Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청(Request) 인터셉터
// - 백엔드로 요청을 보내기 "직전"에 무언가(예: 로그인 토큰)를 가로채서 넣을 때 사용합니다.
apiClient.interceptors.request.use(
  (config) => {
    // 예시: localStorage에서 JWT 토큰을 꺼내서 헤더에 담기
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const userStr = localStorage.getItem('user');
    if (userStr && config.headers) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.email) {
          config.headers['X-User-Email'] = user.email;
        }
      } catch (e) { }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답(Response) 인터셉터
// - 백엔드에서 응답이 돌아온 "직후" (컴포넌트에 도달하기 전)에 공통 에러 처리를 할 때 사용합니다.
apiClient.interceptors.response.use(
  (response) => {
    // 요청이 성공적인 경우 그대로 응답 반환
    return response;
  },
  (error) => {
    // 예시: 401 권한 없음 에러가 오면 강제 로그아웃 처리
    if (error.response?.status === 401) {
      console.error("인증이 만료되었습니다. 다시 로그인해주세요.");
      // 여기서 상태 관리 도구나 window.location.href 등을 통해 로그인 페이지로 이동시킬 수 있음
    }
    return Promise.reject(error);
  }
);
