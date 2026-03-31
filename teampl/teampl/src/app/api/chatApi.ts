import { apiClient } from './client';

export interface ChatSuggestionResponse {
    suggestion: string;
}

export const chatApi = {
    /**
     * AI에게 과제 분석 및 제안을 요청합니다.
     * @param content 사용자가 입력한 과제 내용
     */
    suggestAssignment: async (content: string): Promise<string> => {
        try {
            const response = await apiClient.post<ChatSuggestionResponse>('/chat/suggest', { content });
            return response.data.suggestion;
        } catch (error) {
            console.error('AI Suggestion API Error:', error);
            throw new Error('AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
    }
};
