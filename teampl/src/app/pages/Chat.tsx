import { useState, useRef, useEffect } from "react";
import {
  Send,
  Plus,
  MoreVertical,
  Search,
  Paperclip,
  Smile,
  Hash,
  Database,
  Zap,
  BarChart3,
  Target,
  Users,
  ChevronRight,
  MessageSquare,
  ChevronLeft,
  User as UserIcon,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  X,
  Menu
} from "lucide-react";

// Mock Projects Data
const projects = [
  {
    id: 1,
    name: "데이터베이스 설계 프로젝트",
    course: "데이터베이스",
    icon: Database,
    theme: "blue",
  },
  {
    id: 2,
    name: "모바일 앱 개발",
    course: "소프트웨어공학",
    icon: Zap,
    theme: "green",
  },
  {
    id: 3,
    name: "AI 모델 구현",
    course: "인공지능",
    icon: BarChart3,
    theme: "purple",
  },
  {
    id: 4,
    name: "웹 서비스 기획",
    course: "창업과 경영",
    icon: Target,
    theme: "orange",
  },
];

// Mock Members
const members = [
  {
    id: 1, name: "나 (팀장)", role: "팀장", avatarColor: "bg-[#7C6CFF]", status: "활동중",
    email: "leader@university.ac.kr", phone: "010-1234-5678", department: "컴퓨터공학과", joinDate: "2024.03.01",
    skills: ["Python", "React", "데이터베이스"], projects: 2, completedTasks: 18, contribution: 95, activityScore: 95
  },
  {
    id: 2, name: "김철수", role: "팀원", avatarColor: "bg-[#23D7A1]", status: "활동중",
    email: "chulsoo@university.ac.kr", phone: "010-2345-6789", department: "학부 미정학과", joinDate: "2024.03.01",
    skills: ["UI/UX", "Figma", "디자인"], projects: 2, completedTasks: 15, contribution: 82, activityScore: 82
  },
  {
    id: 3, name: "이영희", role: "팀원", avatarColor: "bg-[#FF6B7A]", status: "활동중",
    email: "younghee@university.ac.kr", phone: "010-3456-7890", department: "학부 미정학과", joinDate: "2024.03.02",
    skills: ["AI/ML", "TensorFlow", "데이터분석"], projects: 2, completedTasks: 18, contribution: 78, activityScore: 78
  },
  {
    id: 4, name: "박민수", role: "팀원", avatarColor: "bg-[#FFB547]", status: "휴식중",
    email: "minsoo@university.ac.kr", phone: "010-4567-8901", department: "학부 미정학과", joinDate: "2024.03.02",
    skills: ["비즈니스", "기획", "마케팅"], projects: 2, completedTasks: 15, contribution: 71, activityScore: 71
  },
];

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
}

type NavStep = "LIST" | "CHAT";
type ChatMode = "TEAM" | "INDIVIDUAL";

