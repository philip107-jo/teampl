import { useParams, useNavigate, useSearchParams } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  ChevronLeft, Database, Plus, Users, Calendar as CalendarIcon, Clock, 
  CheckCircle2, AlertCircle, FileText, MessageSquare, MoreVertical, LayoutDashboard,
  Settings, UserX, UserCheck, RefreshCw, X, Crown,
  CheckSquare, FolderOpen, BarChart3, Search
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { projectApi } from "../api/projectApi";
import { useToast } from "../context/ToastContext";
import Tasks from "./Tasks";
import Calendar from "./Calendar";
import Chat from "./Chat";
import Drive from "./Drive";
import VotePage from "./Vote";
import Overview from "./Overview";
import { useChat } from "../context/ChatContext";
import MembersTab from "../components/MembersTab";
import Avatar from "../components/Avatar";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const numProjectId = Number(projectId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { onlineUsers, socket, activeChatKey, initProjectChat } = useChat();

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
  const [inviteEmail, setInviteEmail] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const prevUserRoleRef = useRef<string | null>(null);

  // Close search dropdown on click outside
  // Moved to Layout.tsx

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
  }, [projectId, refreshTrigger, isKickedProcessed, navigate, showToast]);

  // 전역 실시간 토스트 알림 (채팅 수신)
  useEffect(() => {
    if (!socket || !user) return;
    
    const onNewMessage = (m: any) => {
      // 본인이 보낸 메시지는 알림 제외
      if (m.senderEmail === user.email) return;

      const mProjectId = m.projectId;
      const receiverEmail = m.receiverEmail;
      const msgRoom = m.room || (mProjectId ? `team-${mProjectId}` : [m.senderEmail, receiverEmail].sort().join('-'));

      // 현재 사용자가 해당 채팅방을 보고 있지 않을 때만 토스트 발생
      if (activeChatKey !== msgRoom) {
        const senderName = m.sender?.name || m.senderEmail.split('@')[0];
        const isTeam = !!mProjectId;
        const prefix = isTeam ? `[팀 채팅] ${senderName}` : `[1:1] ${senderName}`;
        showToast(`${prefix}: ${m.content}`, 'info');
      }
    };

    socket.on('newMessage', onNewMessage);
    return () => {
      socket.off('newMessage', onNewMessage);
    };
  }, [socket, user, activeChatKey, showToast]);

  // Chat / Socket initialization for the project
  const membersHash = useMemo(() => JSON.stringify(realProject?.membersList || []), [realProject?.membersList]);
  
  useEffect(() => {
    if (projectId && user?.email && realProject?.membersList) {
      initProjectChat(Number(projectId), user.email, realProject.membersList);
    }
  }, [projectId, user?.email, membersHash, initProjectChat]);

  // Mock data for the specific project
  const mockProject = {
    id: projectId,
    name: "데이터베이스 설계 프로젝트",
    course: "데이터베이스",
    description: "학생 관리 시스템 데이터베이스 설계 및 구현",
    progress: 75,
    deadline: "2026.03.20",
    members: [
      { id: 1, name: "나 (팀장)", avatarColor: "bg-[#11B886]" },
      { id: 2, name: "김철수", avatarColor: "bg-[#27D7A1]" },
      { id: 3, name: "이영희", avatarColor: "bg-[#FF6B7A]" },
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

  const rawMembers = useMemo(() => {
    return project.membersList 
      ? project.membersList 
      : [{ id: user?.id || 1, name: user?.name || "나", avatarColor: "bg-[#11B886]" }];
  }, [project.membersList, user?.id, user?.name]);

  const displayMembers = useMemo(() => {
    return [...rawMembers].sort((a: any, b: any) => {
      if (a.role === 'LEADER') return -1;
      if (b.role === 'LEADER') return 1;
      return 0;
    });
  }, [rawMembers]);

  const isReadOnly = project?.status === "COMPLETED" || project?.status === "ARCHIVED";

  const handleRegenerateInviteCode = async () => {
    if (!project) return;
    try {
      if (confirm('초대 코드를 재발급하시겠습니까? 기존 코드는 사용할 수 없게 됩니다.')) {
        await projectApi.regenerateInviteCode(Number(projectId));
        showToast('초대 코드가 성공적으로 갱신되었습니다.', 'success');
        setIsSettingModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message, 'error');
    }
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return showToast('초대할 이메일을 입력하세요.', 'error');
    if (!project) return;
    try {
      await projectApi.inviteByEmail(Number(projectId), inviteEmail.trim());
      showToast('성공적으로 초대했습니다.', 'success');
      setInviteEmail("");
      setRefreshTrigger(prev => prev + 1);
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
      setRefreshTrigger(prev => prev + 1);
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
      setRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message, 'error');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!project) return;
    try {
      await projectApi.updateProjectStatus(Number(projectId), status);
      showToast(status === 'COMPLETED' ? '프로젝트가 완료 처리되었습니다.' : '프로젝트 상태가 변경되었습니다.', 'success');
      setIsSettingModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (e: any) {
      showToast(e.response?.data?.message || e.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[75vh] items-center justify-center">
         <div className="animate-spin w-8 h-8 border-4 border-[#11B886] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="dashboard pt-0">
      {/* White Header & Tab Wrapper */}
      <div className="bg-white dark:bg-[#132038] border-b border-gray-200 dark:border-white/10 pt-6 mb-8">
        {/* New Top Header matched to screenshot */}
        <div className="flex items-start justify-between px-4 md:px-8 mb-6">
          <div className="flex items-start gap-4">
            <button 
              onClick={() => navigate("/")}
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-[22px] font-black text-[#1A2340] dark:text-white tracking-tight">{project.name}</h1>
              <p className="text-[13px] text-gray-500 font-medium mt-0.5">{project.course}</p>
            </div>
          </div>
          
          {/* Profile, Search & Settings (Right Side) */}
          <div className="flex items-center gap-3">
            {/* Search Bar has been moved to global Layout.tsx */}

            <div className="hidden xs:flex items-center gap-2 mr-2">
              <Avatar
                name={user?.name}
                avatarUrl={user?.avatarUrl}
                className="w-8 h-8 text-xs shrink-0"
              />
              <span className="text-sm font-bold text-gray-700 dark:text-white/80">{user?.name}님</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => {
                  if (project.userRole !== 'LEADER') {
                    showToast('프로젝트 설정은 팀장만 변경할 수 있습니다.', 'error');
                    return;
                  }
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
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

        {/* Read-Only Banner */}
        {isReadOnly && (
          <div className="mx-4 md:mx-8 mb-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 text-gray-500 dark:text-white/60" />
            <span className="text-[13px] font-bold text-gray-700 dark:text-white/80">
              읽기 전용 상태입니다. (완료 또는 보관된 프로젝트)
            </span>
          </div>
        )}

        {/* Tab Navigation Menu */}
        <div className="px-4 md:px-8 flex gap-3 md:gap-6 overflow-x-auto no-scrollbar pb-3 md:pb-0.5 scroll-smooth snap-x">
          {[
            { id: 'overview', label: '개요', icon: LayoutDashboard },
            { id: 'tasks', label: '과제 관리', icon: CheckSquare },
            { id: 'calendar', label: '일정', icon: CalendarIcon },
            { id: 'chat', label: '채팅', icon: MessageSquare },
            { id: 'drive', label: '자료실', icon: FolderOpen },
            { id: 'vote', label: '투표', icon: BarChart3 },
            { id: 'members', label: '팀원', icon: Users }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => navigate(`/projects/${projectId}?tab=${tab.id}`, { replace: true })}
              className={`flex items-center gap-2 whitespace-nowrap transition-all duration-200 snap-align-start shrink-0
                /* 데스크톱: 기존 언더라인 스타일 100% 동일 유지 */
                md:pb-3 md:px-1 md:border-b-2 md:rounded-none md:border-t-0 md:border-x-0 md:bg-transparent md:shadow-none md:-mb-[2px]
                ${
                  activeTab === tab.id
                    ? "md:border-[#11B886] md:text-[#11B886] md:font-bold"
                    : "md:border-transparent md:text-gray-500 md:hover:text-gray-700 md:font-medium"
                }
                /* 모바일: 손가락 터치 전용 둥근 필 스타일 적용 */
                max-md:py-2.5 max-md:px-4 max-md:rounded-xl max-md:border
                ${
                  activeTab === tab.id
                    ? "max-md:bg-[#11B886] max-md:text-white max-md:border-transparent max-md:shadow-[0_4px_12px_rgba(17,184,134,0.25)] max-md:font-black"
                    : "max-md:border-gray-100 dark:max-md:border-white/5 max-md:bg-gray-50/50 dark:max-md:bg-white/5 max-md:text-gray-500 max-md:hover:text-gray-900 dark:max-md:text-white/60 dark:max-md:hover:text-white max-md:font-bold"
                }
              `}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span className="text-xs md:text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Tab Content ===== */}
      <div className="px-4 md:px-8">
        {activeTab === 'overview' && <Overview projectId={numProjectId} project={project} members={displayMembers} isReadOnly={isReadOnly} />}
        {activeTab === 'tasks' && <Tasks projectId={numProjectId} isReadOnly={isReadOnly} />}
        {activeTab === 'calendar' && <Calendar projectId={numProjectId} isReadOnly={isReadOnly} />}
        {activeTab === 'chat' && <Chat projectId={numProjectId} projectMembers={displayMembers} projectData={project} isReadOnly={isReadOnly} />}
        {activeTab === 'drive' && <Drive projectId={numProjectId} isReadOnly={isReadOnly} />}
        {activeTab === 'vote' && <VotePage projectId={numProjectId} isReadOnly={isReadOnly} />}
        {activeTab === 'members' && <MembersTab projectId={numProjectId} members={displayMembers} isReadOnly={isReadOnly} />}
      </div>

      {/* Settings Modal */}
      {isSettingModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] !p-0 border border-gray-300 dark:border-white/10 dark:bg-[#132038] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d1526]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#11B886]/10 flex items-center justify-center text-[#11B886]">
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
                className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-all ${settingTab === "invite" ? "text-[#11B886] border-b-2 border-[#11B886] bg-white dark:bg-[#132038]" : "text-[#7D879C] dark:text-white/40 bg-gray-50 dark:bg-[#0d1526]"}`}
              >
                <RefreshCw className="w-4 h-4" />
                팀원 초대
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
                팀원 관리
              </button>
              <button 
                onClick={() => { setSettingTab("status"); setSelectedUser(""); }}
                className={`flex-1 py-4 text-sm font-bold flex flex-col items-center gap-1 transition-all ${settingTab === "status" ? "text-blue-500 border-b-2 border-blue-500 bg-white dark:bg-[#132038]" : "text-[#7D879C] dark:text-white/40 bg-gray-50 dark:bg-[#0d1526]"}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                상태 변경
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {settingTab === "invite" && (
                <div className="space-y-6">
                  {/* 이메일 직접 초대 */}
                  <div className="space-y-3 pb-6 border-b border-gray-200 dark:border-white/10">
                    <label className="text-sm font-bold text-[#1A2340] dark:text-white flex justify-between">
                      이메일로 초대하기
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="가입된 팀원의 이메일 입력"
                        className="flex-1 bg-gray-50 dark:bg-[#0d1526] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1A2340] dark:text-white outline-none focus:border-[#11B886] transition-all placeholder-gray-400 font-medium"
                      />
                      <button 
                        onClick={handleInviteByEmail}
                        disabled={!inviteEmail.trim()}
                        className="px-6 py-3 bg-[#1A2340] dark:bg-[#11B886] text-white rounded-xl text-sm font-black disabled:opacity-50 hover:bg-[#0EA271] transition-all whitespace-nowrap"
                      >
                        초대 발송
                      </button>
                    </div>
                  </div>

                  {/* 기존 초대코드 방식 */}
                  <div className="text-center space-y-2 pt-2">
                    <p className="text-[#1A2340] dark:text-white font-bold text-sm">초대코드 공유용 (외부 팀원)</p>
                    <div className="text-3xl font-black tracking-widest text-[#11B886] bg-[#11B886]/10 py-4 rounded-2xl mx-auto max-w-[200px] border border-[#11B886]/20">
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
                    className="w-full py-4 bg-[#11B886] hover:bg-[#0EA271] text-white font-black rounded-xl transition-colors shadow-lg shadow-[#11B886]/30 active:scale-[0.98]"
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
                          <Avatar
                            name={m.name}
                            avatarUrl={m.avatarUrl}
                            className="w-8 h-8 text-xs shrink-0"
                          />
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
                          <Avatar
                            name={m.name}
                            avatarUrl={m.avatarUrl}
                            className="w-8 h-8 text-xs shrink-0"
                          />
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

              {settingTab === "status" && (
                <div className="space-y-6">
                  <p className="text-sm font-bold text-[#7D879C] dark:text-white/60">
                    프로젝트가 완료되었거나 중단된 경우 상태를 변경하세요. 완료/보관된 프로젝트는 읽기 전용 상태가 됩니다.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleUpdateStatus('COMPLETED')}
                      className="flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group active:scale-95"
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-[#1A2340] dark:text-white mb-1">프로젝트 완료</p>
                        <p className="text-xs text-[#7D879C] dark:text-white/40">업무 종료 및 성과 기록 보존</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleUpdateStatus('ARCHIVED')}
                      className="flex flex-col items-center justify-center gap-3 p-6 border border-gray-200 dark:border-white/10 hover:border-gray-500 dark:hover:border-gray-400 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all group active:scale-95"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-[#1A2340] dark:text-white mb-1">보관함 이동</p>
                        <p className="text-xs text-[#7D879C] dark:text-white/40">목록에서 숨김 처리</p>
                      </div>
                    </button>
                  </div>
                  
                  {project.status !== 'ACTIVE' && (
                    <button 
                      onClick={() => handleUpdateStatus('ACTIVE')}
                      className="w-full py-4 mt-4 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-[#1A2340] dark:text-white font-black rounded-xl transition-colors active:scale-[0.98]"
                    >
                      다시 진행 중으로 변경
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Kick Custom Modal */}
      {confirmKickOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
        </div>,
        document.body
      )}
      {/* Confirm Transfer Leadership Custom Modal */}
      {confirmTransferOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
        </div>,
        document.body
      )}

    </div>
  );
}
