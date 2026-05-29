export interface StageConfig {
  id: number;
  title: string;
  description: string;
  keywords: string[];
}

export const DEFAULT_STAGES: StageConfig[] = [
  {
    id: 1,
    title: '주제 선정',
    description: '조사 주제 및 가설 수립',
    keywords: ['주제', '가설', '기획', '아이디어', '목표', '선정', '범위', '기본', '주제선정'],
  },
  {
    id: 2,
    title: '설문 설계',
    description: '설문지 및 인터뷰 문항 작성',
    keywords: ['설문', '인터뷰', '질문', '설계', '피드백', '질의', '문항', '설문지'],
  },
  {
    id: 3,
    title: '데이터 수집',
    description: '설문 배포 및 응답 확보',
    keywords: ['수집', '배포', '응답', '확보', '설문조사', '크롤링', '획득', '데이터', '자료', '조사', '논문'],
  },
  {
    id: 4,
    title: '분석',
    description: 'SPSS 및 통계 분석 진행',
    keywords: ['분석', 'spss', '통계', '결과', '코딩', '분석 진행', '차트', '해석', '검증'],
  },
  {
    id: 5,
    title: '발표준비',
    description: '발표 및 PPT 준비',
    keywords: ['발표', 'ppt', '대본', '스크립트', '제작', '피피티', '녹음', '연습', '최종', '발표준비'],
  }
];

export function getTaskStageId(taskTitle: string, taskDesc: string): number {
  const title = (taskTitle || '').toLowerCase();
  const desc = (taskDesc || '').toLowerCase();
  const fullText = `${title} ${desc}`;

  const match = fullText.match(/\[(?:stage:?)?(\d+)단계?\]/i) || fullText.match(/\[stage(\d+)\]/i);
  if (match) return parseInt(match[1], 10);

  // Reverse keyword scanning for intelligent automated categorization
  for (let i = DEFAULT_STAGES.length - 1; i >= 0; i--) {
    const stage = DEFAULT_STAGES[i];
    if (stage.keywords.some(k => fullText.includes(k))) {
      return stage.id;
    }
  }
  return 3; // 기본값: 데이터 수집 (기존 로직과 동일)
}
