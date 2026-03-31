import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

// OpenAI 클라이언트 초기화 (키가 없으면 나중에 알림)
const openai = new OpenAI({
    apiKey: apiKey || 'dummy-key',
});

export class ChatService {
    static async suggestAssignmentPlan(assignmentDescription: string) {
        console.log("GPT 연동 테스트 - API 키 존재 여부:", !!process.env.OPENAI_API_KEY);
        if (!process.env.OPENAI_API_KEY) {
            // 키가 없는 경우 테스트를 위해 가상 응답을 반환하는 모드
            console.warn("OPENAI_API_KEY가 설정되지 않았습니다. 가이드용 가상 응답을 반환합니다.");
            return `[가이드 응답: OPENAI_API_KEY를 .env에 설정하시면 실제 AI 분석이 가능합니다.]\n\n과제 내용(${assignmentDescription})을 바탕으로 한 제안:\n\n📅 **제안 마일스톤**\n- 1주차: 기획 및 시장 분석\n- 2주차: 기술 스택 확정 및 초기 프로토타입\n- 3주차: 핵심 기능 고도화 및 테스트\n- 4주차: 최종 검수 및 산출물 정리\n\n👥 **제안 역할**\n- 과제 성격에 맞춰 팀원 간 공평하게 분배해 보세요!`;
        }

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `당신은 전문 팀 프로젝트 협업 도우미 챗봇 TeamSync AI입니다. 
                        사용자가 제공한 팀 프로젝트 과제 내용을 분석하여 최적의 '4주차 마일스톤(주차별 할일)'과 '팀원 역할 분산(팀장 포함)'을 구체적으로 제안하세요. 
                        결과는 마크다운 포맷을 사용하여 깔끔하고 가독성 좋게 답변하세요. 
                        답변에는 반드시 '📅 **제안 마일스톤**'과 '👥 **제안 역할**' 섹션이 포함되어야 합니다.`
                    },
                    {
                        role: "user",
                        content: `과제 내용: ${assignmentDescription}`
                    }
                ],
                temperature: 0.7,
            });

            return response.choices[0].message.content;
        } catch (error: any) {
            console.error('OpenAI API 호출 에러:', error);
            throw new Error(`AI 분석에 실패했습니다: ${error.message}`);
        }
    }
}
