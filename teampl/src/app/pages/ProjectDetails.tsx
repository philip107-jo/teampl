import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { 
  ChevronLeft, Database, Plus, Users, Calendar, Clock, 
  CheckCircle2, AlertCircle, FileText, MessageSquare, MoreVertical, LayoutDashboard,
  Settings, UserX, UserCheck, RefreshCw, X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { projectApi } from "../api/projectApi";
import { useToast } from "../context/ToastContext";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isMockUser = user?.email === "test@naver.com";

  const [realProject, setRealProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isMockUser);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [settingTab, setSettingTab] = useState("invite");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [kickReasonType, setKickReasonType] = useState<string>("참여율 저조");
  const [customKickReason, setCustomKickReason] = useState("");
  const [isKickedProcessed, setIsKickedProcessed] = useState(false);
  const [confirmKickOpen, setConfirmKickOpen] = useState(false);

  useEffect(() => {
    const fetchProject = () => {
      if (!isMockUser) {
        projectApi.getProjects()
          .then(projects => {
            const found = projects.find(p => String(p.id) === String(projectId));
            if (found && found.userStatus === 'KICKED') {
              if (!isKickedProcessed) {
                setIsKickedProcessed(true);
                // 전역 모달이 생겼으므로 여기서는 굳이 안 띄워도 무방, 하지만 토스트로도 한 번 더 알려줌
                showToast(`방장에 의해 내보내졌습니다. 사유: ${found.kickReason || '알 수 없음'}`, 'error');
                navigate('/projects', { replace: true });
              }
              return;
            }
            setRealProject(found);
          })
          .catch(console.error)
          .finally(() => setIsLoading(false));
      }
    };

    fetchProject();
    const intervalId = setInterval(fetchProject, 3000);
    return () => clearInterval(intervalId);
  }, [isMockUser, projectId]);

  // Mock data for the specific project
  const mockProject = {
    id: projectId,
    name: "데이터베이스 설계 프로젝트",
    course: "데이터베이스",
    description: "학생 관리 시스템 데이터베이스 설계 및 구현",
    progress: 75,
    deadline: "2026.03.20",
    members: [
      { id: 1, name: "나 (팀장)", avatarColor: "bg-[#7C6CFF]" },
      { id: 2, name: "김철수", avatarColor: "bg-[#27D7A1]" },
      { id: 3, name: "이영희", avatarColor: "bg-[#7C6CFF]" },
      { id: 4, name: "박민수", avatarColor: "bg-[#FFB547]" },
    ],
    theme: "blue",
    icon: Database,
    inviteCode: "TEAMPL",
  };

  const mockRecentTasks = [
    { id: 1, title: "요구사항 명세서 작성", status: "완료", assignee: "이영희", date: "03.05" },
    { id: 2, title: "개념적 스키마 설계", status: "진행중", assignee: "나 (팀장)", date: "03.10" },
    { id: 3, title: "논리적 스키마 변환", status: "대기중", assignee: "김철수", date: "03.15" },
  ];

  const mockRecentFiles = [
    { id: 1, name: "요구사항_명세서_v1.pdf", size: "2.4MB", uploader: "이영희", date: "03.05" },
    { id: 2, name: "ERD_초안_draft.png", size: "1.1MB", uploader: "나 (팀장)", date: "03.08" },
  ];

  const project = isMockUser ? mockProject : (realProject ? { ...realProject, theme: realProject.color || "blue" } : {
    id: projectId,
    name: "알 수 없는 프로젝트",
    course: "미지정",
    description: "데이터를 찾을 수 없습니다.",
    progress: 0,
    deadline: "-",
    theme: "blue",
    icon: Database,
    members: 1
  });

  const displayMembers = project.membersList 
    ? project.membersList 
    : (isMockUser 
        ? mockProject.members 
        : [{ id: user?.id || 1, name: user?.name || "나", avatarColor: "bg-[#7C6CFF]" }]);

  const handleRegenerateInviteCode = async () => {
    if (!project || isMockUser) return;
    try {
      if (confirm('초대 코드를 재발급하시겠습니까? 기존 코드는 사용할 수 없게 됩니다.')) {
        await projectApi.regenerateInviteCode(Number(projectId));
        showToast('초대 코드가 성공적으로 갱신되었습니다.', 'success');
        setIsSettingModalOpen(false);
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message, 'error');
    }
  };

  const handleTransferLeadership = async () => {
    if (!selectedUser) return showToast('위임할 팀원을 먼저 선택하세요.', 'error');
    try {
      if (confirm('정말로 이 팀원에게 방장 권한을 위임하시겠습니까? 이후 회원님은 일반 팀원으로 강등됩니다.')) {
        await projectApi.transferLeadership(Number(projectId), selectedUser);
        showToast('성공적으로 위임되었습니다.', 'success');
        setIsSettingModalOpen(false);
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message, 'error');
    }
  };

  const handleKickMemberClick = () => {
    if (!selectedUser) return showToast('내보낼 팀원을 먼저 선택하세요.', 'error');
    const reason = kickReasonType === '기타' ? customKickReason : kickReasonType;
    if (!reason.trim()) return showToast('내보낼 사유를 명시하세요.', 'error');
    setConfirmKickOpen(true);
  };

  const executeKickMember = async () => {
    const reason = kickReasonType === '기타' ? customKickReason : kickReasonType;
    try {
      await projectApi.kickMember(Number(projectId), selectedUser, reason);
      showToast('해당 팀원을 내보냈습니다.', 'success');
      setIsSettingModalOpen(false);
      setConfirmKickOpen(false);
      setSelectedUser(""); // 초기화
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message, 'error');
    }
  };

  if (isLoading) return <div className="p-8">로딩 중...</div>;

  const recentTasks = isMockUser ? mockRecentTasks : [];
  const recentFiles = isMockUser ? mockRecentFiles : [];

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
         <div className="animate-spin w-8 h-8 border-4 border-[#7C6CFF] border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
                {typeof project.icon === 'string' || !project.icon ? <Database className="w-6 h-6" /> : <project.icon className="w-6 h-6" />}
              </div>
            </div>
            <div>
              <p className="hero-meta">{project.course}</p>
              <h1 className="hero-title" style={{ fontSize: '1.4rem' }}>{project.name}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {project.inviteCode && (
            <button 
              onClick={() => {
                navigator.clipboard.writeText(project.inviteCode);
                showToast("초대 코드가 클립보드에 복사되었습니다!", "success");
              }}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#12182B] text-[#27D7A1] rounded-2xl text-[14px] font-black border border-[#27D7A1]/30 shadow-[0_0_15px_rgba(39,215,161,0.2)] hover:bg-[#27D7A1]/10 transition-all"
              title="클릭하여 복사하기"
            >
              초대 코드: {project.inviteCode}
            </button>
          )}
          <button className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#12182B] text-[#7C6CFF] rounded-2xl text-[14px] font-black border border-gray-200 dark:border-white/5 shadow-[0_0_15px_rgba(124,108,255,0.2)] hover:bg-[#7C6CFF]/10 transition-all">
            <LayoutDashboard className="w-4 h-4" />
            칸반 뷰
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="hero-action p-0 text-[#1A2340] dark:text-white flex items-center justify-center border-none bg-transparent hover:bg-white/60 dark:bg-white/10 shadow-none focus:outline-none z-10"
            >
              <Settings className="w-6 h-6" />
            </button>
            {isDropdownOpen && project.userRole === 'LEADER' && (
              <div className="absolute right-0 top-12 mt-2 w-48 bg-white dark:bg-[#132038] rounded-xl shadow-lg border border-gray-100 dark:border-white/10 py-1 z-50">
                <button 
                  onClick={() => { setIsSettingModalOpen(true); setIsDropdownOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-[#1A2340] dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  프로젝트 설정
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Overview Card */}
      <section className="card hero-card mb-8">
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
              <div className="flex items-center justify-between mb-2">
                <p className="hero-meta uppercase">참여 팀원</p>
                <button 
                  onClick={() => navigate(`/projects/${projectId}/members`)}
                  className="text-[12px] font-black text-[#7C6CFF] hover:underline flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  기여도 분석
                </button>
              </div>
              <div className="flex -space-x-3">
                {displayMembers.map((member: any) => (
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
            <button className="text-[14px] font-black text-[#7C6CFF] hover:text-[#1A2340] dark:text-white dark:hover:text-white/80 hover:underline transition-all">전체보기</button>
          </div>
          
          <div className="card space-y-3">
            {recentTasks.length > 0 ? recentTasks.map((task) => (
              <div key={task.id} className="p-5 rounded-[18px] bg-white/50 dark:bg-white/5 hover:bg-white/60 dark:bg-white/10 transition-all cursor-pointer flex items-center justify-between border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-3.5 h-3.5 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)] ${
                    task.status === "완료" ? "bg-[#27D7A1] shadow-[#27D7A1]" :
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
                <span className={`badge ${
                  task.status === "완료" ? "!text-[#27D7A1] !bg-[#27D7A1]/10 !border-[#27D7A1]/20" :
                  task.status === "진행중" ? "!text-[#7C6CFF] !bg-[#7C6CFF]/10 !border-[#7C6CFF]/20" : "!text-[#7D879C]/80 dark:!text-white/40 !bg-white/50 dark:!bg-white/5 !border-gray-200 dark:!border-white/5"
                }`}>
                  {task.status}
                </span>
              </div>
            )) : (
              <p className="text-center py-6 text-[#7D879C]/60 text-[13px] font-bold">아직 최근 작업이 없습니다.</p>
            )}
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
              <button onClick={() => navigate("/drive")} className="text-[14px] font-black text-[#FFB547] hover:text-[#1A2340] dark:text-white dark:hover:text-white/80 hover:underline transition-all">전체보기</button>
            </div>
            
            <div className="card space-y-3">
              {recentFiles.length > 0 ? recentFiles.map((file) => (
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
              )) : (
                <p className="text-center py-5 text-[#7D879C]/60 text-[13px] font-bold">업로드된 파일이 없습니다.</p>
              )}
            </div>
          </div>

          {/* Quick Chat Entry */}
          <div className="card !bg-gradient-to-br !from-[#7C6CFF]/40 !to-[#7C6CFF]/40 p-8 text-[#1A2340] dark:text-white shadow-[0_15px_40px_rgba(124,108,255,0.3)] relative overflow-hidden group transition-all hover:scale-[1.02] cursor-pointer border-none" onClick={() => navigate("/chat")}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -mr-20 -mt-20 blur-2xl"></div>
            <MessageSquare className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-300 dark:text-white/20 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-[20px] font-black mb-3 tracking-tight">팀 채팅방 참여</h3>
              <p className="text-[13px] text-[#7D879C] dark:text-white/80 font-bold mb-6 max-w-[220px] leading-relaxed">이 프로젝트의 팀원들과<br/>실시간으로 소통하세요.</p>
              <button 
                className="px-6 py-2.5 bg-white text-[#7C6CFF] text-[13px] font-black uppercase rounded-[12px] shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] transition-all"
              >
                입장하기
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Settings Modal */}
      {isSettingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] !p-0 border border-gray-300 dark:border-white/10 dark:bg-[#132038] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d1526]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#7C6CFF]/10 flex items-center justify-center text-[#7C6CFF]">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#1A2340] dark:text-white tracking-tight">프로젝트 설정</h2>
                  <p className="text-xs font-bold text-[#7D879C] dark:text-white/40">팀장 전용 관리 메뉴</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingModalOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5 text-[#7D879C] dark:text-white/60" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/10">
              <button 
                onClick={() => { setSettingTab("invite"); setSelectedUser(""); }}
                className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-all ${settingTab === "invite" ? "text-[#7C6CFF] border-b-2 border-[#7C6CFF] bg-white dark:bg-[#132038]" : "text-[#7D879C] dark:text-white/40 bg-gray-50 dark:bg-[#0d1526]"}`}
              >
                <RefreshCw className="w-4 h-4" />
                초대코드 재발급
              </button>
              <button 
                onClick={() => { setSettingTab("transfer"); setSelectedUser(""); }}
                className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-all ${settingTab === "transfer" ? "text-[#FFB547] border-b-2 border-[#FFB547] bg-white dark:bg-[#132038]" : "text-[#7D879C] dark:text-white/40 bg-gray-50 dark:bg-[#0d1526]"}`}
              >
                <UserCheck className="w-4 h-4" />
                팀장 권한 위임
              </button>
              <button 
                onClick={() => { setSettingTab("kick"); setSelectedUser(""); }}
                className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-all ${settingTab === "kick" ? "text-red-500 border-b-2 border-red-500 bg-white dark:bg-[#132038]" : "text-[#7D879C] dark:text-white/40 bg-gray-50 dark:bg-[#0d1526]"}`}
              >
                <UserX className="w-4 h-4" />
                팀원 내보내기
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {settingTab === "invite" && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-[#1A2340] dark:text-white font-bold text-sm">현재 재생성 전 초대코드</p>
                    <div className="text-3xl font-black tracking-widest text-[#7C6CFF] bg-[#7C6CFF]/10 py-4 rounded-2xl mx-auto max-w-[200px] border border-[#7C6CFF]/20">
                      {project.inviteCode || '-'}
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-500/10 p-4 rounded-xl border border-yellow-200 dark:border-yellow-500/20">
                    <div className="flex gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200/80 leading-relaxed">
                        코드 유출이 의심될 때 새 코드를 발급받으세요. 새로 발급 즉시 기존에 사용하던 코드는 <strong className="font-black text-yellow-900 dark:text-yellow-400">무효화</strong>되어 더 이상 참여할 수 없습니다.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleRegenerateInviteCode}
                    className="w-full py-4 bg-[#7C6CFF] hover:bg-[#6A5BDB] text-white font-black rounded-xl transition-colors shadow-lg shadow-[#7C6CFF]/30 active:scale-[0.98]"
                  >
                    새 코드 발급하기
                  </button>
                </div>
              )}

              {settingTab === "transfer" && (
                <div className="space-y-6">
                  <p className="text-sm font-bold text-[#7D879C] dark:text-white/60">
                    팀장 권한을 넘겨줄 팀원을 선택하세요. 권한을 넘긴 후 회원님은 자동으로 일반 멤버로 강등됩니다.
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {displayMembers.filter((m:any) => m.role !== 'LEADER' && m.email !== user?.email).map((m:any) => (
                      <label key={m.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${selectedUser === m.id ? 'border-[#FFB547] bg-[#FFB547]/5 shadow-[0_0_10px_rgba(255,181,71,0.2)]' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        <input 
                          type="radio" 
                          name="transferUser" 
                          value={m.id} 
                          checked={selectedUser === m.id}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="w-5 h-5 text-[#FFB547] focus:ring-[#FFB547] accent-[#FFB547]" 
                        />
                        <div className="ml-4 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${m.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                            {m.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-[#1A2340] dark:text-white text-sm">{m.name}</p>
                            <p className="text-xs text-[#7D879C] dark:text-white/40">{m.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                    {displayMembers.filter((m:any) => m.email !== user?.email).length === 0 && (
                      <div className="text-center p-8 text-[#7D879C] dark:text-white/40 font-bold text-sm">참여중인 다른 팀원이 없습니다.</div>
                    )}
                  </div>
                  <button 
                    onClick={handleTransferLeadership}
                    disabled={!selectedUser}
                    className="w-full py-4 bg-[#FFB547] hover:bg-[#F2A332] text-white font-black rounded-xl transition-colors shadow-lg shadow-[#FFB547]/30 disabled:opacity-30 active:scale-[0.98]"
                  >
                    권한을 위임하고 멤버로 강등
                  </button>
                </div>
              )}

              {settingTab === "kick" && (
                <div className="space-y-6">
                  <p className="text-sm font-bold text-[#7D879C] dark:text-white/60">
                    프로젝트에서 내보낼 팀원을 선택하고 사유를 명시해 주세요. 한 번 내보내면 되돌릴 수 없습니다.
                  </p>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                    {displayMembers.filter((m:any) => m.role !== 'LEADER' && m.email !== user?.email).map((m:any) => (
                      <label key={m.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${selectedUser === m.id ? 'border-red-500 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                        <input 
                          type="radio" 
                          name="kickUser" 
                          value={m.id} 
                          checked={selectedUser === m.id}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="w-5 h-5 accent-red-500" 
                        />
                        <div className="ml-4 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${m.avatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                            {m.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-[#1A2340] dark:text-white text-sm">{m.name}</p>
                            <p className="text-xs text-[#7D879C] dark:text-white/40">{m.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                    {displayMembers.filter((m:any) => m.email !== user?.email).length === 0 && (
                      <div className="text-center p-8 text-[#7D879C] dark:text-white/40 font-bold text-sm">참여중인 다른 팀원이 없습니다.</div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
                    <label className="text-xs font-black tracking-widest text-[#7D879C] uppercase">내보내기 사유 설정</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["참여율 저조", "소통 부재", "역할 미수행", "기타"].map(reason => (
                        <label key={reason} className="flex items-center gap-2 text-sm font-bold text-[#1A2340] dark:text-white cursor-pointer">
                          <input 
                            type="radio" 
                            name="kickReason" 
                            value={reason}
                            checked={kickReasonType === reason}
                            onChange={(e) => setKickReasonType(e.target.value)}
                            className="w-4 h-4 accent-red-500"
                          />
                          {reason}
                        </label>
                      ))}
                    </div>
                    {kickReasonType === "기타" && (
                      <input 
                        type="text" 
                        placeholder="상세 사유를 직접 입력해 주세요"
                        className="w-full mt-2 px-4 py-3 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-xl focus:border-red-500 focus:shadow-[0_0_15px_rgba(239,68,68,0.2)] outline-none transition-all dark:text-white text-sm font-medium"
                        value={customKickReason}
                        onChange={(e) => setCustomKickReason(e.target.value)}
                      />
                    )}
                  </div>
                  <button 
                    onClick={handleKickMemberClick}
                    disabled={!selectedUser}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl transition-colors shadow-lg shadow-red-500/30 disabled:opacity-30 active:scale-[0.98]"
                  >
                    해당 팀원 영구적으로 내보내기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Kick Custom Modal */}
      {confirmKickOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmKickOpen(false)} />
          <div className="relative bg-white dark:bg-[#151C31] w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-500/10 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-[#1A2340] dark:text-red-400 mb-2">팀원 내보내기 경고</h2>
              <p className="text-sm font-bold text-[#7D879C] dark:text-white/70">
                이 팀원을 정말로 내보내시겠습니까?<br/>이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="p-6 flex gap-3">
              <button 
                onClick={() => setConfirmKickOpen(false)}
                className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-[#1A2340] dark:text-white font-bold rounded-2xl active:scale-95 transition-all"
              >
                취소
              </button>
              <button 
                onClick={executeKickMember}
                className="flex-1 py-3.5 bg-red-500 text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg"
              >
                네, 내보냅니다
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
