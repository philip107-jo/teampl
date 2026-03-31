import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft, Database, Plus, Users, Calendar, Clock,
  CheckCircle2, AlertCircle, FileText, MessageSquare, MoreVertical, LayoutDashboard
} from "lucide-react";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  // Mock data for the specific project
  const project = {
    id: projectId,
    name: "데이터베이스 설계 프로젝트",
    course: "데이터베이스",
    description: "학생 관리 시스템 데이터베이스 설계 및 구현",
    progress: 75,
    deadline: "2026.03.20",
    members: [
      { id: 'user-1', name: "나 (팀장)", avatarColor: "bg-[#7C6CFF]" },
      { id: 'user-2', name: "김철수", avatarColor: "bg-[#23D7A1]" },
      { id: 'user-3', name: "이영희", avatarColor: "bg-[#FF6B7A]" },
      { id: 'user-4', name: "박민수", avatarColor: "bg-[#FFB547]" },
    ],
    theme: "blue",
    icon: Database,
  };

  const recentTasks = [
    { id: 1, title: "요구사항 명세서 작성", status: "완료", assignee: "이영희", date: "03.05" },
    { id: 2, title: "개념적 스키마 설계", status: "진행중", assignee: "나 (팀장)", date: "03.10" },
    { id: 3, title: "논리적 스키마 변환", status: "대기중", assignee: "김철수", date: "03.15" },
  ];

  const recentFiles = [
    { id: 1, name: "요구사항_명세서_v1.pdf", size: "2.4MB", uploader: "이영희", date: "03.05" },
    { id: 2, name: "ERD_초안_draft.png", size: "1.1MB", uploader: "나 (팀장)", date: "03.08" },
  ];

  return (
    <div className="dashboard pt-4">
      {/* Header Sticky */}
      <div className="hero-top mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/projects")}
            className="hero-action flex items-center justify-center p-0"
          >
            <ChevronLeft className="w-6 h-6 text-[#1A2340] dark:text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className={`schedule-item ${project.theme} !border-none !p-0 bg-transparent`}>
              <div className="schedule-icon" style={{ width: 44, height: 44, borderRadius: 12 }}>
                <project.icon className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="hero-meta">{project.course}</p>
              <h1 className="hero-title tracking-tight" style={{ fontSize: '1.4rem' }}>{project.name}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="hero-action p-0 text-[#1A2340] dark:text-white flex items-center justify-center border-none bg-transparent hover:bg-white/60 dark:bg-white/10 shadow-none">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Project Overview Card */}
      <section
        className="card hero-card mb-8 relative group cursor-pointer overflow-hidden transition-all"
        onClick={() => navigate(`/projects/${projectId}/members`)}
      >
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-[18px] font-black text-white uppercase tracking-[0.3em]">팀원 상세 보기</span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8 justify-between relative z-10">
          <div className="space-y-8 flex-1">
            <div>
              <h2 className="hero-title mb-3" style={{ fontSize: '2rem' }}>{project.name}</h2>
              <p className="text-[15px] text-[#7D879C] dark:text-white/60 font-medium leading-relaxed max-w-2xl">{project.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="schedule-item orange !p-0 !border-none !bg-transparent">
                  <div className="schedule-icon" style={{ width: 40, height: 40, borderRadius: 10 }}>
                    <Calendar className="w-5 h-5 text-[#1A2340] dark:text-white" />
                  </div>
                </div>
                <div>
                  <p className="hero-meta mb-1 uppercase">마감일</p>
                  <p className="text-[16px] font-black text-[#1A2340] dark:text-white">{project.deadline}</p>
                </div>
              </div>
              <div className="w-px h-12 bg-white/60 dark:bg-white/10"></div>
              <div>
                <p className="hero-meta mb-2 uppercase">참여 팀원</p>
                <div className="flex -space-x-3">
                  {project.members.map((member) => (
                    <div
                      key={member.id}
                      className={`w-10 h-10 rounded-full ${member.avatarColor} border-[3px] border-[#151C31] flex items-center justify-center text-[#1A2340] dark:text-white text-[13px] font-black shadow-md z-10 relative`}
                      title={member.name}
                    >
                      {member.name[0]}
                    </div>
                  ))}
                  <button className="w-10 h-10 rounded-full bg-white dark:bg-[#12182B] border-[3px] border-[#151C31] flex items-center justify-center text-[#7D879C] dark:text-white/60 hover:text-[#1A2340] dark:text-white hover:bg-white/60 dark:bg-white/10 transition-all shadow-md z-0 relative">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Circle Section */}
          <div className="bg-white dark:bg-[#12182B] rounded-[32px] p-8 flex flex-col items-center justify-center min-w-[220px] border border-gray-200 dark:border-white/5 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <div className="relative w-28 h-28 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                <circle
                  cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 - (301.6 * project.progress) / 100}
                  className="text-[#7C6CFF] shadow-[0_0_20px_rgba(124,108,255,0.6)]"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[28px] font-black text-[#1A2340] dark:text-white tracking-tight">{project.progress}%</span>
              </div>
            </div>
            <p className="hero-meta uppercase mt-1">전체 진척도</p>
          </div>
        </div>
      </section>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Tasks */}
        <div className="space-y-4">
          <div className="section-head">
            <div className="section-kicker">
              <span className="analysis-dot"></span>
              최근 작업
            </div>
            <button 
              onClick={() => navigate(`/projects/${projectId}/members`)}
              className="filter-btn !bg-transparent !border-none !text-[#7C6CFF] hover:!text-[#1A2340] dark:!text-white hover:underline transition-all !p-0"
            >
              전체보기
            </button>
          </div>

          <div className="card space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="p-5 rounded-[18px] bg-white/50 dark:bg-white/5 hover:bg-white/60 dark:bg-white/10 transition-all cursor-pointer flex items-center justify-between border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-3.5 h-3.5 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)] ${task.status === "완료" ? "bg-[#27D7A1] shadow-[#27D7A1]" :
                      task.status === "진행중" ? "bg-[#7C6CFF] shadow-[#7C6CFF]" : "bg-white/20"
                    }`}></div>
                  <div>
                    <h4 className="text-[15px] font-black text-[#1A2340] dark:text-white hover:text-[#7C6CFF] transition-colors">{task.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest mt-1">
                      <span>{task.assignee}</span>
                      <span className="opacity-30">•</span>
                      <span>{task.date} 업데이트</span>
                    </div>
                  </div>
                </div>
                <span className={`badge ${task.status === "완료" ? "!text-[#27D7A1] !bg-[#27D7A1]/10 !border-[#27D7A1]/20" :
                    task.status === "진행중" ? "!text-[#7C6CFF] !bg-[#7C6CFF]/10 !border-[#7C6CFF]/20" : "!text-[#7D879C]/80 dark:!text-white/40 !bg-white/50 dark:!bg-white/5 !border-gray-200 dark:!border-white/5"
                  }`}>
                  {task.status}
                </span>
              </div>
            ))}
            <button className="w-full p-4 rounded-[18px] border-2 border-dashed border-gray-300 dark:border-white/10 text-[#7D879C]/80 dark:text-white/40 hover:border-[#7C6CFF]/40 hover:text-[#7C6CFF] hover:bg-[#7C6CFF]/5 transition-all flex items-center justify-center gap-2 text-[13px] font-black uppercase mt-4 mb-1">
              <Plus className="w-5 h-5" />
              새 작업 추가
            </button>
          </div>
        </div>

        {/* Files & Discussions */}
        <div className="space-y-6">
          {/* Files */}
          <div className="space-y-4">
            <div className="section-head">
              <div className="section-kicker">
                <span className="analysis-dot" style={{ background: '#FFB547', boxShadow: '0 0 8px #FFB547' }}></span>
                파일 및 문서
              </div>
              <button onClick={() => navigate("/drive")} className="filter-btn !bg-transparent !border-none !text-[#FFB547] hover:!text-[#1A2340] dark:!text-white hover:underline transition-all !p-0">전체보기</button>
            </div>

            <div className="card space-y-3">
              {recentFiles.map((file) => (
                <div key={file.id} className="p-4 rounded-[18px] border border-gray-200 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:bg-white/60 dark:bg-white/10 hover:border-[#FFB547]/30 transition-all flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="schedule-item orange !p-0 !border-none !bg-transparent">
                      <div className="schedule-icon" style={{ width: 44, height: 44, borderRadius: 12 }}>
                        <FileText className="w-6 h-6 text-[#1A2340] dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[14px] font-black text-[#1A2340] dark:text-white hover:text-[#FFB547] transition-colors">{file.name}</p>
                      <p className="hero-meta mt-1">{file.size} • {file.uploader}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Chat Entry */}
          <div className="card !bg-gradient-to-br !from-[#7C6CFF]/40 !to-[#7C6CFF]/40 p-8 text-[#1A2340] dark:text-white shadow-[0_15px_40px_rgba(124,108,255,0.3)] relative overflow-hidden group transition-all hover:scale-[1.02] cursor-pointer border-none" onClick={() => navigate("/chat")}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-20 -mt-20 blur-2xl"></div>
            <MessageSquare className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-300 dark:text-white/20 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-[20px] font-black mb-3 tracking-tight">팀 채팅방 참여</h3>
              <p className="text-[13px] text-[#7D879C] dark:text-white/80 font-bold mb-6 max-w-[220px] leading-relaxed">이 프로젝트의 팀원들과<br />실시간으로 소통하세요.</p>
              <button
                className="px-6 py-2.5 bg-white text-[#7C6CFF] text-[13px] font-black uppercase rounded-[12px] shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] transition-all"
              >
                입장하기
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
