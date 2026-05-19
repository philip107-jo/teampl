import React, { useState, useEffect } from "react";
import { X, Calendar, MessageSquare, Save, Trash2 } from "lucide-react";
import { Task, TaskComment } from "../types";
import { taskApi } from "../api/taskApi";
import { useAuth } from "../context/AuthContext";

interface TaskDetailModalProps {
  projectId: number;
  task: Task;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailModal({ projectId, task, onClose, onUpdate }: TaskDetailModalProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState(task.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [projectId, task.id]);

  const fetchComments = async () => {
    try {
      const data = await taskApi.getTaskComments(projectId, task.id);
      setComments(data);
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
      await taskApi.addTaskComment(projectId, task.id, newComment);
      setNewComment("");
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
              {!isEditingDesc ? (
                <button onClick={() => setIsEditingDesc(true)} className="text-[12px] font-bold text-[#11B886] hover:underline">편집</button>
              ) : (
                <button onClick={handleSaveDescription} className="flex items-center gap-1 text-[12px] font-bold text-white bg-[#11B886] px-3 py-1 rounded-full hover:bg-[#11B886]/90">
                  <Save className="w-3 h-3" /> 저장
                </button>
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
                  comments.map(comment => (
                    <div key={comment.id} className="group flex gap-4 p-4 rounded-2xl bg-white dark:bg-[#12182B] border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-[#11B886] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {comment.user.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[13px] text-[#1A2340] dark:text-white">{comment.user.name}</span>
                          <span className="text-[10px] text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-[13px] text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      {comment.userEmail === user?.email && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            <form onSubmit={handleAddComment} className="relative">
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
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
