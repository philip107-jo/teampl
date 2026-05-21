import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Send, Plus, User as UserIcon, MessageSquare, ChevronLeft, ChevronRight, Users, Mail, Phone, GraduationCap, Calendar, X, Sparkles, Brain, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

import { taskApi } from "../api/taskApi";
import { aiApi, AiTaskSuggestion } from "../api/aiApi";
import { chatApi, ChatMessage } from "../api/chatApi";
import { io, Socket } from "socket.io-client";
import { Task } from "../types";

// ProfileModal 
function ProfileModal({ projectId, selectedMember, onClose, onMessage }: { projectId?: number, selectedMember: any, onClose: () => void, onMessage: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (projectId) {
      taskApi.getTasks(projectId)
        .then(data => {
          setTasks(data);
          setLoadingTasks(false);
        })
        .catch(err => {
          console.error("Failed to load tasks", err);
          setLoadingTasks(false);
        });
    } else {
      setLoadingTasks(false);
    }
  }, [projectId]);

  const userTasks = tasks.filter(t => t.assignees && t.assignees.includes(selectedMember.email));
  const completedTasks = userTasks.filter(t => t.status === "DONE");
  const progressRate = userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0;
  const contributionRate = tasks.length > 0 ? Math.round((userTasks.length / tasks.length) * 100) : 0;

  if (!selectedMember) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all rounded-full z-20">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`w-24 h-24 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-[36px] font-bold shadow-sm uppercase`}>
            {selectedMember.name?.[0] || 'U'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedMember.name}</h3>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{selectedMember.role || '팀원'}</p>
          </div>
        </div>

        <div className="space-y-4 mt-8 mb-8">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-100 text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">학교 이메일</p>
                <p className="text-[14px] font-bold text-gray-900">{selectedMember.email}</p>
              </div>
            </div>
            {selectedMember.department && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-100 text-gray-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">학부/전공</p>
                  <p className="text-[14px] font-bold text-gray-900">{selectedMember.department}</p>
                </div>
              </div>
            )}
          </div>

          {!loadingTasks && (
            <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
              <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-widest mb-4">업무 현황</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium text-gray-500">개인 업무 진행률 ({completedTasks.length}/{userTasks.length})</span>
                    <span className="text-[12px] font-bold text-gray-900">{progressRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-none overflow-hidden">
                    <div className="h-full bg-[#11B886] transition-all duration-1000" style={{ width: `${progressRate}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-medium text-gray-500">프로젝트 기여도</span>
                    <span className="text-[12px] font-bold text-gray-900">{contributionRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-none overflow-hidden">
                    <div className="h-full bg-[#11B886] transition-all duration-1000" style={{ width: `${contributionRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMessage();
            }}
            className="w-full py-3.5 bg-[#11B886] text-white rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 hover:bg-[#0EA271] transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            1:1 메시지 보내기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
}

interface ChatProps {
  projectId?: number;
  projectMembers?: any[];
  projectData?: any;
}

export default function Chat({ projectId, projectMembers = [], projectData }: ChatProps) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [chatMode, setChatMode] = useState<"TEAM" | "INDIVIDUAL">("TEAM");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { socket, messagesStore, setMessages, addMessage, setActiveChatKey, initProjectChat } = useChat();

  // 타이핑 인디케이터 상태
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const membersHash = JSON.stringify(projectMembers);
  useEffect(() => {
    if (projectId && user?.email && projectMembers.length > 0) {
      initProjectChat(projectId, user.email, projectMembers);
    }
  }, [projectId, user, membersHash, initProjectChat]);

  const chatKey = chatMode === "TEAM" ? `team-${projectId}` : (selectedMember ? `${[user?.email, selectedMember.email].sort().join('-')}` : '');
  const currentMessages = (chatKey && messagesStore[chatKey]) ? messagesStore[chatKey] : [];

  useEffect(() => {
    setActiveChatKey(chatKey);
    // 채팅방 바뀌면 타이핑 상태 초기화
    setTypingUsers([]);
    isTypingRef.current = false;
    return () => setActiveChatKey(null);
  }, [chatKey, setActiveChatKey]);

  useEffect(() => {
    if (!socket || !projectId || !chatKey) return;

    const loadMsgs = async () => {
      try {
        let msgs: ChatMessage[] = [];
        if (chatMode === "TEAM") {
          msgs = await chatApi.getProjectMessages(projectId);
        } else if (selectedMember?.email) {
          msgs = await chatApi.getDirectMessages(selectedMember.email);
        }

        const formatted = msgs.map((m: any) => ({
          id: String(m.id),
          sender: m.sender?.name || m.senderEmail.split('@')[0],
          content: m.content,
          time: new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }),
          isMe: m.senderEmail === user?.email
        }));

        setMessages(chatKey, formatted);
      } catch (err) { }
    }

    if (currentMessages.length === 0) {
      loadMsgs();
    }
  }, [projectId, chatMode, selectedMember, user?.email, chatKey, setMessages, socket]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesStore, chatKey, typingUsers]);

  // userTyping 소켓 이벤트 수신
  useEffect(() => {
    if (!socket || !user) return;

    const onUserTyping = (data: { room: string; email: string; isTyping: boolean }) => {
      if (data.room !== chatKey) return;
      if (data.email === user.email) return; // 내 타이핑은 제외

      setTypingUsers(prev =>
        data.isTyping
          ? prev.includes(data.email) ? prev : [...prev, data.email]
          : prev.filter(e => e !== data.email)
      );
    };

    socket.on('userTyping', onUserTyping);
    return () => { socket.off('userTyping', onUserTyping); };
  }, [socket, user, chatKey]);

  // 타이핑 emit 핸들러 (debounce 1.5초)
  const emitTyping = useCallback(() => {
    if (!socket || !user || !chatKey) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { room: chatKey, email: user.email, isTyping: true });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typing', { room: chatKey, email: user.email, isTyping: false });
    }, 1500);
  }, [socket, user, chatKey]);

  const handleSend = async () => {
    if (!inputText.trim() || !projectId || !socket || !user) return;

    socket.emit('sendMessage', {
      room: chatKey,
      senderEmail: user.email,
      content: inputText,
      projectId: chatMode === "TEAM" ? projectId : undefined,
      receiverEmail: chatMode === "INDIVIDUAL" ? selectedMember?.email : undefined
    });

    // 메시지 전송 시 타이핑 상태 즉시 해제
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing', { room: chatKey, email: user.email, isTyping: false });
    }

    setInputText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket || !user || !chatKey) return;
    setIsUploading(true);
    try {
      const uploaded = await chatApi.uploadFile(file);
      // 파일 URL을 특수 형식으로 메시지 전송
      const isImage = uploaded.type.startsWith('image/');
      const content = isImage
        ? `[IMAGE]${uploaded.url}[/IMAGE]`
        : `[FILE]${uploaded.url}|${uploaded.name}[/FILE]`;
      socket.emit('sendMessage', {
        room: chatKey,
        senderEmail: user.email,
        content,
        projectId: chatMode === "TEAM" ? projectId : undefined,
        receiverEmail: chatMode === "INDIVIDUAL" ? selectedMember?.email : undefined,
      });
    } catch (err) {
      console.error('파일 업로드 실패', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!projectId) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center text-gray-500 font-bold">
        진행 중인 프로젝트 내에서만 채팅을 이용할 수 있습니다.
      </div>
    );
  }

  return (
    <div className="flex flex-row h-[75vh] mb-8 pt-2 relative">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {chatMode === "TEAM" ? "팀 채팅" : (
              <>
                <button onClick={() => { setChatMode("TEAM"); setSelectedMember(null); }} className="text-gray-400 hover:text-gray-900 mr-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {selectedMember?.name}님과의 대화
              </>
            )}
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold shadow-sm ${
              isSidebarOpen 
                ? "bg-[#11B886]/10 text-[#11B886] border-[#11B886]/20 shadow-[0_0_15px_rgba(17,184,134,0.1)]" 
                : "bg-white dark:bg-[#1A2340] text-[#7D879C] hover:text-[#1A2340] dark:text-white/60 dark:hover:text-white border-gray-200 dark:border-white/5"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>팀원 목록</span>
          </button>
        </div>

        <div className="flex-1 bg-white border border-gray-100 rounded-[20px] shadow-sm flex flex-col overflow-hidden">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {currentMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 text-gray-400 font-medium text-sm">
                첫 메시지를 남겨보세요
              </div>
            ) : (
              currentMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} items-start gap-3`}>
                  {!msg.isMe && (
                    <div className="w-9 h-9 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-sm font-bold shrink-0">
                      {msg.sender[0]}
                    </div>
                  )}
                  <div className={`max-w-[70%] flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                    {!msg.isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender}</span>}

                    {/* 이미지 메시지 */}
                    {msg.content.startsWith('[IMAGE]') ? (
                      <a href={msg.content.slice(7, -8)} target="_blank" rel="noreferrer">
                        <img
                          src={msg.content.slice(7, -8)}
                          alt="첨부 이미지"
                          className="max-w-[240px] rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ) : msg.content.startsWith('[FILE]') ? (
                      /* 파일 메시지 */
                      (() => {
                        const inner = msg.content.slice(6, -7);
                        const [url, name] = inner.split('|');
                        return (
                          <a
                            href={url}
                            download={name}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-bold transition-colors
                              ${msg.isMe
                                ? "bg-[#11B886] text-white border-[#11B886] hover:bg-[#0EA271]"
                                : "bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200"
                              }`}
                          >
                            <span className="text-lg">📎</span>
                            <span className="truncate max-w-[160px]">{name}</span>
                          </a>
                        );
                      })()
                    ) : (
                      /* 일반 텍스트 메시지 */
                      <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words
                        ${msg.isMe
                          ? "bg-[#11B886] text-white rounded-2xl rounded-tr-sm"
                          : "bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    <span className="text-[10px] text-gray-400 mt-1 mx-1">{msg.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 타이핑 인디케이터 */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-6 pb-3">
              <div className="w-8 h-8 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-xs font-bold shrink-0">
                {(() => {
                  const member = projectMembers.find(m => m.email === typingUsers[0]);
                  return member?.name?.[0] || '?';
                })()}
              </div>
              <div className="flex items-center gap-1 bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[11px] text-gray-400">
                {typingUsers.length === 1
                  ? `${projectMembers.find(m => m.email === typingUsers[0])?.name || typingUsers[0].split('@')[0]}님이 입력 중...`
                  : `${typingUsers.length}명이 입력 중...`}
              </span>
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-gray-200 focus-within:border-[#11B886] transition-colors bg-white">
              {/* 파일 첨부 버튼 */}
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#11B886] hover:bg-[#11B886]/10 transition-colors shrink-0 disabled:opacity-50"
                title="파일 첨부"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
              <input
                type="text"
                placeholder="메시지를 입력하세요..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400 py-2.5"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  emitTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors shrink-0
                  ${inputText.trim() ? "bg-[#11B886] text-white hover:bg-[#0EA271]" : "bg-gray-100 text-gray-400"}`}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar for Team Members */}
      <div className={`flex flex-col h-full bg-white border rounded-[20px] shadow-sm overflow-hidden shrink-0 transition-all duration-300 ${
        isSidebarOpen 
          ? "w-64 ml-6 opacity-100 border-gray-100" 
          : "w-0 ml-0 opacity-0 pointer-events-none border-transparent shadow-none"
      }`}>
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">팀원 목록</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {projectMembers.map(member => (
            <button
              key={member.id}
              onClick={() => {
                setSelectedMember(member);
                setIsModalOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-sm font-bold shrink-0">
                {member.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                <p className="text-xs text-gray-500 truncate">{member.role || '팀원'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <ProfileModal 
          projectId={projectId} 
          selectedMember={selectedMember} 
          onClose={() => setIsModalOpen(false)} 
          onMessage={() => { 
            setChatMode("INDIVIDUAL"); 
            setIsModalOpen(false); 
          }} 
        />
      )}
    </div>
  );
}
