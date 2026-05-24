import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { taskApi } from "../api/taskApi";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { Crown, CheckCircle2, Clock, Circle, Eye, Mail, GraduationCap, TrendingUp, Phone, Video, MessageSquare } from "lucide-react";
import { useCall } from "../context/CallContext";
import Avatar from "./Avatar";

interface MembersTabProps {
  projectId: number;
  members: any[];
  isReadOnly?: boolean;
}

export default function MembersTab({ projectId, members }: MembersTabProps) {
  const navigate = useNavigate();
  const { onlineUsers } = useChat();
  const { user } = useAuth();
  const { startCall, inCallUsers } = useCall();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    taskApi.getTasks(projectId)
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const getStats = (email: string) => {
    const myTasks = tasks.filter(t => t.assignees?.includes(email));
    const done = myTasks.filter(t => t.status === "DONE").length;
    const inProgress = myTasks.filter(t => t.status === "IN_PROGRESS").length;
    const inReview = myTasks.filter(t => t.status === "IN_REVIEW").length;
    const todo = myTasks.filter(t => t.status === "TODO").length;
    const rate = myTasks.length > 0 ? Math.round((done / myTasks.length) * 100) : 0;
    const contribution = tasks.length > 0 ? Math.round((myTasks.length / tasks.length) * 100) : 0;
    return { total: myTasks.length, done, inProgress, inReview, todo, rate, contribution, tasks: myTasks };
  };

  const roleConfig: Record<string, { label: string; cls: string; icon: any }> = {
    LEADER: { label: "팀장", cls: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20", icon: Crown },
    MEMBER: { label: "팀원", cls: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20", icon: null },
  };

  const currentUserIsLeader = members.find(m => m.email === user?.email)?.role === "LEADER";

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white">팀원 현황</h2>
        <span className="text-[13px] font-bold text-gray-400 dark:text-white/30">
          {members.length}명 · {onlineUsers.filter(e => members.some(m => m.email === e)).length}명 온라인
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#11B886]/20 border-t-[#11B886] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map(member => {
            const stats = getStats(member.email);
            const isOnline = onlineUsers.includes(member.email);
            const rCfg = roleConfig[member.role] || roleConfig.MEMBER;
            const isMe = member.email === user?.email;
            const isInCall = inCallUsers.includes(member.email);

            return (
              <button
                key={member.id}
                onClick={() => setSelected(selected?.id === member.id ? null : member)}
                className={`text-left bg-white dark:bg-[#12182B] rounded-2xl border transition-all hover:shadow-md
                  ${selected?.id === member.id
                    ? "border-[#11B886] shadow-[0_0_0_2px_rgba(17,184,134,0.15)]"
                    : "border-gray-100 dark:border-white/10"
                  }`}
              >
                <div className="p-5">
                  {/* 상단: 아바타 + 이름 + 온라인 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar
                          name={member.name}
                          avatarUrl={member.avatarUrl}
                          className="w-12 h-12 text-[18px]"
                        />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#12182B] ${
                          isInCall 
                            ? "bg-red-500 animate-pulse animate-duration-1000" 
                            : isOnline 
                              ? "bg-[#11B886]" 
                              : "bg-gray-300 dark:bg-white/20"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-black text-[#1A2340] dark:text-white">{member.name}</span>
                          {isMe && <span className="text-[10px] font-black text-[#11B886] bg-[#11B886]/10 px-1.5 py-0.5 rounded-full">나</span>}
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${rCfg.cls}`}>
                          {rCfg.icon && <rCfg.icon className="w-2.5 h-2.5" />}
                          {rCfg.label}
                        </span>
                      </div>
                    </div>
                    {isInCall ? (
                      <span className="text-[10px] font-black px-2 py-1 rounded-full text-red-500 bg-red-500/10 animate-pulse shrink-0">
                        전화 중
                      </span>
                    ) : (
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isOnline ? "text-[#11B886] bg-[#11B886]/10" : "text-gray-400 dark:text-white/30 bg-gray-100 dark:bg-white/5"}`}>
                        {isOnline ? "온라인" : "오프라인"}
                      </span>
                    )}
                  </div>

                  {/* 진행률 바 */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-bold text-gray-500 dark:text-white/40">완료율</span>
                      <span className="text-[11px] font-black text-[#1A2340] dark:text-white">{stats.rate}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#11B886] rounded-full transition-all duration-700"
                        style={{ width: `${stats.rate}%` }}
                      />
                    </div>
                  </div>

                  {/* 통계 칩 */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: "할 일", count: stats.todo, color: "text-gray-500 bg-gray-50 dark:bg-white/5" },
                      { label: "진행", count: stats.inProgress, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" },
                      { label: "검토", count: stats.inReview, color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" },
                      { label: "완료", count: stats.done, color: "text-[#11B886] bg-[#11B886]/5 dark:bg-[#11B886]/10" },
                    ].map(s => (
                      <div key={s.label} className={`rounded-xl p-2 text-center ${s.color}`}>
                        <p className="text-[14px] font-black leading-tight">{s.count}</p>
                        <p className="text-[9px] font-black uppercase tracking-wider mt-0.5 opacity-70">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 펼쳐지는 상세 */}
                {selected?.id === member.id && (
                  <div className="border-t border-gray-100 dark:border-white/10 px-5 py-4 space-y-3">
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-white/40">
                      <Mail className="w-3.5 h-3.5" />
                      {member.email}
                    </div>
                    {member.department && (
                      <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-white/40">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {member.department}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-white/40">
                      <TrendingUp className="w-3.5 h-3.5" />
                      프로젝트 기여도 {stats.contribution}% ({stats.total}개 담당)
                    </div>

                    {stats.tasks.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">담당 과제</p>
                        {stats.tasks.slice(0, 4).map(t => (
                          <div key={t.id} className="flex items-center gap-2">
                            {t.status === "DONE" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#11B886] flex-shrink-0" />
                            ) : t.status === "IN_PROGRESS" ? (
                              <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            ) : t.status === "IN_REVIEW" ? (
                              <Eye className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                            )}
                            <span className={`text-[12px] truncate ${t.status === "DONE" ? "line-through text-gray-400 dark:text-white/30" : "text-gray-700 dark:text-white/70"}`}>
                              {t.title}
                            </span>
                          </div>
                        ))}
                        {stats.tasks.length > 4 && (
                          <p className="text-[11px] text-gray-400 dark:text-white/30 ml-5">+{stats.tasks.length - 4}개 더...</p>
                        )}
                      </div>
                    )}

                    {/* 통화 및 메시지 시작 버튼 그룹 */}
                    {!isMe && (
                      <div className="space-y-2.5 pt-3 mt-2 border-t border-gray-100 dark:border-white/5 animate-in fade-in duration-300">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/projects/${projectId}?tab=chat&dm=${member.email}`);
                          }}
                          className="w-full py-2.5 bg-[#11B886] text-white hover:bg-[#0EA271] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                          1:1 메시지 보내기
                        </button>
                        
                        <div className="flex gap-2.5">
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const dmRoom = [user!.email, member.email].sort().join('-');
                              await startCall(dmRoom, member.name, member.email, false);
                            }}
                            className="flex-1 py-2.5 bg-[#11B886]/10 hover:bg-[#11B886]/20 text-[#11B886] rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            음성 전화
                          </button>
                          <button
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const dmRoom = [user!.email, member.email].sort().join('-');
                              await startCall(dmRoom, member.name, member.email, true);
                            }}
                            className="flex-1 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                          >
                            <Video className="w-3.5 h-3.5" />
                            영상 전화
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
