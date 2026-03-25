import { useState, useEffect, useRef } from "react";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  TrendingUp,
  Bell,
  ChevronRight,
  ChevronDown,
  Check,
  Building2,
  AlertCircle,
  Award,
  Users,
  Flame,
  LayoutDashboard as DashIcon,
  Calendar as CalendarIcon,
  Users2,
  BarChart3,
  CheckCircle2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { initialTasks, initialWorkspace } from "../mockData";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { projectApi, Project } from "../api/projectApi";

export default function Dashboard() {
  const { user } = useAuth();
  const isTestUser = user?.isTestUser;

  const [selectedProject, setSelectedProject] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    projectApi.getProjects().then(data => setProjects(data)).catch(console.error);

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tasks = isTestUser ? initialTasks : [];
  const workspace = isTestUser ? initialWorkspace : null;

  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const progressPercent = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const stats = [
    {
      label: "진행 프로젝트",
      value: isTestUser ? "1" : "0",
      icon: FolderKanban,
      color: "bg-blue-500",
    },
    {
      label: "할 일 완료",
      value: `${doneTasks}/${tasks.length}`,
      icon: CheckSquare,
      color: "bg-green-500",
    },
    {
      label: "남은 기한",
      value: isTestUser ? "D-110" : "-",
      icon: Clock,
      color: "bg-orange-500",
    },
    {
      label: "완료율",
      value: `${progressPercent}%`,
      icon: TrendingUp,
      color: "bg-purple-500",
    },
  ];

  // Contribution data (Mock)
  const contributionData = isTestUser ? [
    { name: '나 (팀장)', tasks: 12, attendance: 100, compliance: 95, color: '#4f46e5' },
    { name: '김철수', tasks: 8, attendance: 90, compliance: 85, color: '#10b981' },
    { name: '이영희', tasks: 10, attendance: 95, compliance: 90, color: '#f59e0b' },
    { name: '박민수', tasks: 4, attendance: 70, compliance: 60, color: '#ef4444' },
  ] : [];

  const taskDistribution = isTestUser ? [
    { name: '완료', value: 34, color: '#10b981' },
    { name: '진행중', value: 12, color: '#3b82f6' },
    { name: '대기', value: 8, color: '#94a3b8' },
    { name: '지연', value: 3, color: '#ef4444' },
  ] : [
    { name: '데이터 없음', value: 100, color: '#e2e8f0' }
  ];

  const contributionStats = isTestUser ? [
    { label: "최고 기여자", value: "나 (팀장)", icon: Award, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "평균 달성률", value: "88%", icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "주의 멤버", value: "1명", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
    { label: "연속 협업일", value: "12일", icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
  ] : [
    { label: "최고 기여자", value: "-", icon: Award, color: "text-gray-400", bg: "bg-gray-50" },
    { label: "평균 달성률", value: "0%", icon: TrendingUp, color: "text-gray-400", bg: "bg-gray-50" },
    { label: "주의 멤버", value: "0명", icon: AlertCircle, color: "text-gray-400", bg: "bg-gray-50" },
    { label: "연속 협업일", value: "0일", icon: Flame, color: "text-gray-400", bg: "bg-gray-50" },
  ];

  return (
    <div className="space-y-6 p-4 pb-24 max-w-5xl mx-auto bg-[#f8faff]">
      {/* Header Card - Redesigned */}
      <div className="bg-white rounded-[24px] p-8 text-gray-900 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-gray-500 text-xs font-medium">참여중인</p>
              <h1 className="text-3xl font-bold tracking-tight">프로젝트</h1>
            </div>
            <Link to="/notifications" className="p-2 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm border border-gray-100">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-600" />
                {isTestUser && <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>}
              </div>
            </Link>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600">전체 진행률</span>
              <span className="text-sm font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#6366f1] h-full rounded-full transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
        {/* Subtle decorative circles from the image */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-4 left-10 w-4 h-4 rounded-full border border-gray-300"></div>
          <div className="absolute top-20 left-40 w-6 h-6 rounded-full border border-gray-300"></div>
          <div className="absolute top-10 right-20 w-8 h-8 rounded-full border border-gray-300"></div>
        </div>
      </div>

      {/* Notice Card - Restored */}
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-xl">
              <Bell className="w-5 h-5 text-orange-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">공지사항</h2>
          </div>
          {isTestUser && <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-lg">새 소식 3개</span>}
        </div>

        <div className="space-y-6">
          {workspace?.notice ? [
            { title: workspace.notice, date: new Date().toLocaleDateString(), color: "bg-emerald-500", icon: AlertCircle },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className={`${item.color} p-2.5 rounded-xl shadow-sm`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-800">{item.title}</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{item.date}</p>
              </div>
            </div>
          )) : (
            <div className="text-center py-6">
              <p className="text-sm font-bold text-gray-400">등록된 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Contribution Dashboard - Redesigned */}
      <div className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              팀 기여 분석
            </h2>
            <p className="text-xs text-gray-400 font-medium">팀원별 활동 내역과 기여도를 확인하세요</p>
          </div>

          {/* Custom Project Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-[240px] bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 shadow-sm transition-all hover:bg-gray-50 group"
            >
              <span className="truncate pr-2">
                {selectedProject === "all" ? "전체 프로젝트 보기" : projects.find(p => p.id.toString() === selectedProject)?.name}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                <div className="max-h-[240px] overflow-y-auto outline-none py-1.5 scrollbar-hide">
                  <button
                    onClick={() => { setSelectedProject("all"); setIsDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[14px] font-bold transition-colors flex items-center justify-between ${selectedProject === "all" ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-50"
                      }`}
                  >
                    <span>전체 프로젝트 보기</span>
                    {selectedProject === "all" && <Check className="w-4 h-4 text-indigo-600" />}
                  </button>
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedProject(p.id.toString()); setIsDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[14px] font-bold transition-colors flex items-center justify-between ${selectedProject === p.id.toString() ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <span className="truncate pr-2">{p.name}</span>
                      {selectedProject === p.id.toString() && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contribution Quick Stats - Colors from image */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "총 작업량", value: isTestUser ? "14,283건" : "0건", icon: BarChart3, bg: "bg-[#fff7ed]", iconColor: "text-[#f97316]" },
            { label: "완료율", value: isTestUser ? "68%" : "0%", icon: CheckCircle2, bg: "bg-[#f0fdf4]", iconColor: "text-[#10b981]" },
            { label: "남은 작업", value: isTestUser ? "18건" : "0건", icon: AlertCircle, bg: "bg-[#fef2f2]", iconColor: "text-[#ef4444]" },
            { label: "팀원 수", value: isTestUser ? "12명" : "1명", icon: Users2, bg: "bg-[#f0f7ff]", iconColor: "text-[#2563eb]" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-5 rounded-[24px] border border-gray-50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] flex flex-col items-center text-center gap-4 transition-all hover:shadow-md">
              <div className={`w-12 h-12 rounded-[16px] ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{stat.label}</p>
                <p className="text-[18px] font-black text-gray-900 leading-none">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Contribution Bars - Matches image style */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 mb-8 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              팀원별 기여도
            </h3>
            <div className="space-y-8">
              {isTestUser ? (selectedProject === "all" ? [
                { name: "나 (팀장)", percent: 38, color: "bg-[#4f46e5]", tasks: 145 },
                { name: "김철수", percent: 28, color: "bg-[#10b981]", tasks: 108 },
                { name: "이영희", percent: 20, color: "bg-[#f59e0b]", tasks: 76 },
                { name: "박민수", percent: 14, color: "bg-[#ef4444]", tasks: 53 },
              ] : selectedProject === "p1" ? [
                { name: "나 (팀장)", percent: 65, color: "bg-[#4f46e5]", tasks: 45 },
                { name: "김철수", percent: 20, color: "bg-[#10b981]", tasks: 14 },
                { name: "이영희", percent: 15, color: "bg-[#f59e0b]", tasks: 10 },
                { name: "박민수", percent: 0, color: "bg-[#ef4444]", tasks: 0 },
              ] : [
                { name: "이영희", percent: 55, color: "bg-[#f59e0b]", tasks: 32 },
                { name: "김철수", percent: 30, color: "bg-[#10b981]", tasks: 18 },
                { name: "박민수", percent: 10, color: "bg-[#ef4444]", tasks: 6 },
                { name: "나 (팀장)", percent: 5, color: "bg-[#4f46e5]", tasks: 3 },
              ]).map((member, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">{member.name}</span>
                      <span className="text-[10px] font-medium bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{member.tasks}건</span>
                    </div>
                    <span className="text-gray-900">{member.percent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${member.color} h-full rounded-full transition-all duration-1000`}
                      style={{ width: `${member.percent}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-sm font-bold text-gray-400">참여자 데이터가 없습니다.</div>
              )}
            </div>
          </div>

          {/* Project Composition Pie Chart - Matches image style */}
          <div className="bg-white p-8 rounded-[32px] border border-gray-50 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 mb-8 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              프로젝트 구성 비율
            </h3>
            <div className="flex flex-col items-center">
              <div className="relative w-[180px] h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={0}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                    >
                      {taskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900">100%</span>
                  <span className="text-[10px] text-gray-400 font-bold">전체</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-8 w-full">
                {taskDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[11px] font-bold text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-[11px] font-bold text-gray-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
