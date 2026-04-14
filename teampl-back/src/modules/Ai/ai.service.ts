import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AiService = {
  splitTasks: async (description: string) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing in .env');
    }

    const prompt = `
당신은 프로젝트 관리 전문가입니다. 사용자가 제공하는 과제 설명(description)을 분석하여, 5개에서 10개 사이의 구체적이고 실행 가능한 태스크(Task)로 분할해 주세요.

분석 기준:
1. 태스크는 팀원들이 바로 착수할 수 있을 정도로 구체적이어야 합니다.
2. 각 태스크에 대해 적절한 우선순위(high, medium, low)를 지정하세요.
3. 각 태스크의 난이도(difficulty)를 1(매우 쉬움)에서 5(매우 어려움) 사이의 숫자로 지정하세요.
4. 마감일(deadline)은 오늘부터 며칠 뒤가 적당할지 계산하여 YYYY-MM-DD 형식으로 제안하세요. (오늘 날짜: ${new Date().toISOString().split('T')[0]})

응답 형식:
반드시 아래와 같은 순수한 JSON 배열 형식으로만 응답하세요. 다른 설명이나 텍스트는 포함하지 마세요.

[
  {
    "title": "태스크 제목",
    "priority": "high" | "medium" | "low",
    "difficulty": 1 ~ 5,
    "deadline": "YYYY-MM-DD"
  }
]

과제 설명:
${description}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 또는 gpt-4o
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('AI 응답이 비어있습니다.');
    
    // JSON 파싱 (AI가 객체로 감싸서 줄 수도 있으므로 체크)
    let tasks = JSON.parse(content);
    if (tasks.tasks) tasks = tasks.tasks; // { "tasks": [...] } 형태 대응
    if (!Array.isArray(tasks)) tasks = [tasks];

    return tasks;
  }
};
