import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Send, Plus, User as UserIcon, MessageSquare, ChevronLeft, ChevronRight, Users, Mail, Phone, GraduationCap, Calendar, X, Sparkles, Brain, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { taskApi } from "../api/taskApi";
import { aiApi, AiTaskSuggestion } from "../api/aiApi";
import { chatApi } from "../api/chatApi";
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
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#132038] w-full max-w-lg rounded-[32px] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-gray-300 dark:border-white/10 relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-gray-100 dark:bg-white/5 text-[#7D879C] hover:bg-gray-200 dark:hover:bg-white/10 transition-all rounded-full z-20"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-start gap-4">
            <div className={`w-20 h-20 rounded-full ${selectedMember.avatarColor || 'bg-[#7C6CFF]'} flex items-center justify-center text-white text-[28px] font-black shadow-lg uppercase`}>
              {selectedMember.name?.[0] || 'U'}
            </div>
            <div className="flex-1 mt-2">
              <h3 className="text-2xl font-black text-[#1A2340] dark:text-white mb-1">{selectedMember.name}</h3>
              <p className="text-sm font-bold text-[#7D879C] uppercase tracking-widest">{selectedMember.role || '팀원'}</p>
            </div>
        </div>
        
        <div className="space-y-4 mt-8 mb-8">
          <div className="grid grid-cols-1 gap-3">
             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5 text-[#7D879C]">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#7D879C]/80 uppercase tracking-widest mb-0.5">사용자 이름</p>
                    <p className="text-[14px] font-black text-[#1A2340] dark:text-white">{selectedMember.name}</p>
                  </div>
                </div>
             </div>

             {selectedMember.department && (
               <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5 text-[#7D879C]">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[#7D879C]/80 uppercase tracking-widest mb-0.5">학부/전공</p>
                      <p className="text-[14px] font-black text-[#1A2340] dark:text-white">{selectedMember.department} {selectedMember.studentId ? `(${selectedMember.studentId})` : ''}</p>
                    </div>
                  </div>
               </div>
             )}

             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5 text-[#7D879C]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#7D879C]/80 uppercase tracking-widest mb-0.5">학교 이메일</p>
                    <p className="text-[14px] font-black text-[#1A2340] dark:text-white">{selectedMember.email}</p>
                  </div>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5 text-[#7D879C]">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-[#7D879C]/80 uppercase tracking-widest mb-0.5">연락처</p>
                    <p className="text-[14px] font-black text-[#1A2340] dark:text-white">설정되지 않음</p>
                  </div>
                </div>
             </div>
          </div>

          {!loadingTasks && (
            <div className="mt-6 p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
              <h4 className="text-[12px] font-black text-[#1A2340] dark:text-white uppercase tracking-widest mb-4">업무 현황</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-[#7D879C]">개인 업무 진행률 ({completedTasks.length}/{userTasks.length})</span>
                    <span className="text-[12px] font-black text-[#1A2340] dark:text-white">{progressRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-[#1A2340] rounded-full overflow-hidden">
                    <div className="h-full bg-[#23D7A1] transition-all duration-1000" style={{ width: `${progressRate}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-[#7D879C]">프로젝트 기여도</span>
                    <span className="text-[12px] font-black text-[#1A2340] dark:text-white">{contributionRate}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 dark:bg-[#1A2340] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7C6CFF] transition-all duration-1000" style={{ width: `${contributionRate}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-white/5">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMessage();
            }}
            className="w-full py-4 bg-[#7C6CFF] text-white rounded-2xl text-[15px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,108,255,0.3)] flex items-center justify-center gap-3 transition-all active:scale-95 hover:opacity-90"
          >
            <MessageSquare className="w-6 h-6" />
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

type NavStep = "LOBBY" | "CHAT";
type ChatMode = "TEAM" | "INDIVIDUAL";

export default function Chat({ projectId, projectMembers = [], projectData }: ChatProps) {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState("");
  
  const [navStep, setNavStep] = useState<NavStep>("LOBBY");
  const [chatMode, setChatMode] = useState<ChatMode>("TEAM");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // AI 모듈 관련 상태
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiTaskSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [messagesStore, setMessagesStore] = useState<Record<string, Message[]>>({});
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080';
    const newSocket = io(socketUrl);
    setSocket(newSocket);
    return () => { newSocket.disconnect(); };
  }, []);

  const chatKey = chatMode === "TEAM" ? `team-${projectId}` : (selectedMember ? `${[user?.email, selectedMember.email].sort().join('-')}` : '');
  const currentMessages = (chatKey && messagesStore[chatKey]) ? messagesStore[chatKey] : [];

  useEffect(() => {
    if (!socket || !projectId || !chatKey) return;

    const loadMsgs = async () => {
      try {
        let msgs = [];
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
        
        setMessagesStore(prev => ({ ...prev, [chatKey]: formatted }));
      } catch (err) {}
    }
    loadMsgs();

    socket.emit('joinRoom', chatKey);

    const onNewMsg = (m: any) => {
      const isMe = m.senderEmail === user?.email;
      const formatted = {
        id: String(m.id),
        sender: m.sender?.name || m.senderEmail.split('@')[0],
        content: m.content,
        time: new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }),
        isMe
      };
      setMessagesStore(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), formatted]
      }));
    };
    
    socket.on('newMessage', onNewMsg);
    return () => { socket.off('newMessage', onNewMsg); };
  }, [socket, chatKey, projectId, chatMode, selectedMember, user?.email]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesStore, navStep, chatKey]);

  const handleSend = () => {
    if (!inputText.trim() || !projectId || !socket || !user) return;

    if (inputText.startsWith("/ai ")) {
      const desc = inputText.replace("/ai ", "");
      setAiInput(desc);
      setIsAiModalOpen(true);
      setInputText("");
      return;
    }

    socket.emit('sendMessage', {
       room: chatKey,
       senderEmail: user.email,
       content: inputText,
       projectId: chatMode === "TEAM" ? projectId : undefined,
       receiverEmail: chatMode === "INDIVIDUAL" ? selectedMember?.email : undefined
    });
    
    setInputText("");
  };

  const handleAiMessageSplit = (content: string) => {
    setAiInput(content);
    setIsAiModalOpen(true);
    // 즉시 분석 시작
    if (content.trim()) {
      handleAiAnalysisOfContent(content);
    }
  };

  const handleAiAnalysisOfContent = async (content: string) => {
    if (!content.trim() || !projectId) return;
    setAiLoading(true);
    setIsAnalyzing(true);
    try {
      const suggestions = await aiApi.splitTasks(projectId, content);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error(err);
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!aiInput.trim() || !projectId) return;
    setAiLoading(true);
    setIsAnalyzing(true);
    try {
      const suggestions = await aiApi.splitTasks(projectId, aiInput);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error(err);
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setAiLoading(false);
      setIsAnalyzing(false);
    }
  };

  const handleBatchCreate = async () => {
    if (!projectId || aiSuggestions.length === 0) return;
    try {
      await taskApi.batchCreateTasks(projectId, aiSuggestions as any);
      alert("AI가 추천한 모든 업무가 '대기 중' 항목으로 등록되었습니다!");
      setIsAiModalOpen(false);
      setAiSuggestions([]);
      setAiInput("");
    } catch (err) {
      console.error(err);
      alert("업무 등록 중 오류가 발생했습니다.");
    }
  };

  if (!projectId) {
    return (
      <div className="flex flex-col h-[75vh] items-center justify-center text-[#7D879C] font-bold">
        진행 중인 프로젝트 내에서만 채팅을 이용할 수 있습니다.
      </div>
    );
  }

  if (navStep === "LOBBY") {
    return (
      <div className="flex flex-col bg-[#f8faff] dark:bg-[#0B1020] rounded-3xl pb-8">
        {isModalOpen && selectedMember && (
          <ProfileModal 
            projectId={projectId}
            selectedMember={selectedMember} 
            onClose={() => setIsModalOpen(false)} 
            onMessage={() => {
              setChatMode("INDIVIDUAL");
              setNavStep("CHAT");
              setIsModalOpen(false);
            }} 
          />
        )}
        
        <div className="mb-6 space-y-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#7D879C] pl-1">소통 채널 접근</h3>
            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    setChatMode("TEAM");
                    setNavStep("CHAT");
                }}
                className="w-full card !p-6 hover:bg-white/40 dark:bg-[#1A2340] cursor-pointer group flex items-center gap-5 border border-gray-200 dark:border-white/5 active:scale-[0.98] transition-all text-left"
            >
                <div className={`w-14 h-14 rounded-2xl bg-[#7C6CFF]/10 flex items-center justify-center shadow-inner`}>
                    <Users className="w-7 h-7 text-[#7C6CFF]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-black text-[#1A2340] dark:text-white truncate mb-1 group-hover:text-[#7C6CFF] transition-colors">{projectData?.name || "프로젝트"} 단체 채팅</p>
                    <p className="text-[12px] font-bold text-[#7D879C] uppercase tracking-widest">모든 팀원과 자유자재로 소통하세요</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/5 group-hover:bg-[#7C6CFF]/10 transition-colors">
                    <ChevronRight className="w-5 h-5 text-[#7D879C] group-hover:text-[#7C6CFF]" />
                </div>
            </button>
        </div>

        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#7D879C] pl-1 gap-2 flex items-center">
                <UserIcon className="w-4 h-4"/> 1:1 메시지
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectMembers.filter(m => m.name !== user?.name && m.email !== user?.email).map(member => (
                   <button
                        type="button"
                        key={member.id}
                        onClick={(e) => {
                            e.preventDefault();
                            setSelectedMember(member);
                            setIsModalOpen(true);
                        }}
                        className="w-full card !p-5 hover:bg-white/40 dark:bg-[#1A2340] flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all border border-gray-200 dark:border-white/5 text-left group"
                   >
                       <div className={`w-12 h-12 rounded-xl ${member.avatarColor || 'bg-gray-300'} flex items-center justify-center text-white font-black text-lg shadow-sm uppercase`}>
                           {member.name?.[0] || '?'}
                       </div>
                       <div className="flex-1">
                           <p className="text-[15px] font-black text-[#1A2340] dark:text-white group-hover:text-[#7C6CFF] transition-colors">{member.name}</p>
                           <p className="text-[11px] font-bold text-[#7D879C] uppercase tracking-widest">{member.role || '팀원'}</p>
                       </div>
                   </button>
                ))}
                {projectMembers.filter(m => m.name !== user?.name && m.email !== user?.email).length === 0 && (
                    <div className="p-8 text-center text-[#7D879C] font-bold text-sm bg-gray-50 dark:bg-white/5 rounded-3xl col-span-1 md:col-span-2 border border-gray-200 dark:border-white/5">
                        참여중인 다른 팀원이 없습니다.
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }

  // navStep === "CHAT"
  return (
    <div className="flex flex-col h-[75vh] rounded-3xl overflow-hidden mb-8 bg-[#f8faff] dark:bg-[#0B1020] border border-gray-200 dark:border-white/5 relative transition-all duration-300">
      <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#12182B]/90 backdrop-blur-md flex items-center gap-3">
         <button onClick={() => setNavStep("LOBBY")} className="p-2 ml-1 mr-2 text-[#7D879C] hover:text-[#1A2340] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all">
             <ChevronLeft className="w-6 h-6" />
         </button>
         <div>
             <h2 className="text-lg font-black text-[#1A2340] dark:text-white flex items-center gap-2">
                {chatMode === "TEAM" ? <Users className="w-5 h-5 text-[#7C6CFF]" /> : <UserIcon className="w-5 h-5 text-[#23D7A1]" />}
                {chatMode === "TEAM" ? "프로젝트 그룹 채팅" : `${selectedMember?.name}님과 1:1 대화`}
             </h2>
             <p className="text-[11px] text-[#7D879C] uppercase tracking-widest mt-0.5 ml-7">
               {chatMode === "TEAM" ? "실시간 단체 소통 채널" : "프라이빗 메시지"}
             </p>
         </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        {currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-5">
            <div className="p-5 bg-white dark:bg-[#1A2340] border border-gray-200 dark:border-white/5 shadow-sm rounded-3xl">
              <MessageSquare className={`w-10 h-10 ${chatMode === "TEAM" ? "text-[#7C6CFF]" : "text-[#23D7A1]" }`} />
            </div>
            <div className="space-y-1">
              <p className="text-[17px] font-black text-[#1A2340] dark:text-white">첫 메시지를 남겨보세요</p>
            </div>
          </div>
        ) : (
          currentMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"} items-end gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300`}>
              {!msg.isMe && (
                <div className="w-10 h-10 rounded-[14px] bg-[#23D7A1] text-white flex items-center justify-center text-[15px] font-black shadow-sm flex-shrink-0 uppercase mb-5">
                  {msg.sender[0]}
                </div>
              )}
              <div className={`max-w-[75%] space-y-1.5 ${msg.isMe ? "flex flex-col items-end" : ""}`}>
                {!msg.isMe && <p className="text-[12px] font-black text-[#7D879C]/80 ml-1 tracking-tight">{msg.sender}</p>}
                <div className={`flex items-end gap-2 ${msg.isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`px-5 py-3.5 rounded-3xl text-[14.5px] font-medium leading-relaxed break-words shadow-sm border group/msg flex items-center gap-3 ${msg.isMe ? "bg-[#7C6CFF] text-white rounded-br-md shadow-[#7C6CFF]/20 border-[#7C6CFF]" : "bg-white dark:bg-[#1A2340] text-[#1A2340] dark:text-white rounded-bl-md border-gray-200 dark:border-white/5"}`}>
                    <span>{msg.content}</span>
                    {chatMode === "TEAM" && (
                      <button 
                        onClick={() => handleAiMessageSplit(msg.content)}
                        className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${msg.isMe ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-[#7C6CFF]/10 text-[#7C6CFF]/40 hover:text-[#7C6CFF]"}`}
                        title="AI 업무 분할"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#7D879C]/80 mb-1.5 whitespace-nowrap">{msg.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white dark:bg-[#12182B] border-t border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-2 bg-[#f8faff] dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-[20px] p-1.5 focus-within:border-[#7C6CFF]/50 focus-within:bg-white transition-all shadow-inner">
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="p-2.5 text-[#7D879C] hover:text-[#7C6CFF] hover:bg-[#7C6CFF]/10 rounded-xl transition-all"
            title="AI 업무 분할"
          >
            <Sparkles className="w-5 h-5 text-[#7C6CFF]" />
          </button>
          <button className="p-2.5 text-[#7D879C] hover:text-[#7C6CFF] hover:bg-[#7C6CFF]/10 rounded-xl transition-all"><Plus className="w-5 h-5" /></button>
          <input
            type="text"
            placeholder="메시지를 입력하세요..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-[14px] font-medium placeholder-[#7D879C]/60 text-[#1A2340] dark:text-white outline-none px-2"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button onClick={handleSend} disabled={!inputText.trim()} className={`w-11 h-11 flex items-center justify-center rounded-[14px] transition-all ${inputText.trim() ? "bg-[#7C6CFF] hover:bg-[#6b5cd8] text-white shadow-lg active:scale-95 shadow-[#7C6CFF]/30" : "bg-gray-100 dark:bg-white/5 text-gray-400"}`}>
            <Send className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>


      {isModalOpen && <ProfileModal projectId={projectId} selectedMember={selectedMember} onClose={() => setIsModalOpen(false)} onMessage={() => { setChatMode("INDIVIDUAL"); setNavStep("CHAT"); setIsModalOpen(false); }} />}

      {/* AI Analysis Modal */}
      {isAiModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#132038] w-full max-w-2xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-gray-300 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50 dark:bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#7C6CFF] flex items-center justify-center text-white shadow-lg shadow-[#7C6CFF]/30">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#1A2340] dark:text-white tracking-tight">AI 업무 자동 분할</h2>
                  <p className="text-sm font-bold text-[#7D879C] dark:text-white/40">과제 내용을 분석하여 시작점(태스크)을 제시합니다.</p>
                </div>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="p-3 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl transition-all">
                <X className="w-6 h-6 text-[#7D879C]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {aiSuggestions.length === 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black tracking-widest text-[#7D879C] uppercase ml-1">과제 설명 또는 프로젝트 목표 입력</label>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-[#7C6CFF]/10 text-[#7C6CFF] rounded-lg">AI가 팀의 초기 세팅을 도와줍니다</span>
                  </div>
                  <textarea 
                    className="w-full h-48 p-6 bg-white dark:bg-[#0d1526] border border-gray-200 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_20px_rgba(124,108,255,0.15)] outline-none transition-all dark:text-white font-medium resize-none placeholder:text-[#7D879C]/40"
                    placeholder="예: React와 NestJS를 사용한 웹 애플리케이션 개발 과제입니다. 주요 기능은 사용자 인증, 칸반 보드, AI 채팅 기능이며 마감기한은 2주입니다..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                  />
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-200/70 leading-relaxed">
                      AI가 분석한 태스크는 '대기 중' 항목으로 등록되며, 팀원들이 직접 드래그하여 본인의 업무로 배정할 수 있습니다.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-[#1A2340] dark:text-white">AI 추천 태스크 ({aiSuggestions.length})</h3>
                    <button onClick={() => setAiSuggestions([])} className="text-xs font-black text-[#7D879C] hover:text-[#7C6CFF] transition-all underline underline-offset-4">다시 입력하기</button>
                  </div>
                  <div className="grid gap-3">
                    {aiSuggestions.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#12182B] flex items-center justify-center text-[#7C6CFF] border border-gray-200 dark:border-white/10 shrink-0 font-black">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-[#1A2340] dark:text-white truncate">{task.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-[#7D879C] uppercase tracking-wider">
                            <span className={task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-orange-500' : 'text-blue-500'}>
                              {task.priority === 'high' ? '긴급' : task.priority === 'medium' ? '보통' : '여유'}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-white/10 rounded-full" />
                            <span>난이도: {task.difficulty}/5</span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-white/10 rounded-full" />
                            <span>제안 마감일: {task.deadline.split('-').slice(1).join('/') || '미지정'}</span>
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-[#23D7A1] opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              {aiSuggestions.length === 0 ? (
                <button 
                  onClick={handleAiAnalysis}
                  disabled={aiLoading || !aiInput.trim()}
                  className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C6CFF]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      과제 분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      AI 업무 분할 시작하기
                    </>
                  )}
                </button>
              ) : (
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsAiModalOpen(false)}
                    className="flex-1 py-5 bg-white dark:bg-white/5 text-[#7D879C] rounded-2xl font-black border border-gray-300 dark:border-white/10 uppercase tracking-widest transition-all"
                  >
                    나중에 하기
                  </button>
                  <button 
                    onClick={handleBatchCreate}
                    className="flex-[2] py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C6CFF]/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    프로젝트에 일괄 등록
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
