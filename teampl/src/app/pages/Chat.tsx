import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Send, Plus, User as UserIcon, MessageSquare, 
  ChevronLeft, ChevronRight, Users, Mail, Phone, 
  GraduationCap, Calendar, X, Sparkles, Brain, 
  CheckCircle2, AlertCircle, Loader2 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { taskApi } from "../api/taskApi";
import { aiApi, AiTaskSuggestion } from "../api/aiApi";
import { chatApi } from "../api/chatApi";
import { Task } from "../types";
import { socket, joinChatRoom } from "../socket";

interface AiClaim {
  messageId: string;
  taskId: string;
  userEmail: string;
  userName: string;
}

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
}

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
  const [selectedAiIndices, setSelectedAiIndices] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [messagesStore, setMessagesStore] = useState<Record<string, Message[]>>({});
  const [aiClaims, setAiClaims] = useState<AiClaim[]>([]);

  const chatKey = chatMode === "TEAM" ? `team-${projectId}` : (selectedMember ? `${[user?.email, selectedMember.email].sort().join('-')}` : '');
  const currentMessages = (chatKey && messagesStore[chatKey]) ? messagesStore[chatKey] : [];

  useEffect(() => {
    if (!projectId || !chatKey) return;

    const loadMsgs = async () => {
      try {
        let msgs: any[] = [];
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

    joinChatRoom(chatKey);

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

    const onAiTaskClaimed = (claim: AiClaim) => {
      setAiClaims(prev => [...prev, claim]);
    };
    socket.on('aiTaskClaimed', onAiTaskClaimed);

    return () => { 
      socket.off('newMessage', onNewMsg); 
      socket.off('aiTaskClaimed', onAiTaskClaimed);
    };
  }, [chatKey, projectId, chatMode, selectedMember, user?.email]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesStore, navStep, chatKey]);

  const handleSend = async () => {
    if (!inputText.trim() || !projectId || !user) return;

    if (inputText.startsWith("/ai ")) {
      const desc = inputText.replace("/ai ", "");
      setInputText("");
      setAiLoading(true);
      try {
        const suggestions = await aiApi.splitTasks(projectId, desc);
        socket.emit('sendMessage', {
          room: chatKey,
          senderEmail: user.email,
          content: `___AI___${JSON.stringify(suggestions)}`,
          projectId: chatMode === "TEAM" ? projectId : undefined,
          receiverEmail: chatMode === "INDIVIDUAL" ? selectedMember?.email : undefined
        });
      } catch (err) {
        console.error(err);
        alert("AI 분석 중 오류가 발생했습니다.");
      } finally {
        setAiLoading(false);
      }
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

  const handleClaimIndividualAiTask = async (msgId: string, task: any) => {
    if (!projectId || !user) return;
    
    // 이미 누군가 가져갔는지 확인 (클라이언트 사이드 1차 방어)
    if (aiClaims.some(c => c.messageId === msgId && c.taskId === task.id)) {
      alert("이미 다른 팀원이 가져간 업무입니다.");
      return;
    }

    try {
      // 1. 태스크 생성 및 나에게 배정
      await taskApi.createTask(projectId, {
        title: task.title,
        priority: task.priority,
        deadline: task.deadline || "",
        difficulty: task.difficulty,
        assignees: [user.email]
      });

      // 2. 소켓으로 알림 (누가 가져갔는지)
      socket.emit('claimAiTask', {
        room: chatKey,
        messageId: msgId,
        taskId: task.id,
        userEmail: user.email,
        userName: user.name
      });

      alert(`'${task.title}' 업무를 가져왔습니다!`);
    } catch (e: any) {
      alert(e.message || "업무 가져오기에 실패했습니다.");
    }
  };

  const handleAiMessageSplit = (content: string) => {
    setAiInput(content);
    setIsAiModalOpen(true);
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
      setSelectedAiIndices(new Set(suggestions.map((_, i) => i)));
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
      setSelectedAiIndices(new Set(suggestions.map((_, i) => i)));
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
    const selectedTasks = aiSuggestions.filter((_, idx) => selectedAiIndices.has(idx));
    if (selectedTasks.length === 0) {
      alert("등록할 태스크를 하나 이상 선택해 주세요.");
      return;
    }

    try {
      await taskApi.batchCreateTasks(projectId, selectedTasks as any);
      alert(`${selectedTasks.length}개의 업무가 '대기 중' 항목으로 등록되었습니다!`);
      setIsAiModalOpen(false);
      setAiSuggestions([]);
      setSelectedAiIndices(new Set());
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
          currentMessages.map((msg, i) => {
            const isAiCard = msg.content.startsWith("___AI___");
            let aiData: any[] = [];
            if (isAiCard) {
              try {
                aiData = JSON.parse(msg.content.replace("___AI___", ""));
              } catch (e) {}
            }

            return (
              <div key={msg.id || i} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex items-end gap-2 max-w-[85%] ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!msg.isMe && !isAiCard && (
                    <div className="w-10 h-10 rounded-[14px] bg-[#23D7A1] text-white flex items-center justify-center text-[15px] font-black shadow-sm flex-shrink-0 uppercase mb-5">
                      {msg.sender[0]}
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                    isAiCard 
                      ? 'bg-white dark:bg-[#1A2340] border-2 border-[#7C6CFF] min-w-[300px]' 
                      : msg.isMe 
                        ? 'bg-[#7C6CFF] text-white rounded-br-none font-medium' 
                        : 'bg-white dark:bg-white/5 text-[#1A2340] dark:text-white rounded-bl-none border border-gray-100 dark:border-white/5 font-medium'
                  }`}>
                    {isAiCard ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-[#7C6CFF]" />
                          <span className="text-[12px] font-black text-[#7C6CFF] uppercase tracking-widest">AI 추천 업무 분할</span>
                        </div>
                        <div className="space-y-2">
                          {aiData.map((task, idx) => {
                            const claimer = aiClaims.find(c => c.messageId === msg.id && c.taskId === task.id);
                            const isClaimed = !!claimer;

                            return (
                              <div key={task.id || idx} className={`p-3 rounded-xl border transition-all ${isClaimed ? 'bg-gray-100 dark:bg-white/5 border-transparent opacity-60' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5 hover:border-[#7C6CFF]/30'}`}>
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-[13px] font-black text-[#1A2340] dark:text-white truncate pr-2">{task.title}</p>
                                  {isClaimed ? (
                                    <span className="text-[10px] font-black text-[#7C6CFF] bg-[#7C6CFF]/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                                      {claimer.userName}님이 찜!
                                    </span>
                                  ) : (
                                    <button 
                                      onClick={() => handleClaimIndividualAiTask(msg.id, task)}
                                      className="text-[10px] font-black text-white bg-[#7C6CFF] px-2 py-0.5 rounded-md hover:bg-[#6b5cd8] active:scale-95 transition-all"
                                    >
                                      가져오기
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-[#7D879C]">
                                  <span className={task.priority === 'high' ? 'text-red-500' : 'text-blue-500'}>{task.priority}</span>
                                  <span>•</span>
                                  <span>난이도 {task.difficulty}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button 
                          onClick={async () => {
                            if (!window.confirm("남아있는 모든 업무를 프로젝트에 등록할까요? (담당자 미지정)")) return;
                            try {
                              const unclaimed = aiData.filter(t => !aiClaims.some(c => c.messageId === msg.id && c.taskId === t.id));
                              if (unclaimed.length === 0) {
                                alert("가져갈 업무가 더 이상 없습니다.");
                                return;
                              }
                              await taskApi.batchCreateTasks(projectId, unclaimed as any);
                              alert(`${unclaimed.length}개의 업무가 등록되었습니다!`);
                            } catch (e) {
                              alert("등록에 실패했습니다.");
                            }
                          }}
                          className="w-full py-3 bg-[#7C6CFF] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                        >
                          일괄 등록하기
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span>{msg.content}</span>
                        {chatMode === "TEAM" && !isAiCard && (
                          <button 
                            onClick={() => handleAiMessageSplit(msg.content)}
                            className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${msg.isMe ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-[#7C6CFF]/10 text-[#7C6CFF]/40 hover:text-[#7C6CFF]"}`}
                            title="AI 업무 분할"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-[#7D879C]/80 mb-1.5 whitespace-nowrap">{msg.time}</span>
                </div>
                {!msg.isMe && !isAiCard && (
                  <span className="text-[11px] font-black text-[#7D879C] mt-1 ml-12 opacity-50">{msg.sender}</span>
                )}
              </div>
            );
          })
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
          <button onClick={handleSend} disabled={!inputText.trim() || aiLoading} className={`w-11 h-11 flex items-center justify-center rounded-[14px] transition-all ${inputText.trim() && !aiLoading ? "bg-[#7C6CFF] hover:bg-[#6b5cd8] text-white shadow-lg active:scale-95 shadow-[#7C6CFF]/30" : "bg-gray-100 dark:bg-white/5 text-gray-400"}`}>
            {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </button>
        </div>
      </div>

      {/* AI Analysis Modal (For back-compat or detailed input) */}
      {isAiModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#132038] w-full max-w-2xl rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-gray-300 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
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
                  <textarea 
                    className="w-full h-48 p-6 bg-white dark:bg-[#0d1526] border border-gray-200 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] outline-none transition-all dark:text-white font-medium resize-none placeholder:text-[#7D879C]/40"
                    placeholder="예: 프로젝트 목표나 과제 내용을 상세히 입력해주세요..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-3">
                    {aiSuggestions.map((task, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          const newSet = new Set(selectedAiIndices);
                          if (newSet.has(idx)) newSet.delete(idx);
                          else newSet.add(idx);
                          setSelectedAiIndices(newSet);
                        }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${selectedAiIndices.has(idx) ? 'bg-white dark:bg-white/10 border-[#7C6CFF] shadow-sm' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/5 opacity-60'}`}
                      >
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-black shrink-0 transition-colors ${selectedAiIndices.has(idx) ? 'bg-[#7C6CFF]/10 text-[#7C6CFF] border-[#7C6CFF]/30' : 'bg-white dark:bg-[#12182B] text-gray-400 border-gray-200 dark:border-white/10'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black">{task.title}</p>
                        </div>
                        <CheckCircle2 className={`w-6 h-6 ${selectedAiIndices.has(idx) ? 'text-[#7C6CFF]' : 'text-gray-300'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              {aiSuggestions.length === 0 ? (
                <button onClick={handleAiAnalysis} disabled={aiLoading || !aiInput.trim()} className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98]">
                  {aiLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                  AI 분석 시작하기
                </button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setAiSuggestions([])} className="flex-1 py-5 bg-white dark:bg-white/5 text-[#7D879C] rounded-2xl font-black border border-gray-200 dark:border-white/10">다시 하기</button>
                  <button onClick={handleBatchCreate} className="flex-[2] py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
                    <CheckCircle2 className="w-6 h-6" />
                    일괄 등록
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
