import { useState, useEffect } from "react";
import { projectApi, Project } from "../api/projectApi";
import { Plus, MoreVertical, Users, Calendar, Database, Zap, BarChart3, Target, CheckCircle2, Clock, AlertCircle, X, Check } from "lucide-react";
import { Link } from "react-router";

export default function Projects() {
  const [activeTab, setActiveTab] = useState("전체");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const completedCount = projects.filter(p => p.progress === 100).length;
  const inProgressCount = projects.length - completedCount;

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await projectApi.getProjects();
        setProjects(data);
      } catch (error) {
        console.error("프로젝트 목록 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  const iconMap: Record<string, React.ElementType> = {
    Database,
    Zap,
    BarChart3,
    Target
  };

  const PROJECT_COLORS = [
    { id: 'indigo', color: 'bg-[#e0e7ff]', iconColor: 'text-indigo-600', progressColor: 'bg-indigo-500', ringColor: 'ring-indigo-500' },
    { id: 'pink', color: 'bg-[#fce7f3]', iconColor: 'text-pink-600', progressColor: 'bg-pink-500', ringColor: 'ring-pink-500' },
    { id: 'amber', color: 'bg-[#fef3c7]', iconColor: 'text-amber-600', progressColor: 'bg-amber-500', ringColor: 'ring-amber-500' },
    { id: 'emerald', color: 'bg-[#d1fae5]', iconColor: 'text-emerald-600', progressColor: 'bg-emerald-500', ringColor: 'ring-emerald-500' },
    { id: 'sky', color: 'bg-[#e0f2fe]', iconColor: 'text-sky-600', progressColor: 'bg-sky-500', ringColor: 'ring-sky-500' },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", course: "", description: "", deadline: "", colorId: "indigo", customColor: "#6366f1" });

  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  useEffect(() => {
    const hideDropdown = () => setActiveDropdownId(null);
    document.addEventListener('click', hideDropdown);
    return () => document.removeEventListener('click', hideDropdown);
  }, []);

  const openEditModal = (project: Project) => {
    setEditingProjectId(project.id);
    setNewProject({
      name: project.name,
      course: project.course,
      description: project.description,
      deadline: project.deadline.replace(/\./g, '-'),
      colorId: project.color.startsWith('#') ? 'custom' : PROJECT_COLORS.find(c => c.color === project.color)?.id || 'indigo',
      customColor: project.color.startsWith('#') ? project.color : '#6366f1'
    });
    setIsModalOpen(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;

    try {
      let colorPayload;
      if (newProject.colorId === 'custom') {
        colorPayload = {
          color: newProject.customColor,
          iconColor: newProject.customColor,
          progressColor: newProject.customColor
        };
      } else {
        const selectedColor = PROJECT_COLORS.find(c => c.id === newProject.colorId) || PROJECT_COLORS[0];
        colorPayload = {
          color: selectedColor.color,
          iconColor: selectedColor.iconColor,
          progressColor: selectedColor.progressColor
        };
      }

      const payload = {
        name: newProject.name,
        course: newProject.course,
        description: newProject.description,
        deadline: newProject.deadline,
        ...colorPayload,
        ...(editingProjectId ? {} : { createdAt: new Date().toISOString().split('T')[0] })
      };

      if (editingProjectId) {
        const updated = await projectApi.updateProject(editingProjectId, payload);
        setProjects(projects.map(p => p.id === editingProjectId ? updated : p));
      } else {
        const created = await projectApi.createProject(payload);
        setProjects([created, ...projects]);
      }
      setIsModalOpen(false);
      setEditingProjectId(null);
      setNewProject({ name: "", course: "", description: "", deadline: "", colorId: "indigo", customColor: "#6366f1" });
    } catch (error) {
      console.error("프로젝트 처리 실패:", error);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProjectId) return;
    try {
      await projectApi.deleteProject(deletingProjectId);
      setProjects(projects.filter(p => p.id !== deletingProjectId));
      setDeletingProjectId(null);
    } catch (e) {
      console.error(e);
    }
  };

  //... removed previous create logic in the above huge block
  // this is to just remove the old handleCreateProject since I put the new one above.

  return (
    <div className="space-y-8 p-6 pb-20 max-w-6xl mx-auto bg-white min-h-screen">
      {/* Page Title & Actions Section */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-gray-400 text-[14px] font-bold">관리중인</p>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight">팀 프로젝트</h1>
        </div>
        <button
          onClick={() => {
            setEditingProjectId(null);
            setNewProject({ name: "", course: "", description: "", deadline: "", colorId: "indigo", customColor: "#6366f1" });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-[14px] text-[15px] font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] mb-1"
        >
          <Plus className="w-5 h-5" />
          새 프로젝트 추가
        </button>
      </div>

      {/* Summary Cards Section - Re-ensuring Order: In-progress(Left), Completed(Right) */}
      <div className="grid grid-cols-2 gap-3 md:gap-5">
        {/* 진행중 - LEFT */}
        <div className="bg-white rounded-[20px] lg:rounded-[24px] p-4 sm:p-5 md:p-6 lg:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-3 sm:gap-4 lg:gap-6 border border-gray-50 flex-1 min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-[16px] md:rounded-[20px] bg-[#f0f7ff] flex items-center justify-center flex-shrink-0">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#2563eb] shadow-[0_0_12px_rgba(37,99,235,0.6)]"></div>
          </div>
          <div className="whitespace-nowrap flex-shrink-0">
            <p className="text-gray-400 text-[14px] sm:text-[16px] lg:text-[18px] font-bold mb-0.5 md:mb-1">진행중</p>
            <p className="text-[24px] sm:text-[28px] lg:text-[32px] font-black text-gray-900 leading-none">{inProgressCount}개</p>
          </div>
        </div>

        {/* 완료 - RIGHT */}
        <div className="bg-white rounded-[20px] lg:rounded-[24px] p-4 sm:p-5 md:p-6 lg:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex items-center gap-3 sm:gap-4 lg:gap-6 border border-gray-50 flex-1 min-w-0">
          <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-[16px] md:rounded-[20px] bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.6)]"></div>
          </div>
          <div className="whitespace-nowrap flex-shrink-0">
            <p className="text-gray-400 text-[14px] sm:text-[16px] lg:text-[18px] font-bold mb-0.5 md:mb-1">완료</p>
            <p className="text-[24px] sm:text-[28px] lg:text-[32px] font-black text-gray-900 leading-none">{completedCount}개</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3">
        {["전체", "진행중", "완료", "보류"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-[24px] py-[11px] rounded-[14px] text-[14px] font-bold transition-all ${activeTab === tab
              ? "bg-black text-white shadow-[0_8px_16px_-4px_rgba(0,0,0,0.15)]"
              : "bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-gray-50"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Projects List - Card structure matching photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {isLoading ? (
          <div className="col-span-1 md:col-span-2 text-center py-20 text-gray-500 font-bold">
            프로젝트 목록을 불러오는 중입니다...
          </div>
        ) : projects.length === 0 ? (
          <div className="col-span-1 md:col-span-2 text-center py-20 text-gray-500 font-bold">
            첫 번째 프로젝트를 만들어보세요!
          </div>
        ) : projects.map((project: Project) => {
          const IconComp = iconMap[project.icon] || Target;
          const isHex = (str: string) => str?.startsWith('#');

          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-white rounded-[32px] p-10 shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-[#f1f5f9] flex flex-col gap-9 transition-all hover:shadow-[0_12px_60px_rgba(0,0,0,0.06)] group relative block"
            >
              <div className="flex items-start justify-between">
                <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500 relative overflow-hidden ${isHex(project.color) ? '' : project.color}`}>
                  {isHex(project.color) && <div className="absolute inset-0 opacity-15" style={{ backgroundColor: project.color }}></div>}
                  <IconComp
                    className={`w-10 h-10 relative z-10 ${isHex(project.iconColor) ? '' : project.iconColor}`}
                    style={isHex(project.iconColor) ? { color: project.iconColor } : undefined}
                  />
                </div>
                <div className="relative">
                  <button
                    className="p-2 -mr-2 hover:bg-gray-50 rounded-xl transition-colors relative z-20"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveDropdownId(activeDropdownId === project.id ? null : project.id);
                    }}
                  >
                    <MoreVertical className="w-6 h-6 text-gray-400" />
                  </button>
                  {activeDropdownId === project.id && (
                    <div className="absolute top-10 right-0 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveDropdownId(null); openEditModal(project); }}
                        className="w-full text-left px-4 py-2 text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                      >수정</button>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveDropdownId(null); setDeletingProjectId(project.id); }}
                        className="w-full text-left px-4 py-2 text-[14px] font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >삭제</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="inline-block px-4 py-1.5 rounded-[10px] border border-[#e2e8f0] bg-white">
                  <span className="text-[13px] font-bold text-gray-500">{project.course}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-[24px] font-black text-gray-900 tracking-tight leading-tight">{project.name}</h3>
                  <p className="text-[16px] text-gray-400 font-medium leading-relaxed">{project.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[14px] font-bold text-gray-400">전체 진척도</span>
                    <span className="text-[15px] font-black text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${isHex(project.progressColor) ? '' : project.progressColor}`}
                      style={{
                        width: `${project.progress}%`,
                        ...(isHex(project.progressColor) ? { backgroundColor: project.progressColor } : {})
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-9 mt-2 border-t border-[#f1f5f9]">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-gray-400">
                      <Calendar className="w-5 h-5" />
                      <span className="pt-0.5">{project.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[14px] font-bold text-gray-400">
                      <Users className="w-5 h-5" />
                      <span className="pt-0.5">{project.members}명</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                    <Clock className="w-5 h-5 text-[#3b82f6]" />
                    <AlertCircle className="w-5 h-5 text-gray-100" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-[14px]">
                  <Target className="w-6 h-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">{editingProjectId ? "프로젝트 수정" : "새 프로젝트 추가"}</h2>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); setEditingProjectId(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">프로젝트명 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-[16px] text-gray-900 text-[15px] font-medium placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                    placeholder="예: 데이터베이스 설계 프로젝트"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">과목명/소속</label>
                  <input
                    type="text"
                    value={newProject.course}
                    onChange={(e) => setNewProject({ ...newProject, course: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-[16px] text-gray-900 text-[15px] font-medium placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                    placeholder="예: 데이터베이스, 창업동아리"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">마감일</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-[16px] text-gray-900 text-[15px] font-medium placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">프로젝트 색상</label>
                  <div className="flex items-center gap-3">
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewProject({ ...newProject, colorId: c.id })}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${c.color} ${newProject.colorId === c.id ? `ring-2 ring-offset-2 ${c.ringColor} scale-110 shadow-md` : 'hover:scale-105 opacity-80'}`}
                      >
                        {newProject.colorId === c.id && <Check className={`w-5 h-5 ${c.iconColor}`} />}
                      </button>
                    ))}

                    {/* Custom Color Input */}
                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-full cursor-pointer transition-all overflow-hidden border border-gray-200 ${newProject.colorId === 'custom' ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-md' : 'hover:scale-105'}`}>
                      <input
                        type="color"
                        value={newProject.customColor}
                        onChange={(e) => setNewProject({ ...newProject, colorId: 'custom', customColor: e.target.value })}
                        className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0 z-10"
                        title="사용자 지정 색상"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: newProject.customColor }}></div>
                      {newProject.colorId === 'custom' && (
                        <Check className="absolute w-5 h-5 text-white mix-blend-difference z-0" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1">설명</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-[16px] text-gray-900 text-[15px] font-medium placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none resize-none min-h-[100px]"
                    placeholder="프로젝트의 목표나 간략한 설명을 적어주세요!"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[16px] rounded-[16px] transition-colors shadow-[0_4px_12px_rgba(79,70,229,0.3)]"
                >
                  {editingProjectId ? "변경사항 저장" : "프로젝트 시작하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProjectId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setDeletingProjectId(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-[24px] p-6 shadow-xl animate-in fade-in zoom-in duration-200 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">프로젝트 삭제</h3>
            <p className="text-[14px] text-gray-500 font-medium mb-8">정말로 이 프로젝트를 삭제하시겠습니까?<br />관련된 모든 데이터가 삭제되며, 복구할 수 없습니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingProjectId(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-[14px] hover:bg-gray-200 transition-colors">취소</button>
              <button onClick={handleDeleteProject} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-[14px] hover:bg-red-600 transition-colors shadow-lg shadow-red-200">삭제하기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}