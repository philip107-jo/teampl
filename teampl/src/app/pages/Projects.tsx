import { useState, useEffect } from "react";
import { Plus, MoreVertical, Users, Calendar, Database, Zap, BarChart3, Target, CheckCircle2, Clock, X, AlertCircle } from "lucide-react";
import { Link } from "react-router";
import { projectApi, Project } from "../api/projectApi";

export default function Projects() {
  const [activeTab, setActiveTab] = useState("전체");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    course: "",
    description: "",
  });
  
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    projectApi.getProjects()
      .then(data => setProjects(data))
      .catch(err => console.error("프로젝트 불러오기 실패:", err));
  }, []);


  const handleAddProject = async () => {
    if (!newProject.name.trim()) return;
    try {
      const p = await projectApi.createProject({
        name: newProject.name,
        course: newProject.course || "미지정",
        description: newProject.description,
        progress: 0,
        deadline: new Date().toISOString().split('T')[0],
        members: 1,
        color: "purple",
        icon: "Database",
      });
      setProjects([p, ...projects]);
      setNewProject({ name: "", course: "", description: "" });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("프로젝트 생성 중 오류가 발생했습니다.");
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
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C6CFF] text-white rounded-[14px] text-[14px] font-bold shadow-[0_0_15px_rgba(124,108,255,0.4)] transition-all hover:scale-105 border border-gray-300 dark:border-white/10 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            새 프로젝트
          </button>
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
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="card !block group transition-transform hover:scale-[1.02] border border-gray-200 dark:border-white/5"
            style={{ padding: '1.5rem 1.8rem' }}
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`schedule-item ${project.theme || project.color} !border-none !p-0 bg-transparent`}>
                <div className="schedule-icon" style={{ width: 60, height: 60, borderRadius: 16 }}>
                  {typeof project.icon === 'string' || !project.icon ? <Database className="w-8 h-8"/> : <project.icon className="w-8 h-8" />}
                </div>
              </div>
              <button 
                className="text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:text-white transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <span className="badge">{project.course}</span>
              <h3 className="card-title text-[1.4rem] tracking-tight">{project.name}</h3>
              <p className="text-[13px] text-[#7D879C] dark:text-white/50 font-medium leading-relaxed">{project.description}</p>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white/5">
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
        ))}
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
    </div>
  );
}