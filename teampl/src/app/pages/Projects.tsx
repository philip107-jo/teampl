import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Users, Calendar, Database, Zap, BarChart3, Target, CheckCircle2, Clock, X, AlertCircle, FolderOpen, Search } from "lucide-react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { projectApi, Project } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useDarkMode } from "../context/DarkModeContext";

export default function Projects() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useDarkMode();
  const [activeTab, setActiveTab] = useState("진행 중");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    course: "",
    description: "",
    deadline: new Date().toISOString().split('T')[0],
    color: "#5C6AC4",
  });
  
  const [projects, setProjects] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  // 수정 관련 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  // 삭제 관련 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const processedDeleteAlertIdsRef = useRef<Set<number>>(new Set());

  // Microsoft 연동 성공 모달 상태
  const [isMsSuccessModalOpen, setIsMsSuccessModalOpen] = useState(false);

  useEffect(() => {
    // Microsoft 연동 성공 확인
    const params = new URLSearchParams(window.location.search);
    if (params.get('ms_success') === 'true') {
      setIsMsSuccessModalOpen(true);
      // URL에서 성공 파라미터 제거 (사용자 경험 개선)
      const newUrl = window.location.pathname + (window.location.hash || '');
      window.history.replaceState({}, '', newUrl);
    }

    const fetchProjects = () => {
      projectApi.getProjects()
        .then(data => setProjects(data))
        .catch(err => console.error("프로젝트 불러오기 실패:", err));
    };

    const fetchInvitations = () => {
      projectApi.getPendingInvitations()
        .then(data => setInvitations(data))
        .catch(err => console.error("초대 목록 불러오기 실패:", err));
    };

    fetchProjects();
    fetchInvitations();
    const intervalId = setInterval(() => {
      fetchProjects();
      fetchInvitations();
    }, 5000); // 5초마다 자동 갱신 (Polling)

    return () => clearInterval(intervalId);
  }, []);

  const handleAcceptInvite = async (projectId: number) => {
    try {
      await projectApi.acceptInvitation(projectId);
      showToast("초대를 수락했습니다!", "success");
      const updatedProjects = await projectApi.getProjects();
      setProjects(updatedProjects);
      const updatedInvitations = await projectApi.getPendingInvitations();
      setInvitations(updatedInvitations);
    } catch (err) {
      console.error(err);
      showToast("초대 수락 중 오류가 발생했습니다.", "error");
    }
  };

  const handleDeclineInvite = async (projectId: number) => {
    try {
      await projectApi.declineInvitation(projectId);
      showToast("초대를 거절했습니다.", "success");
      const updatedInvitations = await projectApi.getPendingInvitations();
      setInvitations(updatedInvitations);
    } catch (err) {
      console.error(err);
      showToast("초대 거절 중 오류가 발생했습니다.", "error");
    }
  };

  // 프로젝트 삭제 알림 폴링
  useEffect(() => {
    const checkDeleteAlerts = () => {
      projectApi.getDeleteAlerts().then(alerts => {
        alerts.forEach(alert => {
          if (!processedDeleteAlertIdsRef.current.has(alert.id)) {
            processedDeleteAlertIdsRef.current.add(alert.id);
            showToast(`🗑️ '${alert.projectName}' 프로젝트가 삭제되었습니다. 사유: ${alert.deleteReason}`, 'error');
            projectApi.ackDeleteAlert(alert.id).catch(() => {});
          }
        });
      }).catch(() => {});
    };

    checkDeleteAlerts();
    const alertInterval = setInterval(checkDeleteAlerts, 5000);
    return () => clearInterval(alertInterval);
  }, [user]);


  const handleAddProject = async () => {
    if (!newProject.name.trim()) return;
    try {
      const p = await projectApi.createProject({
        name: newProject.name,
        course: newProject.course || "미지정",
        description: newProject.description,
        progress: 0,
        deadline: newProject.deadline,
        createdAt: new Date().toISOString().split('T')[0],
        members: 1,
        color: newProject.color,
        icon: "Database",
        userName: user?.name || "팀장",
      });
      setProjects([p, ...projects]);
      setNewProject({ name: "", course: "", description: "", deadline: new Date().toISOString().split('T')[0], color: "#5C6AC4" });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
    }
  };

  const handleJoinProject = async () => {
    if (!inviteCode.trim()) return;
    try {
      const p = await projectApi.joinProject(inviteCode.trim().toUpperCase(), user?.name || "팀원");
      setProjects([p, ...projects]);
      setInviteCode("");
      setIsJoinModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("유효하지 않거나 이미 참여한 초대 코드입니다.");
    }
  };

  const handleEditClick = (e: React.MouseEvent, project: any) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingProject({
      id: project.id,
      name: project.name,
      course: project.course,
      description: project.description,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: any) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteReason("");
    setIsDeleteModalOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject?.name.trim()) return;
    try {
      const updated = await projectApi.updateProject(editingProject.id, {
        name: editingProject.name,
        course: editingProject.course || "미지정",
        description: editingProject.description,
      });
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
      setIsEditModalOpen(false);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      alert("프로젝트 수정 중 오류가 발생했습니다.");
    }
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    if (!deleteReason.trim()) {
      showToast('삭제 사유를 입력해주세요.', 'error');
      return;
    }
    try {
      await projectApi.deleteProject(projectToDelete.id, deleteReason);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      setDeleteReason("");
    } catch (err) {
      console.error(err);
      showToast('프로젝트 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  return (
    <div className="dashboard pt-8 pb-safe max-w-7xl mx-auto px-4 md:px-8">
      {/* Page Title & Actions Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-[#1A2340] dark:text-white tracking-tight mb-1">내 프로젝트</h1>
          <p className="text-[14px] text-[#7D879C] font-medium">참여 중인 팀프로젝트를 관리하세요</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#12182B] text-[#7D879C] rounded-full text-[14px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95 border border-gray-200 dark:border-white/10"
          >
            초대 코드 입력
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-full text-[14px] font-bold shadow-[0_4px_14px_rgba(17,184,134,0.3)] transition-all active:scale-95 border-none"
          >
            <Plus className="w-5 h-5" />
            프로젝트 생성
          </button>
        </div>
      </div>

      {/* Pending Invitations Section */}
      {invitations.length > 0 && (
        <div className="mb-10 bg-gradient-to-r from-[#7C6CFF]/10 to-[#11B886]/10 border border-[#7C6CFF]/20 rounded-3xl p-6 sm:p-8 shadow-[0_4px_20px_rgba(124,108,255,0.05)] animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[#7C6CFF] animate-pulse" />
            <h2 className="text-base sm:text-lg font-black text-[#1A2340] dark:text-white">초대받은 팀 프로젝트 ({invitations.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map((inv) => (
              <div 
                key={inv.id} 
                className="bg-white dark:bg-[#132038] border border-gray-100 dark:border-white/5 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span 
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase text-white tracking-wider"
                      style={inv.color?.startsWith('#') ? { backgroundColor: inv.color } : { backgroundColor: '#7C6CFF' }}
                    >
                      {inv.course || "기타"}
                    </span>
                    <span className="text-[11px] text-[#7D879C] font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      마감: {inv.deadline}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#1A2340] dark:text-white mb-1.5">{inv.projectName}</h3>
                  <p className="text-xs text-[#7D879C] dark:text-white/60 mb-4 line-clamp-2">{inv.description || "설명이 없는 프로젝트입니다."}</p>
                  <div className="text-xs font-semibold text-[#7D879C] mb-4 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#7C6CFF]" />
                    <span>초대한 사람: <strong className="text-[#1A2340] dark:text-white">{inv.leaderName}</strong> ({inv.leaderEmail})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDeclineInvite(inv.projectId)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                  >
                    거절
                  </button>
                  <button 
                    onClick={() => handleAcceptInvite(inv.projectId)}
                    className="flex-1 py-3 bg-[#7C6CFF] hover:bg-[#6858e6] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    수락
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs & Search Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-white/10 mb-8 gap-4">
        <div className="flex items-center gap-6">
          {["진행 중", "완료됨"].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery(""); // 탭 전환 시 검색어 초기화
              }}
              className={`pb-4 text-[15px] font-bold transition-all relative ${
                activeTab === tab 
                  ? "text-[#11B886]" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-white/80"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="projects-tab" className="absolute bottom-0 left-0 w-full h-[3px] bg-[#11B886] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64 mb-3 sm:mb-0">
          <input 
            type="text"
            placeholder="프로젝트 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 sm:py-2 text-xs sm:text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:border-[#11B886] transition-all text-[#1A2340] dark:text-white placeholder:text-gray-400 dark:placeholder-white/20"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Projects List */}
      {(() => {
        const filteredProjects = projects
          .filter(p => p.userStatus !== 'KICKED')
          .filter(p => activeTab === "진행 중" ? (p.status === "ACTIVE" || !p.status) : p.status === "COMPLETED" || p.status === "ARCHIVED");

        const displayedProjects = filteredProjects.filter(p => {
          if (!searchQuery) return true;
          const query = searchQuery.toLowerCase();
          return (
            p.name?.toLowerCase().includes(query) ||
            p.course?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
          );
        });

        if (displayedProjects.length === 0) {
          return (
            <div className="text-center py-20 bg-white dark:bg-[#132038] border border-gray-100 dark:border-white/5 rounded-3xl p-8 shadow-sm">
              <FolderOpen className="w-12 h-12 text-[#7D879C]/40 dark:text-white/20 mx-auto mb-4" />
              <h3 className="text-base font-bold text-[#1A2340] dark:text-white">
                {searchQuery ? "검색 결과가 없습니다" : (activeTab === "진행 중" ? "진행 중인 프로젝트가 없습니다" : "완료된 프로젝트가 없습니다")}
              </h3>
              <p className="text-xs text-[#7D879C] dark:text-white/40 mt-1.5">
                {searchQuery ? "다른 검색어로 다시 시도해보세요." : (activeTab === "진행 중" ? "새로운 팀프로젝트를 생성하거나 초대코드로 참여해보세요!" : "완료된 프로젝트가 이곳에 표시됩니다.")}
              </p>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {displayedProjects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                >
                  <Link
                    to={`/projects/${project.id}`}
                    className={`block rounded-2xl p-4 sm:p-7 border shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-1 h-full flex flex-col relative group ${
                      activeTab === "완료됨" 
                        ? "bg-gray-50 dark:bg-[#0d1526] border-transparent dark:border-white/5 grayscale-[0.5] opacity-80" 
                        : "bg-white dark:bg-[#132038] border-gray-100 dark:border-white/5"
                    }`}
                  >
                    {/* Project Header: Icon & Actions */}
                    <div className="flex items-start justify-between mb-4 sm:mb-5">
                      <div 
                        className="w-10 h-10 sm:w-[48px] sm:h-[48px] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm"
                        style={project.color?.startsWith('#') ? { backgroundColor: project.color, color: 'white' } : { backgroundColor: '#11B886', color: 'white' }}
                      >
                        <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      
                      {project.userRole === 'LEADER' && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {activeTab !== "완료됨" && (
                            <button 
                              className="p-1.5 text-gray-400 hover:text-[#11B886] hover:bg-[#11B886]/10 rounded-lg transition-all"
                              onClick={(e) => handleEditClick(e, project)}
                              title="수정하기"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                            onClick={(e) => handleDeleteClick(e, project)}
                            title="삭제하기"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Project Info */}
                    <div className="mb-4 sm:mb-8 flex-1">
                      <h3 className="text-[14px] sm:text-[18px] font-bold text-[#1A2340] dark:text-white tracking-tight mb-1 sm:mb-2 line-clamp-1">{project.name}</h3>
                      <p className="text-[11px] sm:text-[13px] text-[#7D879C] dark:text-white/60 leading-snug sm:leading-relaxed line-clamp-2">{project.description}</p>
                    </div>

                    {/* Project Meta Footer */}
                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-[12px] text-[#9AA4B2] font-medium pt-3 sm:pt-4 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-1">
                        <FolderOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="truncate max-w-[60px] sm:max-w-[100px]">{project.course}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>{project.deadline}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      })()}

      {/* -- Add Project Modal -- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] !p-8 border border-gray-300 dark:border-white/10 dark:bg-[#132038]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="hero-title !text-2xl">새 프로젝트 생성</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-3 hover:bg-white/10 dark:bg-white/10 rounded-2xl transition-all active:scale-90">
                <X className="w-6 h-6 text-[#7D879C] dark:text-white/60" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">프로젝트 명</label>
                <input
                  type="text"
                  placeholder="프로젝트 이름을 입력하세요"
                  autoFocus
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">과목/카테고리</label>
                <input
                  type="text"
                  placeholder="예: 데이터베이스, 졸업과제"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white"
                  value={newProject.course}
                  onChange={(e) => setNewProject({ ...newProject, course: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">설명</label>
                <textarea
                  placeholder="프로젝트에 대한 간단한 설명"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white min-h-[100px]"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">마감 날짜</label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.2)] outline-none transition-all dark:text-white"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">프로젝트 색상</label>
                  <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl px-6 py-3.5 transition-all">
                    <input
                      type="color"
                      className="w-8 h-8 rounded shrink-0 cursor-pointer bg-transparent border-0 outline-none p-0"
                      value={newProject.color}
                      onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                    />
                    <span className="text-[14px] font-bold text-[#1A2340] dark:text-white uppercase">{newProject.color}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleAddProject}
                disabled={!newProject.name.trim()}
                className="w-full py-5 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(17,184,134,0.3)] disabled:opacity-30 transition-all active:scale-[0.98]"
              >
                프로젝트 생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Edit Project Modal -- */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] !p-8 border border-gray-300 dark:border-white/10 dark:bg-[#132038]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="hero-title !text-2xl">프로젝트 수정</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-3 hover:bg-white/10 dark:bg-white/10 rounded-2xl transition-all active:scale-90">
                <X className="w-6 h-6 text-[#7D879C] dark:text-white/60" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">프로젝트 명</label>
                <input
                  type="text"
                  placeholder="프로젝트 이름을 입력하세요"
                  autoFocus
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">과목/카테고리</label>
                <input
                  type="text"
                  placeholder="예: 데이터베이스, 졸업과제"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white"
                  value={editingProject.course}
                  onChange={(e) => setEditingProject({ ...editingProject, course: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">설명</label>
                <textarea
                  placeholder="프로젝트에 대한 간단한 설명"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white min-h-[100px]"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                />
              </div>
              <button
                onClick={handleUpdateProject}
                disabled={!editingProject.name.trim()}
                className="w-full py-5 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(17,184,134,0.3)] disabled:opacity-30 transition-all active:scale-[0.98]"
              >
                변경사항 저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Delete Confirmation Modal -- */}
      {isDeleteModalOpen && projectToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-[400px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] !p-8 border border-red-500/20 dark:bg-[#132038]">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-[20px] flex items-center justify-center text-red-500 mb-6 shadow-inner mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-[20px] font-black text-center text-[#1A2340] dark:text-white tracking-tight leading-tight mb-3">정말 삭제하시겠습니까?</h2>
            <p className="text-[13px] font-bold text-center text-[#7D879C]/80 dark:text-white/40 mb-6 break-keep leading-relaxed">
              <span className="text-[#1A2340] dark:text-white">'{projectToDelete.name}'</span> 프로젝트에 포함된 모든 할 일, 일정, 채팅 내역이 즉시 영구적으로 삭제되며 되돌릴 수 없습니다.
            </p>
            <div className="space-y-2 mb-6">
              <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">삭제 사유 (팀원에게 전달됩니다)</label>
              <textarea
                placeholder="예: 프로젝트 방향이 변경되어 종료합니다."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-red-400 focus:shadow-[0_0_15px_rgba(239,68,68,0.15)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white min-h-[80px] text-sm font-medium resize-none"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-[#7D879C] dark:text-white/60 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteProject}
                disabled={!deleteReason.trim()}
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-30"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Join Project Modal -- */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.5)] !p-8 border border-gray-300 dark:border-white/10 dark:bg-[#132038]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="hero-title !text-2xl">프로젝트 참여</h2>
              <button onClick={() => setIsJoinModalOpen(false)} className="p-3 hover:bg-white/10 dark:bg-white/10 rounded-2xl transition-all active:scale-90">
                <X className="w-6 h-6 text-[#7D879C] dark:text-white/60" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">초대 코드 입력</label>
                <input
                  type="text"
                  placeholder="6자리 영문/숫자 코드"
                  autoFocus
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white uppercase font-black tracking-widest text-lg"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                />
              </div>
              <button
                onClick={handleJoinProject}
                disabled={!inviteCode.trim() || inviteCode.trim().length < 2}
                className="w-full py-5 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(17,184,134,0.3)] disabled:opacity-30 transition-all active:scale-[0.98]"
              >
                참여하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Microsoft Success Modal -- */}
      <AnimatePresence>
        {isMsSuccessModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-2xl dark:backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              className="card w-full max-w-[440px] !p-10 text-center border border-gray-200 dark:border-none shadow-[0_30px_90px_rgba(17,184,134,0.15)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-visible bg-white"
              style={isDark ? { background: 'linear-gradient(180deg, #162540 0%, #132038 100%)' } : {}}
            >
              {/* Glow Decoration */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#11B886]/15 dark:bg-[#11B886]/20 blur-[60px] rounded-full" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-[#11B886]/10 rounded-[32px] flex items-center justify-center text-[#11B886] mb-8 mx-auto shadow-[inset_0_0_20px_rgba(17,184,134,0.1),0_0_30px_rgba(17,184,134,0.1)] dark:shadow-[inset_0_0_20px_rgba(17,184,134,0.2),0_0_30px_rgba(17,184,134,0.2)]">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                
                <div className="space-y-4 mb-10">
                  <h2 className="text-[28px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">Microsoft 365<br/>연동 성공!</h2>
                  <p className="text-[15px] font-bold text-slate-500 dark:text-white/50 leading-relaxed break-keep">
                    축하합니다! 대학생 학생 계정 인증이 완료되었습니다. 이제 드라이브에서 고퀄리티 Word, Excel 문서를 자유롭게 생성하고 실시간으로 공동 편집할 수 있습니다.
                  </p>
                </div>

                <div className="grid gap-3">
                  <button
                    onClick={() => setIsMsSuccessModalOpen(false)}
                    className="w-full py-5 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_12px_24px_rgba(17,184,134,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    지금 바로 시작하기
                  </button>
                  <p className="text-[11px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] pt-2">Teampl × Microsoft Cloud Integration</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}