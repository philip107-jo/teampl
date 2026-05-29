/// <reference types="vite/client" />
import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

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

// AI 전용 Axios 인스턴스 (GPT 응답이 오래 걸리므로 60초 타임아웃)
export const aiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60초 타임아웃
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청(Request) 인터셉터
// - 백엔드로 요청을 보내기 "직전"에 무언가(예: 로그인 토큰)를 가로채서 넣을 때 사용합니다.
const requestInterceptor = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};
const requestErrorInterceptor = (error: any) => Promise.reject(error);

const responseInterceptor = (response: AxiosResponse) => response;
const responseErrorInterceptor = (error: AxiosError) => {
  if (error.response?.status === 401) {
    console.error("인증이 만료되었습니다. 다시 로그인해주세요.");
  }
  return Promise.reject(error);
};

// apiClient 인터셉터
apiClient.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
apiClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

// aiClient 인터셉터 (동일한 JWT 주입 + 에러 처리)
aiClient.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
aiClient.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

