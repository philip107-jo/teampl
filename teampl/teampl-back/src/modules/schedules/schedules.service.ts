export interface Schedule {
  id: number;
  title: string;
  project: string;
  date: string;
  endDate?: string;
  type: string;
  color: string;
  dot: string;
}

let mockSchedules: Schedule[] = [
  { id: 1, title: "ERD 다이어그램 제출", project: "데이터베이스 설계", date: "2026-03-12", type: "deadline", color: "bg-red-500", dot: "bg-red-500" },
  { id: 2, title: "UI 프로토타입 리뷰 미팅", project: "모바일 앱 개발", date: "2026-03-13", type: "meeting", color: "bg-blue-500", dot: "bg-blue-500" },
  { id: 3, title: "웹 서비스 최종 발표", project: "웹 서비스 기획", date: "2026-03-15", type: "presentation", color: "bg-purple-500", dot: "bg-purple-500" },
  { id: 4, title: "중간 발표 자료 제출", project: "데이터베이스 설계", date: "2026-03-16", type: "deadline", color: "bg-red-500", dot: "bg-red-500" },
  { id: 5, title: "데이터셋 전처리 완료", project: "AI 모델 구현", date: "2026-03-15", type: "milestone", color: "bg-green-500", dot: "bg-green-500" },
];

let userSchedulesStore: Record<string, Schedule[]> = {
  'test@naver.com': [...mockSchedules]
};

export const SchedulesService = {
  getAll: (email: string) => {
    if (email === 'test@naver.com') return userSchedulesStore['test@naver.com'];
    return userSchedulesStore[email] || [];
  },

  create: (email: string, data: Partial<Schedule>) => {
    if (!userSchedulesStore[email]) {
      if (email === 'test@naver.com') userSchedulesStore[email] = [...mockSchedules];
      else userSchedulesStore[email] = [];
    }
    const schedules = userSchedulesStore[email];
    const newId = schedules.length > 0 ? Math.max(...schedules.map(s => s.id)) + 1 : 1;

    let color = "bg-gray-500";
    if (data.type === 'deadline') color = "bg-red-500";
    if (data.type === 'meeting') color = "bg-blue-500";
    if (data.type === 'presentation') color = "bg-purple-500";
    if (data.type === 'milestone') color = "bg-green-500";

    const newSchedule: Schedule = {
      id: newId,
      title: data.title || '새 일정',
      project: data.project || '개인 일정',
      date: data.date || new Date().toISOString().split('T')[0],
      endDate: data.endDate || data.date || new Date().toISOString().split('T')[0],
      type: data.type || 'other',
      color: data.color || color,
      dot: data.dot || color
    };

    userSchedulesStore[email] = [...schedules, newSchedule];
    return newSchedule;
  },

  update: (email: string, id: number, data: Partial<Schedule>) => {
    const schedules = userSchedulesStore[email] || [];
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    let color = schedules[index].color;
    let dot = schedules[index].dot;
    if (data.type) {
      if (data.type === 'deadline') color = "bg-red-500";
      else if (data.type === 'meeting') color = "bg-blue-500";
      else if (data.type === 'presentation') color = "bg-purple-500";
      else if (data.type === 'milestone') color = "bg-green-500";
      else color = "bg-gray-500";
      dot = color;
    }

    const updated = {
      ...schedules[index],
      ...data,
      color: data.color || color,
      dot: data.dot || dot,
      endDate: data.endDate || data.date || schedules[index].endDate || schedules[index].date
    };
    schedules[index] = updated;
    return updated;
  },

  delete: (email: string, id: number) => {
    const schedules = userSchedulesStore[email] || [];
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) return false;
    schedules.splice(index, 1);
    return true;
  }
};
