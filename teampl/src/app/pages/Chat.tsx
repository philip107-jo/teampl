import { useState, useRef, useEffect } from "react";
import { projectApi, Project } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
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
  X, // imported for closing modal
  Menu
} from "lucide-react";

// icon map for string to component mapping
const iconMap: Record<string, React.ElementType> = {
  Database,
  Zap,
  BarChart3,
  Target
};
// Mock Members (Detailed, linked to projects, matching Team.tsx)
const members = [
  {
    id: 1, name: "나 (팀장)", role: "팀장", avatarColor: "bg-[#6366f1]", status: "활동중",
    email: "leader@university.ac.kr", phone: "010-1234-5678", department: "컴퓨터공학과", joinDate: "2024.03.01",
    skills: ["Python", "React", "데이터베이스"], projects: 2, completedTasks: 18, contribution: 95, activityScore: 95
  },
  {
    id: 2, name: "김철수", role: "팀원", avatarColor: "bg-[#10b981]", status: "활동중",
    email: "chulsoo@university.ac.kr", phone: "010-2345-6789", department: "학부 미정학과", joinDate: "2024.03.01",
    skills: ["UI/UX", "Figma", "디자인"], projects: 2, completedTasks: 15, contribution: 82, activityScore: 82
  },
  {
    id: 3, name: "이영희", role: "팀원", avatarColor: "bg-[#d946ef]", status: "활동중",
    email: "younghee@university.ac.kr", phone: "010-3456-7890", department: "학부 미정학과", joinDate: "2024.03.02",
    skills: ["AI/ML", "TensorFlow", "데이터분석"], projects: 2, completedTasks: 18, contribution: 78, activityScore: 78
  },
  {
    id: 4, name: "박민수", role: "팀원", avatarColor: "bg-[#f97316]", status: "휴식중",
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

// Reusable Profile Modal Component
function ProfileModal({ selectedMember, onClose, onMessage }: { selectedMember: any, onClose: () => void, onMessage: () => void }) {
  if (!selectedMember) return null;
  return (
    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl space-y-6 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className={`w-20 h-20 rounded-[24px] ${selectedMember.avatarColor} flex items-center justify-center text-white text-[24px] font-black shadow-lg`}>
                {selectedMember.name[0]}
              </div>
              <div className={`absolute -bottom-1 -right-0.5 w-4 h-4 ${selectedMember.status === '활동중' ? 'bg-[#10b981]' : 'bg-gray-300'} border-[3px] border-white rounded-full ring-1 ring-gray-200`}></div>
            </div>
            <div>
              <h3 className="text-[20px] font-black text-gray-900 tracking-tight">{selectedMember.name}</h3>
              <span className={`inline-block px-3 py-1 mt-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${selectedMember.role === '팀장' ? 'bg-[#6366f1] text-white' : 'bg-gray-100 text-gray-400'}`}>
                {selectedMember.role}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-3 text-[13px] text-gray-400 font-medium">
            <Mail className="w-4 h-4" />
            {selectedMember.email}
          </div>
          <div className="flex items-center gap-3 text-[13px] text-gray-400 font-medium">
            <Phone className="w-4 h-4" />
            {selectedMember.phone}
          </div>
          <div className="flex items-center gap-3 text-[13px] text-gray-400 font-medium">
            <GraduationCap className="w-4 h-4" />
            {selectedMember.department}
          </div>
          <div className="flex items-center gap-3 text-[13px] text-gray-400 font-medium">
            <Calendar className="w-4 h-4" />
            가입일: {selectedMember.joinDate}
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div>
            <p className="text-[12px] font-bold text-gray-300 mb-2 uppercase tracking-wider">보유 스킬</p>
            <div className="flex flex-wrap gap-2">
              {selectedMember.skills.map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-500 text-[12px] font-bold rounded-lg border border-gray-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-50">
            <div className="text-center">
              <p className="text-[11px] font-bold text-gray-300 mb-1">프로젝트</p>
              <p className="text-[16px] font-black text-gray-900">{selectedMember.projects}</p>
            </div>
            <div className="text-center border-x border-gray-50">
              <p className="text-[11px] font-bold text-gray-300 mb-1">완료 작업</p>
              <p className="text-[16px] font-black text-gray-900">{selectedMember.completedTasks}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold text-gray-300 mb-1">기여도</p>
              <p className="text-[16px] font-black text-indigo-600">{selectedMember.contribution}%</p>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-gray-400">활동 점수</span>
              <span className="text-[13px] font-black text-gray-900">{selectedMember.activityScore}/100</span>
            </div>
            <div className="w-full bg-gray-50 rounded-full h-2.5 overflow-hidden">
              <div className="bg-gray-900 h-full rounded-full" style={{ width: `${selectedMember.activityScore}%` }}></div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onMessage}
              className="w-full py-4 bg-[#6366f1] hover:bg-[#4f46e5] shadow-lg shadow-indigo-100 text-white rounded-[16px] text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <MessageSquare className="w-5 h-5" />
              1:1 메시지 보내기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const { user } = useAuth();
  const isTestUser = user?.isTestUser;

  const currentMembers = isTestUser ? members : [
    {
      id: 1, name: user?.name || "사용자", role: "팀장", avatarColor: "bg-[#6366f1]", status: "활동중",
      email: user?.email || "", phone: "-", department: "-", joinDate: "-",
      skills: [], projects: 0, completedTasks: 0, contribution: 0, activityScore: 0
    }
  ];
  const [projects, setProjects] = useState<Project[]>([]);
  const [navStep, setNavStep] = useState<NavStep>("LIST");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>("TEAM");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock messages
  const [messagesStore, setMessagesStore] = useState<Record<string, Message[]>>(
    isTestUser ? {
      "team-1": [
        { id: "1", sender: "김철수", content: "데이터베이스 스키마 초안 공유합니다!", time: "오전 10:30", isMe: false },
        { id: "2", sender: "나 (팀장)", content: "확인해볼게요.", time: "오전 10:32", isMe: true },
      ],
      "user-2": [
        { id: "1", sender: "김철수", content: "팀장님, 아까 말한 정규화 관련해서 질문있습니다.", time: "오후 1:10", isMe: false },
      ],
    } : {}
  );

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedMember = currentMembers.find(m => m.id === selectedMemberId);

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

  useEffect(() => {
    projectApi.getProjects().then(setProjects).catch(console.error);
  }, []);

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

  // 1단계: 메시지 목록 (통합 1-Depth)
  if (navStep === "LIST") {
    return (
      <div className="flex flex-col h-full bg-white overflow-hidden relative">
        {/* PROFILE MODAL (OVERLAY) */}
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
        <div className="p-4 md:p-6 border-b border-[#f1f5f9] bg-white sticky top-0 z-20">
          <h2 className="text-[24px] font-black text-gray-900 tracking-tight">메시지</h2>
          <p className="text-[13px] font-bold text-gray-400 mt-1">팀 채널과 멤버들을 확인하세요</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#f8faff]">
          {/* 팀 채널 섹션 */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-black text-gray-400 px-2 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> 팀 채널
            </h3>
            {projects.map((project) => {
              const IconComp = iconMap[project.icon] || Target;
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setChatMode("TEAM");
                    setNavStep("CHAT");
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-[24px] border border-[#f1f5f9] shadow-sm hover:shadow-md active:scale-[0.98] transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-[18px] ${project.color?.startsWith('#') ? '' : (project.color || 'bg-[#f0f7ff]')} flex items-center justify-center flex-shrink-0 relative overflow-hidden`}
                  >
                    {project.color?.startsWith('#') && <div className="absolute inset-0 opacity-15" style={{ backgroundColor: project.color }}></div>}
                    <IconComp
                      className={`w-6 h-6 relative z-10 ${project.iconColor?.startsWith('#') ? '' : project.iconColor}`}
                      style={project.iconColor?.startsWith('#') ? { color: project.iconColor } : undefined}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-[15px] font-black text-gray-900 truncate">{project.name}</p>
                    <p className="text-[12px] font-bold text-gray-400 truncate">전체 팀원 채팅</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                </button>
              )
            })}
          </div>

          {/* 1:1 메시지 섹션 */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-black text-gray-400 px-2 flex items-center gap-1.5">
              <UserIcon className="w-4 h-4" /> 1:1 메시지
            </h3>
            {currentMembers.filter(m => m.id !== 1).map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  setSelectedMemberId(member.id);
                  setProfileModalOpen(true);
                }}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-[24px] border border-[#f1f5f9] shadow-sm hover:shadow-md active:scale-[0.98] transition-all group"
              >
                <div className="relative">
                  <div className={`w-12 h-12 rounded-[18px] ${member.avatarColor} flex items-center justify-center text-white text-[16px] font-black`}>
                    {member.name[0]}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${member.status === '활동중' ? 'bg-[#10b981] shadow-[0_2px_8px_rgba(16,185,129,0.4)]' : 'bg-gray-300'} border-[3px] border-white rounded-full`}></div>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-black text-gray-900">{member.name}</p>
                  <p className="text-[12px] font-bold text-gray-400">{member.status === '활동중' ? '현재 활동 중' : '휴식 중'} • {member.role}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3단계: 채팅창
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      <div className="p-4 md:p-6 border-b border-[#f1f5f9] flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setNavStep("LIST")} className="p-2 -ml-2 text-gray-400 hover:text-gray-900"><ChevronLeft className="w-6 h-6" /></button>
          <div className="flex items-center gap-3">
            {chatMode === "TEAM" ? (
              (() => {
                const ProjectIcon = selectedProject ? (iconMap[selectedProject.icon] || Target) : Target;
                return (
                  <div className={`w-10 h-10 rounded-xl ${selectedProject?.color?.startsWith('#') ? '' : (selectedProject?.color || 'bg-indigo-50')} flex items-center justify-center relative overflow-hidden`}>
                    {selectedProject?.color?.startsWith('#') && <div className="absolute inset-0 opacity-15" style={{ backgroundColor: selectedProject.color }}></div>}
                    <ProjectIcon
                      className={`w-5 h-5 relative z-10 ${selectedProject?.iconColor?.startsWith('#') ? '' : (selectedProject?.iconColor || 'text-indigo-500')}`}
                      style={selectedProject?.iconColor?.startsWith('#') ? { color: selectedProject.iconColor } : undefined}
                    />
                  </div>
                );
              })()
            ) : (
              <div className={`w-10 h-10 rounded-xl ${selectedMember?.avatarColor} flex items-center justify-center text-white font-black text-[14px]`}>
                {selectedMember?.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-[16px] font-black text-gray-900 tracking-tight leading-none mb-1 truncate max-w-[150px]">
                {chatMode === "TEAM" ? selectedProject?.name : `${selectedMember?.name}님과의 대화`}
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-green-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                {chatMode === "TEAM" ? "실시간 팀 소통 중" : "1:1 프라이빗 대화"}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => chatMode === "TEAM" ? setIsDrawerOpen(true) : null}
          className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"
        >
          {chatMode === "TEAM" ? <Menu className="w-6 h-6" /> : <MoreVertical className="w-5 h-5" />}
        </button>
      </div>

      {/* TEAM MEMBERS DRAWER (OVERLAY) */}
      {isDrawerOpen && chatMode === "TEAM" && (
        <>
          <div className="absolute inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>
          <div className="absolute top-0 right-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
            <div className="p-5 border-b border-[#f1f5f9] flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-900 text-[16px]">참여 팀원 ({currentMembers.length})</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-sm"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8faff]/50">
              {currentMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedMemberId(member.id);
                    setProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 bg-white border border-[#f1f5f9] rounded-2xl hover:border-indigo-100 hover:shadow-sm transition-all text-left"
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-[14px] ${member.avatarColor} flex items-center justify-center text-white text-[14px] font-black shadow-sm`}>
                      {member.name[0]}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${member.status === '활동중' ? 'bg-[#10b981]' : 'bg-gray-300'} border-2 border-white rounded-full`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-gray-900 truncate">{member.name}</p>
                    <p className="text-[11px] font-bold text-gray-400 truncate">{member.role}</p>
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#f8faff]/50">
        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className={`w-20 h-20 rounded-[28px] ${chatMode === "TEAM" ? (selectedProject?.color?.startsWith('#') ? '' : (selectedProject?.color || 'bg-indigo-50')) : selectedMember?.avatarColor} flex items-center justify-center animate-bounce relative overflow-hidden`}>
              {chatMode === "TEAM" && selectedProject?.color?.startsWith('#') && <div className="absolute inset-0 opacity-15" style={{ backgroundColor: selectedProject.color }}></div>}
              {chatMode === "TEAM" ? (
                (() => {
                  const ProjIcon = selectedProject ? (iconMap[selectedProject.icon] || Target) : Target;
                  return <ProjIcon
                    className={`w-10 h-10 relative z-10 ${selectedProject?.iconColor?.startsWith('#') ? '' : (selectedProject?.iconColor || 'text-indigo-500')}`}
                    style={selectedProject?.iconColor?.startsWith('#') ? { color: selectedProject.iconColor } : undefined}
                  />;
                })()
              ) : (
                <UserIcon className="w-10 h-10 text-white" />
              )}
            </div>
            <div>
              <p className="text-[18px] font-black text-gray-900">{chatMode === "TEAM" ? "팀원들과 대화를 시작하세요" : `${selectedMember?.name}님께 메시지를 보내보세요`}</p>
              <p className="text-[14px] font-bold text-gray-400">함께 협업하며 프로젝트를 완성해보세요.</p>
            </div>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} items-end gap-2.5`}>
              {!msg.isMe && (
                <div className="w-9 h-9 rounded-2xl bg-[#6366f1] text-white flex items-center justify-center text-[13px] font-black shadow-lg shadow-indigo-100 flex-shrink-0 mb-1">
                  {msg.sender[0]}
                </div>
              )}
              <div className="max-w-[75%] space-y-1">
                {!msg.isMe && <p className="text-[12px] font-black text-gray-900 ml-1">{msg.sender}</p>}
                <div className={`flex items-end gap-2 ${msg.isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`px-4 py-2.5 rounded-[20px] text-[14px] font-medium shadow-sm leading-snug break-words ${msg.isMe ? "bg-[#6366f1] text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-[#f1f5f9]"}`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] font-bold text-gray-300 mb-0.5 whitespace-nowrap">{msg.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white border-t border-[#f1f5f9]">
        <div className="flex items-center gap-2 bg-gray-50 border border-[#f1f5f9] rounded-full pl-2 pr-1.5 py-1.5 shadow-inner">
          <button className="p-2 text-gray-400 hover:text-[#6366f1] flex-shrink-0"><Plus className="w-6 h-6" /></button>
          <input
            type="text"
            placeholder="메시지 입력..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium py-1 placeholder-gray-400"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} disabled={!inputText.trim()} className={`w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0 ${inputText.trim() ? "bg-[#6366f1] text-white shadow-lg" : "text-gray-300"}`}>
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
