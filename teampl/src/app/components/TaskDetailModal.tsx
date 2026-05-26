import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, MessageSquare, Save, Trash2, Paperclip, Download, CheckCircle2, FileText, FileImage, FileType2, ShieldCheck, Plus, Loader2 } from "lucide-react";
import { Task, TaskComment, TaskDeliverable } from "../types";
import { taskApi } from "../api/taskApi";
import { useAuth } from "../context/AuthContext";

function getDeliverableIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext || '')) return FileImage;
  if (ext === 'pdf') return FileType2;
  return FileText;
}

interface TaskDetailModalProps {
  projectId: number;
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
  isReadOnly?: boolean;
}

export default function TaskDetailModal({ projectId, task, onClose, onUpdate, isReadOnly }: TaskDetailModalProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState(task.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [addingFiles, setAddingFiles] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComments();
  }, [projectId, task.id]);

  const fetchComments = async () => {
    try {
      const data = await taskApi.getTaskComments(projectId, task.id);
      setComments(data);
      // 담당자이면 모달 열릴 때 읽지 않음 표시 자동 해제
      if (task.assignees?.includes(user?.email || '')) {
        taskApi.markCommentsRead(projectId, task.id).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDescription = async () => {
    try {
      await taskApi.updateTaskDetails(projectId, task.id, { description });
      setIsEditingDesc(false);
      onUpdate();
    } catch (err) {
      console.error(err);
      alert("상세 설명 저장에 실패했습니다.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await taskApi.addTaskComment(projectId, task.id, newComment, isAnonymous);
      setNewComment("");
      setIsAnonymous(false);
      fetchComments();
    } catch (err) {
      console.error(err);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await taskApi.deleteTaskComment(projectId, task.id, commentId);
      fetchComments();
    } catch (err) {
      console.error(err);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const handleApprove = async () => {
    if (!window.confirm("이 산출물을 검토하고 승인하시겠습니까?")) return;
    setApproving(true);
    try {
      await taskApi.approveTask(projectId, task.id);
      onUpdate();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "승인에 실패했습니다.");
    } finally {
      setApproving(false);
    }
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);
    if (addFileInputRef.current) addFileInputRef.current.value = "";
    setAddingFiles(true);
    try {
      await taskApi.addDeliverables(projectId, task.id, newFiles);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.message || "파일 추가에 실패했습니다.");
    } finally {
      setAddingFiles(false);
    }
  };

  const handleDeleteDeliverable = async (deliverable: TaskDeliverable) => {
    if (!window.confirm(`"${deliverable.originalName}" 파일을 삭제하시겠습니까?`)) return;
    setDeletingId(deliverable.id);
    try {
      await taskApi.deleteDeliverable(projectId, task.id, deliverable.id);
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.message || "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const isAssignee = task.assignees?.includes(user?.email || '') || false;
  
  const canApprove = task.status === 'IN_REVIEW' &&
    !isAssignee &&
    !task.approvals?.find(a => a.userEmail === user?.email);

  const alreadyApproved = task.approvals?.find(a => a.userEmail === user?.email);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A2340] w-full max-w-2xl rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 md:p-8 border-b border-gray-100 dark:border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-[10px] uppercase tracking-widest border ${
                task.priority === 'high' ? 'text-[#FF4D4D] bg-[#FF4D4D]/10 border-[#FF4D4D]/20' :
                task.priority === 'medium' ? 'text-[#FFA500] bg-[#FFA500]/10 border-[#FFA500]/20' :
                'text-[#4D94FF] bg-[#4D94FF]/10 border-[#4D94FF]/20'
              }`}>
                {task.priority.toUpperCase()}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-[#7D879C] uppercase bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-[10px]">
                <Calendar className="w-3.5 h-3.5" /> {task.deadline || "마감일 없음"}
              </div>
            </div>
            <h2 className="text-2xl font-black text-[#1A2340] dark:text-white leading-tight">
              {task.title}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
          {/* Description Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-black text-[#7D879C] uppercase tracking-widest">상세 설명</h3>
              {!isReadOnly && task.assignees?.includes(user?.email || '') && (
                !isEditingDesc ? (
                  <button onClick={() => setIsEditingDesc(true)} className="text-[12px] font-bold text-[#11B886] hover:underline">편집</button>
                ) : (
                  <button onClick={handleSaveDescription} className="flex items-center gap-1 text-[12px] font-bold text-white bg-[#11B886] px-3 py-1 rounded-full hover:bg-[#11B886]/90">
                    <Save className="w-3 h-3" /> 저장
                  </button>
                )
              )}
            </div>
            
            {isEditingDesc ? (
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="업무에 대한 자세한 내용을 작성해주세요 (마크다운 지원 가능)"
                className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-[#12182B] border border-gray-200 dark:border-white/10 text-sm resize-none focus:outline-none focus:border-[#11B886] transition-colors"
              />
            ) : (
              <div className="w-full min-h-[5rem] p-4 rounded-xl bg-gray-50 dark:bg-[#12182B]/50 border border-transparent text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {description ? description : <span className="text-gray-400 italic">상세 설명이 없습니다.</span>}
              </div>
            )}
          </section>

          {/* Deliverable Section - 검토 중일 때만 표시 */}
          {task.status === 'IN_REVIEW' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-[14px] font-black text-[#7D879C] uppercase tracking-widest">
                  <Paperclip className="w-4 h-4" /> 제출된 산출물 ({task.deliverables?.length || 0}개)
                </h3>
                {!isReadOnly && isAssignee && (
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[11px] font-bold cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors">
                    {addingFiles ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    파일 추가
                    <input type="file" multiple className="hidden" ref={addFileInputRef} onChange={handleAddFiles} />
                  </label>
                )}
              </div>

              <div className="rounded-2xl border-2 border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/5 overflow-hidden">
                {/* 파일 목록 */}
                {task.deliverables && task.deliverables.length > 0 ? (
                  <div className="divide-y divide-purple-100 dark:divide-purple-500/20">
                    {task.deliverables.map(deliverable => {
                      const Icon = getDeliverableIcon(deliverable.originalName);
                      return (
                        <div key={deliverable.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-purple-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-[#1A2340] dark:text-white truncate">{deliverable.originalName}</p>
                            <p className="text-[10px] text-gray-400">{(deliverable.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <a
                            href={deliverable.url}
                            target="_blank"
                            rel="noreferrer"
                            download={deliverable.originalName}
                            className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/20 rounded-lg transition-colors"
                            title="다운로드"
                            onClick={e => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {!isReadOnly && isAssignee && (
                            <button
                              onClick={() => handleDeleteDeliverable(deliverable)}
                              disabled={deletingId === deliverable.id}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                              title="삭제"
                            >
                              {deletingId === deliverable.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center text-[12px] text-gray-400">
                    아직 제출된 파일이 없습니다.
                  </div>
                )}

                {/* 승인 상태 + 버튼 영역 */}
                <div className="border-t border-purple-200 dark:border-purple-500/20 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span className="text-[12px] font-bold text-purple-600 dark:text-purple-400">
                      승인 현황: {task.approvals?.length || 0} / 1
                    </span>
                    {alreadyApproved && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#11B886] bg-[#11B886]/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> 승인 완료
                      </span>
                    )}
                  </div>

                  {canApprove && !isReadOnly && (
                    <button
                      onClick={handleApprove}
                      disabled={approving || !task.deliverables?.length}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#11B886] hover:bg-[#0EA271] disabled:opacity-50 text-white rounded-xl text-[13px] font-bold transition-colors shadow-[0_4px_12px_rgba(17,184,134,0.3)]"
                    >
                      {approving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      산출물 승인하기
                    </button>
                  )}

                  {isAssignee && (
                    <span className="text-[11px] font-bold text-gray-400 dark:text-white/30">
                      담당 중인 과제의 산출물입니다
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Comments Section */}
          <section>
            <h3 className="flex items-center gap-2 text-[14px] font-black text-[#7D879C] uppercase tracking-widest mb-4">
              <MessageSquare className="w-4 h-4" /> 댓글 ({comments.length})
            </h3>
            
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1"><div className="h-2 bg-gray-200 rounded"></div></div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-xl">첫 번째 댓글을 남겨보세요!</p>
                ) : (
                  comments.map(comment => {
                    const isAnon = (comment as any).isAnonymous;
                    const anonName = (comment as any).anonymousName || '익명';
                    const displayName = isAnon ? anonName : comment.user.name;
                    const displayAvatar = isAnon ? '익' : comment.user.name[0];
                    const avatarColor = isAnon ? 'bg-gray-400' : 'bg-[#11B886]';
                    
                    return (
                    <div key={comment.id} className="group flex gap-4 p-4 rounded-2xl bg-white dark:bg-[#12182B] border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className={`w-8 h-8 rounded-full ${avatarColor} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                        {displayAvatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[13px] text-[#1A2340] dark:text-white">{displayName}</span>
                          <span className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[13px] text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      {!isReadOnly && comment.userEmail === user?.email && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );})
                )}
              </div>
            )}

            {!isReadOnly && (
              <form onSubmit={handleAddComment} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    id="isAnonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#11B886] border-gray-300 rounded focus:ring-[#11B886]"
                  />
                  <label htmlFor="isAnonymous" className="text-xs font-bold text-gray-500 cursor-pointer select-none">
                    익명으로 남기기
                  </label>
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    className="w-full pl-5 pr-16 py-4 rounded-2xl bg-gray-50 dark:bg-[#12182B] border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#11B886] transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!newComment.trim()}
                    className="absolute right-2 top-2 bottom-2 px-4 bg-[#11B886] hover:bg-[#11B886]/90 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors"
                  >
                    등록
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