function ProfileModal({ selectedMember, onClose, onMessage }: { selectedMember: any, onClose: () => void, onMessage: () => void }) {
  if (!selectedMember) return null;
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg !p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-gray-300 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-white/50 dark:bg-white/7 text-[#7D879C]/80 dark:text-white/40 rounded-2xl hover:bg-white/60 dark:bg-white/10 hover:text-[#1A2340] dark:text-white transition-all z-20"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-start justify-between relative z-10 mt-2">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className={`w-24 h-24 rounded-[32px] ${selectedMember.avatarColor} flex items-center justify-center text-[#1A2340] dark:text-white text-[32px] font-black shadow-[0_0_20px_rgba(0,0,0,0.4)]`}>
                {selectedMember.name[0]}
              </div>
              <div className={`absolute -bottom-1 -right-0.5 w-6 h-6 ${selectedMember.status === '활동중' ? 'bg-[#23D7A1]' : 'bg-white/30'} border-[5px] border-[#12182B] rounded-full shadow-lg`}></div>
            </div>
            <div>
              <h3 className="hero-title tracking-tight mb-2" style={{ fontSize: '1.8rem' }}>{selectedMember.name}</h3>
              <span className={`inline-block px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest ${selectedMember.role === '팀장' ? 'bg-[#7C6CFF] text-white shadow-[0_0_15px_rgba(124,108,255,0.4)]' : 'bg-white/50 dark:bg-white/5 text-[#7D879C]/80 dark:text-white/40'}`}>
                {selectedMember.role}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 relative z-10 mt-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-[13px] text-[#7D879C] dark:text-white/60 font-black bg-white/40 dark:bg-[#1A2340] border border-gray-200 dark:border-white/5 p-4 rounded-2xl">
              <Mail className="w-4 h-4 text-[#7D879C]/80 dark:text-white/30" />
              {selectedMember.email}
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#7D879C] dark:text-white/60 font-black bg-white/40 dark:bg-[#1A2340] border border-gray-200 dark:border-white/5 p-4 rounded-2xl">
              <Phone className="w-4 h-4 text-[#7D879C]/80 dark:text-white/30" />
              {selectedMember.phone}
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#7D879C] dark:text-white/60 font-black bg-white/40 dark:bg-[#1A2340] border border-gray-200 dark:border-white/5 p-4 rounded-2xl">
              <GraduationCap className="w-4 h-4 text-[#7D879C]/80 dark:text-white/30" />
              {selectedMember.department}
            </div>
            <div className="flex items-center gap-3 text-[13px] text-[#7D879C] dark:text-white/60 font-black bg-white/40 dark:bg-[#1A2340] border border-gray-200 dark:border-white/5 p-4 rounded-2xl">
              <Calendar className="w-4 h-4 text-[#7D879C]/80 dark:text-white/30" />
              가입: {selectedMember.joinDate}
            </div>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <div>
            <p className="hero-meta mb-3">보유 스킬</p>
            <div className="flex flex-wrap gap-2">
              {selectedMember.skills.map((skill: string, i: number) => (
                <span key={i} className="px-3.5 py-2 bg-[#7C6CFF]/10 text-[#7C6CFF] text-[11px] font-black rounded-xl border border-[#7C6CFF]/20 uppercase tracking-widest">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-6 border-y border-gray-200 dark:border-white/5">
            <div className="text-center">
              <p className="hero-meta mb-1">프로젝트</p>
              <p className="text-[18px] font-black text-[#1A2340] dark:text-white">{selectedMember.projects}</p>
            </div>
            <div className="text-center border-x border-gray-200 dark:border-white/5">
              <p className="hero-meta mb-1">완료 작업</p>
              <p className="text-[18px] font-black text-[#1A2340] dark:text-white">{selectedMember.completedTasks}</p>
            </div>
            <div className="text-center">
              <p className="hero-meta mb-1">기여도</p>
              <p className="text-[20px] font-black text-[#7C6CFF] drop-shadow-[0_0_10px_rgba(124,108,255,0.4)]">{selectedMember.contribution}%</p>
            </div>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="hero-meta">활동 점수</span>
              <span className="text-[15px] font-black text-[#1A2340] dark:text-white tracking-tight">{selectedMember.activityScore}/100</span>
            </div>
            <div className="w-full bg-white/40 dark:bg-[#1A2340] rounded-full h-3 overflow-hidden border border-gray-200 dark:border-white/5">
              <div className="bg-[#7C6CFF] h-full rounded-full shadow-[0_0_15px_rgba(124,108,255,0.6)]" style={{ width: `${selectedMember.activityScore}%` }}></div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={onMessage}
              className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl text-[15px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,108,255,0.3)] flex items-center justify-center gap-3 transition-all active:scale-[0.98] hover:opacity-90 border border-[#7C6CFF]/50"
            >
              <MessageSquare className="w-6 h-6" />
              1:1 메시지 보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [navStep, setNavStep] = useState<NavStep>("LIST");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>("TEAM");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock messages
  const [messagesStore, setMessagesStore] = useState<Record<string, Message[]>>({
    "team-1": [
      { id: "1", sender: "김철수", content: "데이터베이스 스키마 초안 공유합니다!", time: "오전 10:30", isMe: false },
      { id: "2", sender: "나 (팀장)", content: "확인해볼게요.", time: "오전 10:32", isMe: true },
    ],
    "user-2": [
      { id: "1", sender: "김철수", content: "팀장님, 아까 말한 정규화 관련해서 질문있습니다.", time: "오후 1:10", isMe: false },
    ],
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedMember = members.find(m => m.id === selectedMemberId);

  const currentChatKey = chatMode === "TEAM"
    ? `team-${selectedProjectId}`
    : `user-${selectedMemberId}`;

  const currentMessages = messagesStore[currentChatKey] || [];

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (navStep === "CHAT") {
      scrollToBottom();
    }
  }, [navStep, messagesStore]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "나 (팀장)",
      content: inputText,
      time: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }),
      isMe: true
    };

    setMessagesStore({
      ...messagesStore,
      [currentChatKey]: [...currentMessages, newMessage]
    });
    setInputText("");
  };

  if (navStep === "LIST") {
    return (
      <div className="dashboard pt-4 lg:max-w-5xl lg:mx-auto relative">
        {profileModalOpen && selectedMember && (
          <ProfileModal 
            selectedMember={selectedMember} 
            onClose={() => setProfileModalOpen(false)} 
            onMessage={() => {
              setChatMode("INDIVIDUAL");
              setNavStep("CHAT");
              setProfileModalOpen(false);
            }} 
          />
        )}
        
        <section className="card hero-card mb-6 flex-shrink-0">
          <div className="hero-top" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
            <div>
              <p className="hero-meta uppercase">팀 채널 및 멤버</p>
              <h1 className="hero-title" style={{ fontSize: '2rem' }}>
                채팅
              </h1>
            </div>
          </div>
        </section>

        <div className="space-y-8 pb-24">
          {/* 팀 채널 섹션 */}
          <div className="space-y-4">
            <h3 className="hero-meta px-1 flex items-center gap-2">
              <Users className="w-4 h-4" /> 팀 채널
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setChatMode("TEAM");
                    setNavStep("CHAT");
                  }}
                  className="card !p-5 hover:bg-white/40 dark:bg-[#1A2340] cursor-pointer group flex items-center gap-5 border border-gray-200 dark:border-white/5 active:scale-[0.98] transition-all text-left"
                >
                  <div className={`schedule-item ${project.theme} !p-0 !border-none bg-transparent flex-shrink-0`}>
                    <div className="schedule-icon" style={{ width: 56, height: 56, borderRadius: 16 }}>
                      <project.icon className="w-7 h-7 text-[#1A2340] dark:text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-black text-[#1A2340] dark:text-white truncate mb-1 group-hover:text-[#7C6CFF] transition-colors">{project.name}</p>
                    <p className="text-[12px] font-black text-[#7D879C]/80 dark:text-white/40 truncate uppercase tracking-widest">전체 팀원 채팅</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-white/5 group-hover:bg-[#7C6CFF]/20 transition-colors">
                    <ChevronRight className="w-5 h-5 text-[#7D879C]/80 dark:text-white/40 group-hover:text-[#7C6CFF] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 1:1 메시지 섹션 */}
          <div className="space-y-4">
            <h3 className="hero-meta px-1 flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> 1:1 메시지
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.filter(m => m.id !== 1).map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedMemberId(member.id);
                    setProfileModalOpen(true);
                  }}
                  className="card !p-5 hover:bg-white/40 dark:bg-[#1A2340] cursor-pointer group flex items-center gap-5 border border-gray-200 dark:border-white/5 active:scale-[0.98] transition-all text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-[20px] ${member.avatarColor} flex items-center justify-center text-[#1A2340] dark:text-white text-[20px] font-black shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                      {member.name[0]}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${member.status === '활동중' ? 'bg-[#23D7A1] shadow-[0_0_10px_rgba(35,215,161,0.4)]' : 'bg-white/30'} border-[4px] border-[#12182B] rounded-full`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-black text-[#1A2340] dark:text-white truncate mb-1 group-hover:text-[#7C6CFF] transition-colors">{member.name}</p>
                    <p className="text-[12px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest">{member.status === '활동중' ? '현재 활동 중' : '휴식 중'} • {member.role}</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/50 dark:bg-white/5 group-hover:bg-[#7C6CFF]/20 transition-colors">
                    <ChevronRight className="w-5 h-5 text-[#7D879C]/80 dark:text-white/40 group-hover:text-[#7C6CFF] transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3단계: 채팅창
  return (
    <div className="flex flex-col h-screen bg-[#f8faff] dark:bg-[#0B1020] overflow-hidden relative transition-all duration-300">
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#12182B]/90 backdrop-blur-md sticky top-0 z-10 transition-all">
        <div className="flex items-center gap-4">
          <button onClick={() => setNavStep("LIST")} className="p-2.5 -ml-2 text-[#7D879C]/80 dark:text-white/40 hover:bg-white/50 dark:bg-white/5 rounded-2xl transition-all"><ChevronLeft className="w-7 h-7" /></button>
          <div className="flex items-center gap-4">
            {chatMode === "TEAM" ? (
              <div className={`schedule-item ${selectedProject?.theme} !p-0 !border-none bg-transparent flex-shrink-0`}>
                <div className="schedule-icon" style={{ width: 48, height: 48, borderRadius: 14 }}>
                  {selectedProject && <selectedProject.icon className="w-6 h-6 text-[#1A2340] dark:text-white" />}
                </div>
              </div>
            ) : (
              <div className={`w-12 h-12 rounded-[14px] ${selectedMember?.avatarColor} flex items-center justify-center text-[#1A2340] dark:text-white font-black text-[16px] shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                {selectedMember?.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-[17px] font-black text-[#1A2340] dark:text-white tracking-tight leading-none mb-1.5 truncate max-w-[180px]">
                {chatMode === "TEAM" ? selectedProject?.name : `${selectedMember?.name}님`}
              </h1>
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[#23D7A1] drop-shadow-[0_0_8px_rgba(35,215,161,0.5)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#23D7A1] animate-pulse"></div>
                {chatMode === "TEAM" ? "실시간 팀 소통 중" : "1:1 프라이빗 대화"}
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => chatMode === "TEAM" ? setIsDrawerOpen(true) : null} 
          className="p-3 text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:text-white hover:bg-white/50 dark:bg-white/5 rounded-2xl transition-all"
        >
          {chatMode === "TEAM" ? <Menu className="w-7 h-7" /> : <MoreVertical className="w-6 h-6" />}
        </button>
      </div>

      {/* TEAM MEMBERS DRAWER (OVERLAY) */}
      {isDrawerOpen && chatMode === "TEAM" && (
        <>
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="absolute top-0 right-0 bottom-0 w-[300px] bg-white dark:bg-[#12182B] z-50 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right border-l border-gray-200 dark:border-white/5">
             <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-[#1A2340]">
               <h3 className="font-black text-[#1A2340] dark:text-white text-[17px] tracking-tight">참여 팀원 ({members.length})</h3>
               <button onClick={() => setIsDrawerOpen(false)} className="p-2.5 bg-white/50 dark:bg-white/5 rounded-xl hover:bg-white/60 dark:bg-white/10 transition-all"><X className="w-5 h-5 text-[#7D879C]/80 dark:text-white/40" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#f8faff] dark:bg-[#0B1020] transition-all">
               {members.map(member => (
                 <button 
                   key={member.id}
                   onClick={() => {
                      setSelectedMemberId(member.id);
                      setProfileModalOpen(true);
                   }}
                   className="w-full flex items-center gap-4 p-4 card !bg-white dark:!bg-[#12182B] hover:!bg-white/40 dark:!bg-[#1A2340] border border-gray-200 dark:border-white/5 !rounded-[24px] cursor-pointer group text-left"
                 >
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-[16px] ${member.avatarColor} flex items-center justify-center text-[#1A2340] dark:text-white text-[15px] font-black shadow-sm`}>
                        {member.name[0]}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 ${member.status === '활동중' ? 'bg-[#23D7A1]' : 'bg-white/30'} border-[3px] border-[#12182B] rounded-full`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-black text-[#1A2340] dark:text-white truncate group-hover:text-[#7C6CFF] transition-colors">{member.name}</p>
                      <p className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest truncate">{member.role}</p>
                    </div>
                 </button>
               ))}
             </div>
          </div>
        </>
      )}

      {/* PROFILE MODAL IN CHAT */}
      {profileModalOpen && selectedMember && (
        <ProfileModal 
          selectedMember={selectedMember} 
          onClose={() => setProfileModalOpen(false)} 
          onMessage={() => {
            setChatMode("INDIVIDUAL");
            setNavStep("CHAT");
            setProfileModalOpen(false);
            setIsDrawerOpen(false);
          }} 
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 transition-all scrollbar-hide">
        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-6">
            <div className={`schedule-item ${chatMode === "TEAM" ? selectedProject?.theme : "purple"} !p-0 !border-none bg-transparent flex-shrink-0 animate-in zoom-in-50 duration-500`}>
              <div className="schedule-icon" style={{ width: 112, height: 112, borderRadius: 40 }}>
                {chatMode === "TEAM" ? (
                  selectedProject && <selectedProject.icon className="w-12 h-12 text-[#1A2340] dark:text-white" />
                ) : (
                  <UserIcon className="w-12 h-12 text-[#1A2340] dark:text-white" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[22px] font-black text-[#1A2340] dark:text-white tracking-tight">{chatMode === "TEAM" ? "팀원들과 첫 메시지를 나누어보세요" : `${selectedMember?.name}님과 대화를 시작하세요`}</p>
              <p className="text-[15px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest leading-loose">함께 협업하며 프로젝트를 완성해보세요.</p>
            </div>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} items-start gap-4 animate-in slide-in-from-bottom-2`}>
              {!msg.isMe && (
                <div className={`w-10 h-10 rounded-[14px] ${selectedMember?.avatarColor || 'bg-[#7C6CFF]'} text-white flex items-center justify-center text-[15px] font-black shadow-[0_0_15px_rgba(0,0,0,0.2)] flex-shrink-0 mt-1 uppercase`}>
                  {msg.sender[0]}
                </div>
              )}
              <div className={`max-w-[70%] space-y-2 ${msg.isMe ? "flex flex-col items-end" : ""}`}>
                {!msg.isMe && <p className="text-[12px] font-black text-[#7D879C] dark:text-white/80 ml-1 uppercase tracking-widest">{msg.sender}</p>}
                <div className={`flex items-end gap-3 ${msg.isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`px-5 py-3.5 rounded-[24px] text-[15px] font-medium transition-all shadow-sm leading-relaxed break-words ${msg.isMe ? "bg-[#7C6CFF] text-white rounded-br-none shadow-[0_0_20px_rgba(124,108,255,0.4)] border border-[#7C6CFF]/50" : "bg-white/40 dark:bg-[#1A2340] text-white rounded-bl-none border border-gray-300 dark:border-white/10"}`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] font-black text-[#7D879C]/80 dark:text-white/40 mb-1 whitespace-nowrap uppercase tracking-widest">{msg.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-5 bg-white dark:bg-[#12182B] border-t border-gray-200 dark:border-white/5 transition-all">
        <div className="flex items-center gap-3 bg-white/40 dark:bg-[#1A2340] border border-gray-300 dark:border-white/10 rounded-3xl pl-3 pr-2 py-2 group focus-within:bg-white/40 dark:bg-[#1A2340] focus-within:border-[#7C6CFF]/50 focus-within:shadow-[0_0_15px_rgba(124,108,255,0.1)] transition-all">
          <button className="p-3 text-[#7D879C]/80 dark:text-white/40 hover:text-[#7C6CFF] transition-colors flex-shrink-0"><Plus className="w-7 h-7" /></button>
          <input
            type="text"
            placeholder="메시지 입력..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] font-medium py-2 placeholder-white/20 text-[#1A2340] dark:text-white outline-none"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} disabled={!inputText.trim()} className={`w-12 h-12 flex items-center justify-center rounded-[18px] flex-shrink-0 transition-all active:scale-95 ${inputText.trim() ? "bg-[#7C6CFF] text-white shadow-[0_0_20px_rgba(124,108,255,0.4)] border border-[#7C6CFF]/50" : "bg-white/50 dark:bg-white/5 text-gray-300 dark:text-white/20"}`}>
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
