import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { projectApi, Project } from "../api/projectApi";
import { taskApi } from "../api/taskApi";
import { Task } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  ChevronLeft, Database, Plus, Users, Calendar, Clock, Zap, BarChart3, Target,
  CheckCircle2, AlertCircle, FileText, MessageSquare, MoreVertical, LayoutDashboard, X
} from "lucide-react";

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTestUser = user?.isTestUser;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    Promise.all([
      projectApi.getProjects(),
      taskApi.getTasks()
    ]).then(([projectsData, tasksData]) => {
      const found = projectsData.find(p => p.id.toString() === projectId);
      if (found) setProject(found);

      const filteredTasks = tasksData.filter(t => t.workspaceId === projectId);
      setTasks(filteredTasks);

      setIsLoading(false);
    }).catch(err => {
      console.error(err);
      setIsLoading(false);
    });
  }, [projectId]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !projectId) return;
    try {
      const created = await taskApi.createTask({
        workspaceId: projectId,
        title: newTaskTitle,
        status: 'TODO',
        priority: 'medium',
        deadline: new Date().toISOString().split('T')[0],
        assignees: [user?.name || '담당자 미정']
      });
      setTasks([created, ...tasks]);
      setIsTaskModalOpen(false);
      setNewTaskTitle("");
    } catch (err) {
      console.error("작업 생성 실패:", err);
    }
  };

  const iconMap: Record<string, React.ElementType> = {
    Database, Zap, BarChart3, Target
  };

  const isMockProject = isTestUser && project?.name === "데이터베이스 설계 프로젝트";

  const projectMembers = isMockProject ? [
    { id: 1, name: "나 (팀장)", avatarColor: "bg-[#6366f1]" },
    { id: 2, name: "김철수", avatarColor: "bg-[#10b981]" },
    { id: 3, name: "이영희", avatarColor: "bg-[#d946ef]" },
    { id: 4, name: "박민수", avatarColor: "bg-[#f97316]" },
  ] : [
    { id: 1, name: user?.name || "사용자", avatarColor: "bg-[#6366f1]" }
  ];

  // Map backend Tasks to display format for recent tasks
  const displayTasks = tasks.map(t => {
    let statusKo = '대기중';
    if (t.status === 'IN_PROGRESS') statusKo = '진행중';
    else if (t.status === 'DONE') statusKo = '완료';
    else if (t.status === 'TODO') statusKo = '대기중';
    else if (t.status === 'IN_REVIEW') statusKo = '검토중';

    return {
      id: t.id,
      title: t.title,
      status: statusKo,
      assignee: t.assignees?.[0] || '담당자 미정',
      date: t.deadline?.substring(5).replace('-', '.') || '날짜 없음',
      rawStatus: t.status
    };
  }).slice(0, 5);

  const recentFiles = isMockProject ? [
    { id: 1, name: "요구사항_명세서_v1.pdf", size: "2.4MB", uploader: "이영희", date: "03.05" },
    { id: 2, name: "ERD_초안_draft.png", size: "1.1MB", uploader: "나 (팀장)", date: "03.08" },
  ] : [];

  if (isLoading) return <div className="p-10 text-center font-bold text-gray-500 min-h-screen bg-[#f8faff] flex flex-col items-center justify-center">프로젝트 정보를 불러오는 중입니다...</div>;
  if (!project) return <div className="p-10 text-center font-bold text-gray-500 min-h-screen bg-[#f8faff] flex flex-col items-center justify-center">프로젝트를 찾을 수 없습니다.</div>;

  const IconComp = iconMap[project.icon] || Target;
  const isHex = (str?: string) => str?.startsWith('#');

  return (
    <div className="flex flex-col h-full bg-[#f8faff] min-h-screen">
      {/* Header Sticky */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/projects")}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden ${isHex(project.color) ? '' : (project.color || 'bg-[#f0f7ff]')}`}
            >
              {isHex(project.color) && <div className="absolute inset-0 opacity-15" style={{ backgroundColor: project.color }}></div>}
              <IconComp
                className={`w-5 h-5 relative z-10 ${isHex(project.iconColor) ? '' : (project.iconColor || 'text-indigo-500')}`}
                style={isHex(project.iconColor) ? { color: project.iconColor } : undefined}
              />
            </div>
            <div>
              <p className="text-[12px] font-bold text-gray-400 leading-none mb-1">{project.course || "소속 없음"}</p>
              <h1 className="text-[18px] font-black text-gray-900 tracking-tight leading-none">{project.name}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[14px] font-bold hover:bg-indigo-100 transition-colors">
            <LayoutDashboard className="w-4 h-4" />
            칸반 뷰
          </button>
          <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8 pb-24">

        {/* Project Overview Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-[#f1f5f9] relative overflow-hidden">
          {/* Background Decoration */}
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-bl-full -z-10 opacity-50 blur-3xl ${isHex(project.color) ? '' : (project.color || 'bg-indigo-50')}`}
            style={isHex(project.color) ? { backgroundColor: project.color } : undefined}
          ></div>

          <div className="flex flex-col md:flex-row gap-8 justify-between">
            <div className="space-y-6 flex-1">
              <div>
                <h2 className="text-[28px] font-black text-gray-900 tracking-tight mb-2">{project.name}</h2>
                <p className="text-[16px] text-gray-500 font-medium leading-relaxed max-w-2xl">{project.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-[12px] font-bold text-gray-400">마감일</p>
                    <p className="text-[15px] font-black text-gray-900">{project.deadline}</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-100"></div>
                <div>
                  <p className="text-[12px] font-bold text-gray-400 mb-1">참여 팀원</p>
                  <div className="flex -space-x-2">
                    {projectMembers.map((member) => (
                      <div
                        key={member.id}
                        className={`w-8 h-8 rounded-full ${member.avatarColor} border-2 border-white flex items-center justify-center text-white text-[12px] font-bold shadow-sm`}
                        title={member.name}
                      >
                        {member.name[0]}
                      </div>
                    ))}
                    <button className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Circle (Simplified for UI) */}
            <div className="bg-gray-50 rounded-3xl p-6 flex flex-col items-center justify-center min-w-[200px] border border-gray-100">
              <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
                  <circle
                    cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * (project.progress || 0)) / 100}
                    className={isHex(project.iconColor) ? '' : (project.iconColor || 'text-indigo-500')}
                    style={isHex(project.iconColor) ? { color: project.iconColor } : undefined}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[24px] font-black text-gray-900">{project.progress || 0}%</span>
                </div>
              </div>
              <p className="text-[14px] font-bold text-gray-500">전체 진척도</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Recent Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-black text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                최근 작업
              </h3>
              <button className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700">전체보기</button>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-2 space-y-1">
              {displayTasks.length > 0 ? displayTasks.map((task) => (
                <div key={task.id} className="p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full shadow-sm ${task.rawStatus === "DONE" ? "bg-green-500" :
                      task.rawStatus === "IN_PROGRESS" ? "bg-blue-500" : "bg-gray-300"
                      }`}></div>
                    <div>
                      <h4 className="text-[15px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                      <div className="flex items-center gap-2 text-[12px] font-medium text-gray-400 mt-1">
                        <span>{task.assignee}</span>
                        <span>•</span>
                        <span>{task.date} 마감</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[11px] font-bold ${task.rawStatus === "DONE" ? "bg-green-50 text-green-600" :
                    task.rawStatus === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                    }`}>
                    {task.status}
                  </span>
                </div>
              )) : (
                <div className="p-6 text-center text-gray-400 text-sm font-bold">진행중인 작업이 없습니다.</div>
              )}
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2 text-[14px] font-bold mt-2"
              >
                <Plus className="w-5 h-5" />
                새 작업 추가
              </button>
            </div>
          </div>

          {/* Files & Discussions */}
          <div className="space-y-8">
            {/* Files */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  파일 및 문서
                </h3>
                <button onClick={() => navigate("/drive")} className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700">전체보기</button>
              </div>
              <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-4 space-y-3">
                {recentFiles.length > 0 ? recentFiles.map((file) => (
                  <div key={file.id} className="p-4 rounded-xl border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{file.name}</p>
                        <p className="text-[12px] font-medium text-gray-400">{file.size} • {file.uploader}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-4 text-center text-gray-400 text-sm font-bold">업로드된 파일이 없습니다.</div>
                )}
              </div>
            </div>

            {/* Quick Chat Entry */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[24px] p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
              <MessageSquare className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="relative z-10">
                <h3 className="text-[18px] font-black mb-2">팀 채팅방 참여</h3>
                <p className="text-[14px] text-indigo-100 font-medium mb-6 max-w-[200px]">이 프로젝트의 팀원들과 실시간으로 소통하세요.</p>
                <button
                  onClick={() => navigate("/chat")}
                  className="px-6 py-2.5 bg-white text-indigo-600 text-[14px] font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                  입장하기
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsTaskModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-black text-gray-900">새 작업 추가</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-6">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2 ml-1">작업명 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-5 py-3.5 bg-[#f8faff] border border-transparent rounded-[16px] text-gray-900 text-[14px] font-medium placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  placeholder="예: 프론트엔드 UI 설계"
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white text-[15px] font-bold rounded-[16px] hover:bg-indigo-700 active:scale-95 transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
                작업 추가하기
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
