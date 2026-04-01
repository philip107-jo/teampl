import { useParams, useNavigate } from "react-router";
import { 
  ChevronLeft, Users, Trophy, Target, 
  CheckCircle2, Clock, PlayCircle, TrendingUp,
  Plus, Calendar as CalendarIcon, ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { initialMembers, initialMessages } from "../mockData";
import { Task } from "../types";
import { taskApi } from "../api/taskApi";

export default function MemberTasks() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.getTasks()
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [projectId]);

  const calculateStats = (memberId: string) => {
    const memberTasks = tasks.filter(t => t.assignees.includes(memberId));
    if (memberTasks.length === 0) return { score: 0, completed: 0, total: 0, chatCount: 0 };

    let totalPotential = 0;
    let totalEarned = 0;
    let completedCount = 0;

    memberTasks.forEach(task => {
      const priorityWeight = task.priority === 'high' ? 1.5 : task.priority === 'medium' ? 1.0 : 0.8;
      const basePoints = task.difficulty * priorityWeight;
      totalPotential += basePoints * 1.2;

      if (task.status === 'DONE') {
        completedCount++;
        let timeFactor = 1.0;
        if (task.completedAt && task.deadline) {
          const completed = new Date(task.completedAt);
          const deadline = new Date(task.deadline);
          if (completed <= deadline) timeFactor = 1.2;
          else timeFactor = 0.7;
        }
        totalEarned += basePoints * timeFactor;
      }
    });

    const userMessages = initialMessages.filter(m => m.userId === memberId);
    totalEarned += userMessages.length * 2;
    totalPotential += 10; 

    const score = totalPotential > 0 ? Math.min(100, Math.round((totalEarned / totalPotential) * 100)) : 0;
    return { score, completed: completedCount, total: memberTasks.length, chatCount: userMessages.length };
  };

  return (
    <div className="dashboard pt-6 pb-32">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(`/projects/${projectId}`)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1A2340] flex items-center justify-center shadow-xl shadow-black/5 hover:scale-110 active:scale-95 transition-all text-[#1A2340] dark:text-white border border-gray-100 dark:border-white/5"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#7C6CFF] animate-pulse"></div>
              <p className="text-[12px] font-black text-[#7D879C] uppercase tracking-[0.2em]">Project Insights</p>
            </div>
            <h1 className="text-[32px] font-black text-[#1A2340] dark:text-white tracking-tight leading-none">팀원별 업무 대시보드</h1>
          </div>
        </div>
        
        <div className="flex -space-x-4">
          {initialMembers.map((m, i) => (
            <div key={m.id} className="group relative">
               <div className={`w-12 h-12 rounded-2xl ${m.avatarColor || 'bg-[#7C6CFF]'} border-4 border-[var(--theme-bg)] flex items-center justify-center text-white font-black shadow-lg hover:-translate-y-2 transition-all cursor-pointer`}>
                {m.name[0]}
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#1A2340] text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                {m.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="w-16 h-16 border-4 border-[#7C6CFF]/20 border-t-[#7C6CFF] rounded-full animate-spin"></div>
          <p className="text-[#7C6CFF] font-black uppercase tracking-widest text-[12px] animate-pulse">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {initialMembers.map((member, index) => {
            const stats = calculateStats(member.id);
            const memberTasks = tasks.filter(t => t.assignees.includes(member.id));
            const inProgressTasks = memberTasks.filter(t => t.status !== 'DONE');
            const completedTasks = memberTasks.filter(t => t.status === 'DONE');

            return (
              <section 
                key={member.id} 
                className="relative animate-in fade-in slide-in-from-bottom-8 duration-700" 
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="card !p-0 overflow-hidden border border-gray-100 dark:border-white/5 bg-white/40 dark:bg-[#151C31]/40 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_70px_rgba(0,0,0,0.1)] transition-all duration-500">
                  <div className="flex flex-col lg:flex-row">
                    {/* Left Profile Panel */}
                    <div className="lg:w-[340px] p-10 bg-white/40 dark:bg-white/5 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-white/5 flex flex-col items-center justify-between text-center">
                      <div className="w-full space-y-6">
                        <div className="relative inline-block mx-auto">
                          <div className={`w-24 h-24 rounded-[32px] ${member.avatarColor || 'bg-[#7C6CFF]'} flex items-center justify-center text-[32px] font-black text-white shadow-2xl shadow-black/10 rotate-3`}>
                            {member.name[0]}
                          </div>
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-[#1A2340] rounded-2xl flex items-center justify-center shadow-lg border border-gray-100 dark:border-white/10">
                            <Trophy className={`w-5 h-5 ${stats.score >= 80 ? "text-yellow-500" : "text-gray-300"}`} />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-[24px] font-black text-[#1A2340] dark:text-white tracking-tight">{member.name}</h3>
                          <p className="text-[12px] font-black text-[#7D879C] uppercase tracking-[0.3em] mt-1 opacity-60">{member.department || 'Team Member'}</p>
                        </div>
                        
                        <div className="py-6 px-1 bg-[#7C6CFF]/5 rounded-3xl border border-[#7C6CFF]/10">
                          <p className="text-[42px] font-black text-[#7C6CFF] leading-none mb-1 tracking-tighter">{stats.score}%</p>
                          <p className="text-[10px] font-bold text-[#7C6CFF] uppercase tracking-widest">실시간 기여도 점수</p>
                        </div>
                      </div>

                      <div className="w-full pt-8">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between px-2">
                             <div className="flex items-center gap-2 text-[11px] font-bold text-[#7D879C] uppercase tracking-widest">
                              <TrendingUp className="w-4 h-4" /> 소통 점수
                            </div>
                            <span className="text-[11px] font-black text-[#7C6CFF]">{stats.chatCount * 2} Pts</span>
                          </div>
                          <div className="flex gap-1.5 px-1">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div 
                                key={i} 
                                className={`h-1.5 flex-1 rounded-full transition-all duration-1000 ${
                                  i < (stats.chatCount || 0) ? "bg-[#7C6CFF] shadow-[0_0_8px_rgba(124,108,255,0.6)]" : "bg-gray-100 dark:bg-white/5"
                                }`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Tasks Panel */}
                    <div className="flex-1 p-10 lg:p-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Column: Active */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[15px] font-black text-[#1A2340] dark:text-white uppercase tracking-widest flex items-center gap-3">
                              <PlayCircle className="w-5 h-5 text-[#7C6CFF]" />
                              진행 중인 작업
                            </h4>
                            <span className="px-3 py-1 bg-[#7C6CFF]/10 text-[#7C6CFF] rounded-full text-[10px] font-black">{inProgressTasks.length}</span>
                          </div>
                          
                          <div className="space-y-4">
                            {inProgressTasks.length > 0 ? (
                              inProgressTasks.map(task => (
                                <div key={task.id} className="group/task p-6 rounded-[24px] bg-white dark:bg-[#1A2340] border border-gray-100 dark:border-white/5 hover:border-[#7C6CFF]/30 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.02)] translate-y-0 hover:-translate-y-1">
                                  <div className="flex items-start justify-between mb-4">
                                     <h5 className="text-[16px] font-black text-[#1A2340] dark:text-white group-hover/task:text-[#7C6CFF] transition-colors">{task.title}</h5>
                                     <div className={`w-2 h-2 rounded-full ${task.status === 'IN_PROGRESS' ? 'bg-[#7C6CFF] animate-pulse shadow-[0_0_10px_#7C6CFF]' : 'bg-gray-200'}`}></div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7D879C]">
                                      <CalendarIcon className="w-3.5 h-3.5" />
                                      {task.deadline}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#7C6CFF] bg-[#7C6CFF]/5 px-2 py-0.5 rounded-lg">
                                      Lvl.{task.difficulty}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[32px] opacity-40">
                                <p className="text-[13px] font-bold text-[#7D879C]">진행 중인 작업이 없습니다.</p>
                              </div>
                            )}
                            <button className="w-full p-4 rounded-[20px] border border-dashed border-gray-200 dark:border-white/10 text-[#7D879C] hover:border-[#7C6CFF]/40 hover:text-[#7C6CFF] transition-all flex items-center justify-center gap-2 text-[12px] font-black uppercase">
                              <Plus className="w-4 h-4" /> 새로운 업무 할당
                            </button>
                          </div>
                        </div>

                        {/* Column: Completed */}
                        <div className="space-y-6">
                           <div className="flex items-center justify-between">
                            <h4 className="text-[15px] font-black text-[#7D879C] uppercase tracking-widest flex items-center gap-3">
                              <CheckCircle2 className="w-5 h-5 text-[#23D7A1]" />
                              완료된 작업
                            </h4>
                            <span className="px-3 py-1 bg-gray-100 dark:bg-white/5 text-[#7D879C] rounded-full text-[10px] font-black">{completedTasks.length}</span>
                          </div>

                          <div className="space-y-4">
                            {completedTasks.length > 0 ? (
                              completedTasks.map(task => (
                                <div key={task.id} className="p-6 rounded-[24px] bg-gray-50/50 dark:bg-white/5 border border-transparent grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:bg-white dark:hover:bg-[#1A2340] hover:border-[#23D7A1]/20 transition-all duration-500">
                                  <h5 className="text-[15px] font-bold text-[#1A2340] dark:text-white line-through decoration-2 decoration-[#23D7A1]/40 mb-3">{task.title}</h5>
                                  <div className="flex items-center gap-3 text-[10px] font-black text-[#23D7A1] uppercase tracking-widest">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Successfully Completed
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-[32px] opacity-40">
                                <p className="text-[13px] font-bold text-[#7D879C]">아직 완료된 작업이 없습니다.</p>
                              </div>
                            )}
                            
                            <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#7C6CFF]/10 to-transparent border border-[#7C6CFF]/5 flex items-center justify-between group cursor-pointer hover:from-[#7C6CFF]/20 transition-all">
                               <div>
                                 <p className="text-[12px] font-black text-[#7C6CFF] uppercase tracking-widest mb-1">Performance Insight</p>
                                 <p className="text-[14px] font-bold text-[#1A2340] dark:text-white">기여도 분석 보고서 보기</p>
                               </div>
                               <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1A2340] flex items-center justify-center group-hover:translate-x-2 transition-transform">
                                 <ArrowRight className="w-5 h-5 text-[#7C6CFF]" />
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
