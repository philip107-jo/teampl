import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Users, Calendar, Database, Zap, BarChart3, Target, CheckCircle2, Clock, X, AlertCircle } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("전체");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    course: "",
    description: "",
    deadline: new Date().toISOString().split('T')[0],
    color: "#5C6AC4",
    termType: "SHORT" as "SHORT" | "LONG",
  });
  
  const [projects, setProjects] = useState<any[]>([]);

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

    fetchProjects();
    const intervalId = setInterval(fetchProjects, 5000); // 5초마다 자동 갱신 (Polling)

    return () => clearInterval(intervalId);
  }, []);

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
        termType: newProject.termType,
        userName: user?.name || "팀장",
      });
      setProjects([p, ...projects]);
      setNewProject({ name: "", course: "", description: "", deadline: new Date().toISOString().split('T')[0], color: "#5C6AC4", termType: "SHORT" });
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
      termType: project.termType || "SHORT",
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
        termType: editingProject.termType,
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
    <div className="dashboard pt-4">
      {/* Page Title & Actions Section - Hero Card Style */}
      <section className="card hero-card">
        <div className="hero-top" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
          <div>
            <div className="hero-meta">관리중인</div>
            <h1 className="hero-title" style={{ fontSize: '2rem' }}>팀 프로젝트</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#12182B] text-[#7C6CFF] rounded-[14px] text-[14px] font-bold shadow-[0_0_15px_rgba(124,108,255,0.1)] transition-all hover:scale-105 border border-[#7C6CFF]/30 active:scale-95"
            >
              초대코드로 방 입장하기
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#7C6CFF] text-white rounded-[14px] text-[14px] font-bold shadow-[0_0_15px_rgba(124,108,255,0.4)] transition-all hover:scale-105 border border-gray-300 dark:border-white/10 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              새 프로젝트
            </button>
          </div>
        </div>
      </section>

      {/* Summary Cards Section */}
      <section className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <article className="stat-card blue">
          <div className="stat-icon"><Clock className="w-6 h-6" /></div>
          <div className="stat-label">진행중</div>
          <div className="stat-value">{projects.filter(p => p.progress < 100).length}개</div>
        </article>
        
        <article className="stat-card green">
          <div className="stat-icon"><CheckCircle2 className="w-6 h-6" /></div>
          <div className="stat-label">완료</div>
          <div className="stat-value">{projects.filter(p => p.progress === 100).length}개</div>
        </article>
      </section>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mt-2 mb-2">
        {["전체", "진행중", "완료", "보류"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-[20px] py-[8px] rounded-xl text-[13px] font-bold transition-all ${activeTab === tab
                ? "bg-[#7C6CFF] text-white shadow-[0_0_15px_rgba(124,108,255,0.4)]"
                : "bg-white dark:bg-[#12182B] text-[#7D879C]/80 dark:text-white/40 border border-gray-200 dark:border-white/5 hover:bg-white/60 dark:bg-white/10"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <AnimatePresence mode="popLayout">
          {projects.filter(p => p.userStatus !== 'KICKED').map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
              transition={{ 
                duration: 0.4, 
                ease: [0.25, 0.1, 0.25, 1], // ease-out-quart-ish
                layout: { duration: 0.3 }
              }}
              style={{ width: '100%', height: '100%' }}
            >
              <Link
                to={`/projects/${project.id}`}
                className="card !block group transition-transform hover:scale-[1.02] border border-gray-200 dark:border-white/5 h-full"
                style={{ padding: '1.5rem 1.8rem' }}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`schedule-item ${project.theme || project.color} !border-none !p-0 bg-transparent`} style={project.color?.startsWith('#') ? {} : undefined}>
                    <div className="schedule-icon" style={{ width: 60, height: 60, borderRadius: 16, ...(project.color?.startsWith('#') ? { backgroundColor: project.color, color: 'white', border: 'none', boxShadow: `0 8px 16px ${project.color}30` } : {}) }}>
                      {typeof project.icon === 'string' || !project.icon ? <Database className="w-8 h-8"/> : <project.icon className="w-8 h-8" />}
                    </div>
                  </div>
                  {project.userRole === 'LEADER' && (
                    <div className="flex items-center gap-1 z-10 relative">
                      <button 
                        className="p-1.5 text-[#7D879C]/80 dark:text-white/40 hover:text-[#7C6CFF] hover:bg-[#7C6CFF]/10 rounded-lg transition-all"
                        onClick={(e) => handleEditClick(e, project)}
                        title="수정하기"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        className="p-1.5 text-[#7D879C]/80 dark:text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        onClick={(e) => handleDeleteClick(e, project)}
                        title="삭제하기"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <span className="badge">{project.course}</span>
                  <h3 className="card-title text-[1.4rem] tracking-tight">{project.name}</h3>
                  <p className="text-[13px] text-[#7D879C] dark:text-white/50 font-medium leading-relaxed">{project.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5 mt-auto">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-bold text-[#7D879C]/80 dark:text-white/40">진척도</span>
                      <span className="text-[13px] font-black text-[#1A2340] dark:text-white">{project.progress}%</span>
                    </div>
                    <div className={`bar ${project.theme}`}>
                      <span style={{ width: `${project.progress}%` }}></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#7D879C]/80 dark:text-white/40">
                        <Calendar className="w-4 h-4" />
                        <span>{project.deadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#7D879C]/80 dark:text-white/40">
                        <Users className="w-4 h-4" />
                        <span>{project.members}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">과목/카테고리</label>
                <input
                  type="text"
                  placeholder="예: 데이터베이스, 졸업과제"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white"
                  value={newProject.course}
                  onChange={(e) => setNewProject({ ...newProject, course: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">설명</label>
                <textarea
                  placeholder="프로젝트에 대한 간단한 설명"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white min-h-[100px]"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">프로젝트 기간 성격</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setNewProject({ ...newProject, termType: "SHORT" })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      newProject.termType === "SHORT"
                        ? "border-[#7C6CFF] bg-[#7C6CFF]/5"
                        : "border-gray-200 dark:border-white/5 bg-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Zap className={`w-6 h-6 ${newProject.termType === "SHORT" ? "text-[#7C6CFF]" : "text-gray-400"}`} />
                    <div className="text-center">
                      <p className={`text-sm font-black ${newProject.termType === "SHORT" ? "text-[#7C6CFF]" : "text-gray-400"}`}>단기 / 집중</p>
                      <p className="text-[10px] font-bold text-gray-500 opacity-60">1~3주 과제용</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setNewProject({ ...newProject, termType: "LONG" })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      newProject.termType === "LONG"
                        ? "border-[#7C6CFF] bg-[#7C6CFF]/5"
                        : "border-gray-200 dark:border-white/5 bg-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Target className={`w-6 h-6 ${newProject.termType === "LONG" ? "text-[#7C6CFF]" : "text-gray-400"}`} />
                    <div className="text-center">
                      <p className={`text-sm font-black ${newProject.termType === "LONG" ? "text-[#7C6CFF]" : "text-gray-400"}`}>장기 / 로드맵</p>
                      <p className="text-[10px] font-bold text-gray-500 opacity-60">한 학기 / 연구용</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">마감 날짜</label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] outline-none transition-all dark:text-white"
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
                className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,108,255,0.3)] disabled:opacity-30 transition-all active:scale-[0.98]"
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
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">과목/카테고리</label>
                <input
                  type="text"
                  placeholder="예: 데이터베이스, 졸업과제"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white"
                  value={editingProject.course}
                  onChange={(e) => setEditingProject({ ...editingProject, course: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">설명</label>
                <textarea
                  placeholder="프로젝트에 대한 간단한 설명"
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white min-h-[100px]"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-[#7D879C] ml-1">프로젝트 기간 성격</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setEditingProject({ ...editingProject, termType: "SHORT" })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      editingProject.termType === "SHORT"
                        ? "border-[#7C6CFF] bg-[#7C6CFF]/5"
                        : "border-gray-200 dark:border-white/5 bg-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Zap className={`w-6 h-6 ${editingProject.termType === "SHORT" ? "text-[#7C6CFF]" : "text-gray-400"}`} />
                    <div className="text-center">
                      <p className={`text-sm font-black ${editingProject.termType === "SHORT" ? "text-[#7C6CFF]" : "text-gray-400"}`}>단기 / 집중</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setEditingProject({ ...editingProject, termType: "LONG" })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      editingProject.termType === "LONG"
                        ? "border-[#7C6CFF] bg-[#7C6CFF]/5"
                        : "border-gray-200 dark:border-white/5 bg-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Target className={`w-6 h-6 ${editingProject.termType === "LONG" ? "text-[#7C6CFF]" : "text-gray-400"}`} />
                    <div className="text-center">
                      <p className={`text-sm font-black ${editingProject.termType === "LONG" ? "text-[#7C6CFF]" : "text-gray-400"}`}>장기 / 로드맵</p>
                    </div>
                  </button>
                </div>
              </div>
              <button
                onClick={handleUpdateProject}
                disabled={!editingProject.name.trim()}
                className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,108,255,0.3)] disabled:opacity-30 transition-all active:scale-[0.98]"
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
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] outline-none transition-all placeholder-[#7D879C]/50 dark:text-white uppercase font-black tracking-widest text-lg"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                />
              </div>
              <button
                onClick={handleJoinProject}
                disabled={!inviteCode.trim() || inviteCode.trim().length < 2}
                className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,108,255,0.3)] disabled:opacity-30 transition-all active:scale-[0.98]"
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
              className="card w-full max-w-[440px] !p-10 text-center border border-gray-200 dark:border-none shadow-[0_30px_90px_rgba(124,108,255,0.15)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-visible bg-white"
              style={isDark ? { background: 'linear-gradient(180deg, #162540 0%, #132038 100%)' } : {}}
            >
              {/* Glow Decoration */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#7C6CFF]/15 dark:bg-[#7C6CFF]/20 blur-[60px] rounded-full" />
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-[#7C6CFF]/10 rounded-[32px] flex items-center justify-center text-[#7C6CFF] mb-8 mx-auto shadow-[inset_0_0_20px_rgba(124,108,255,0.1),0_0_30px_rgba(124,108,255,0.1)] dark:shadow-[inset_0_0_20px_rgba(124,108,255,0.2),0_0_30px_rgba(124,108,255,0.2)]">
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
                    className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_12px_24px_rgba(124,108,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
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