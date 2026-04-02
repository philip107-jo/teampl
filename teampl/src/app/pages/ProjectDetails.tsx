import { useParams, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect, useRef } from "react";
import { 
  ChevronLeft, Database, Plus, Users, Calendar as CalendarIcon, Clock, 
  CheckCircle2, AlertCircle, FileText, MessageSquare, MoreVertical, LayoutDashboard,
  Settings, UserX, UserCheck, RefreshCw, X, Crown,
  CheckSquare, FolderOpen
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { projectApi } from "../api/projectApi";
import { useToast } from "../context/ToastContext";
import Tasks from "./Tasks";
import Calendar from "./Calendar";
import Chat from "./Chat";
import Drive from "./Drive";
import MemberTasks from "./MemberTasks";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const numProjectId = Number(projectId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const [realProject, setRealProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);
  const [settingTab, setSettingTab] = useState("invite");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [kickReasonType, setKickReasonType] = useState<string>("참여율 저조");
  const [customKickReason, setCustomKickReason] = useState("");
  const [isKickedProcessed, setIsKickedProcessed] = useState(false);
  const [confirmKickOpen, setConfirmKickOpen] = useState(false);
  const [confirmTransferOpen, setConfirmTransferOpen] = useState(false);
  const prevUserRoleRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchProject = () => {
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
            // 팀장 위임 알림: 이전 역할이 MEMBER였는데 LEADER로 바뀐 경우
            if (
              found &&
              prevUserRoleRef.current !== null &&
              prevUserRoleRef.current !== 'LEADER' &&
              found.userRole === 'LEADER'
            ) {
              showToast('🎉 축하합니다! 팀장으로 임명되었습니다!', 'success');
            }
            prevUserRoleRef.current = found?.userRole ?? null;
          })
          .catch(console.error)
          .finally(() => setIsLoading(false));
    };

    fetchProject();
    const intervalId = setInterval(fetchProject, 3000);
    return () => clearInterval(intervalId);
  }, [projectId]);

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

  const project = realProject ? { ...realProject, theme: realProject.color || "blue" } : {
    id: projectId,
    name: "알 수 없는 프로젝트",
    course: "미지정",
    description: "데이터를 찾을 수 없습니다.",
    progress: 0,
    deadline: "-",
    theme: "blue",
    icon: Database,
    members: 1
  };

  const rawMembers = project.membersList 
    ? project.membersList 
    : [{ id: user?.id || 1, name: user?.name || "나", avatarColor: "bg-[#7C6CFF]" }];

  const displayMembers = [...rawMembers].sort((a: any, b: any) => {
    if (a.role === 'LEADER') return -1;
    if (b.role === 'LEADER') return 1;
    return 0;
  });

  const handleRegenerateInviteCode = async () => {
    if (!project) return;
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

  const handleTransferLeadership = () => {
    if (!selectedUser) return showToast('위임할 팀원을 먼저 선택하세요.', 'error');
    setConfirmTransferOpen(true);
  };

  const executeTransferLeadership = async () => {
    try {
      await projectApi.transferLeadership(Number(projectId), selectedUser);
      showToast('성공적으로 위임되었습니다.', 'success');
      setIsSettingModalOpen(false);
      setConfirmTransferOpen(false);
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

      {/* ===== Tab Content ===== */}
      <section className="card hero-card mb-8">
        {activeTab === 'overview' && (
          <>
            {/* Overview Info Card */}
            <div className="card hero-card mb-8">
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
                        <CalendarIcon className="w-5 h-5 text-[#1A2340] dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="hero-meta mb-1 uppercase">마감일</p>
                      <p className="text-[16px] font-black text-[#1A2340] dark:text-white">{project.deadline}</p>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-white/60 dark:bg-white/10"></div>
                  <div>
                    <p className="hero-meta uppercase mb-2">참여 팀원</p>
                    <div className="flex -space-x-3">
                      {displayMembers.map((member: any) => {
                        const isLeader = member.role === 'LEADER';
                        return (
                          <div
                            key={member.id}
                            className={`w-10 h-10 rounded-full ${member.avatarColor} border-[3px] ${
                              isLeader ? 'border-[#FFB547] shadow-[0_0_8px_rgba(255,181,71,0.7)]' : 'border-[#151C31]'
                            } flex items-center justify-center text-white text-[13px] font-black shadow-md z-10 relative`}
                            title={isLeader ? `${member.name} (팀장)` : member.name}
                          >
                            {member.name[0]}
                            {isLeader && (
                              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                <Crown className="w-3.5 h-3.5 text-[#FFB547] drop-shadow-[0_0_4px_rgba(255,181,71,0.9)] fill-[#FFB547]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Circle */}
              <div className="bg-white dark:bg-[#12182B] rounded-[32px] p-8 flex flex-col items-center justify-center min-w-[220px] border border-gray-200 dark:border-white/5 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                    <circle 
                      cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" 
                      strokeDasharray="301.6" 
                      strokeDashoffset={301.6 - (301.6 * (project.progress || 0)) / 100}
                      className="text-[#7C6CFF] shadow-[0_0_20px_rgba(124,108,255,0.6)]" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-[28px] font-black text-[#1A2340] dark:text-white tracking-tight">{project.progress || 0}%</span>
                  </div>
                </div>
                <p className="hero-meta uppercase mt-1">전체 진척도</p>
              </div>
            </div>
          </div>

          {/* MemberTasks embedded in overview */}
          <MemberTasks projectId={numProjectId} />
        </>
      )}

      {activeTab === 'tasks' && <Tasks projectId={numProjectId} />}
      {activeTab === 'calendar' && <Calendar projectId={numProjectId} />}
      {activeTab === 'chat' && <Chat projectId={numProjectId} />}
      {activeTab === 'drive' && <Drive projectId={numProjectId} />}

      </section>

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
      {/* Confirm Transfer Leadership Custom Modal */}
      {confirmTransferOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmTransferOpen(false)} />
          <div className="relative bg-white dark:bg-[#151C31] w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-[#FFB547]/10 p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#FFB547]/20 text-[#FFB547] rounded-full flex items-center justify-center mb-4 shadow-inner">
                <UserCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-[#1A2340] dark:text-[#FFB547] mb-2">팀장 권한 위임</h2>
              <p className="text-sm font-bold text-[#7D879C] dark:text-white/70">
                정말로 이 팀원에게 방장 권한을<br/>위임하시겠습니까?<br/>
                <span className="text-[#FFB547] font-black">이후 회원님은 일반 팀원으로 강등됩니다.</span>
              </p>
            </div>
            <div className="p-6 flex gap-3">
              <button
                onClick={() => setConfirmTransferOpen(false)}
                className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-[#1A2340] dark:text-white font-bold rounded-2xl active:scale-95 transition-all"
              >
                취소
              </button>
              <button
                onClick={executeTransferLeadership}
                className="flex-1 py-3.5 bg-[#FFB547] hover:bg-[#F2A332] text-white font-black rounded-2xl active:scale-95 transition-all shadow-lg shadow-[#FFB547]/30"
              >
                네, 위임합니다
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
