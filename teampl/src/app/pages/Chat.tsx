import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, Plus, User as UserIcon, MessageSquare, ChevronLeft, ChevronRight, Users, 
  Mail, GraduationCap, X, CheckCircle2, AlertCircle, Loader2, BarChart3, 
  Lock, Shuffle, Circle, Clock
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";

import { taskApi } from "../api/taskApi";
import { chatApi, ChatMessage } from "../api/chatApi";
import { voteApi, Vote, CreateVoteData } from "../api/voteApi";
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl border border-gray-100 relative overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all rounded-full z-20">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`w-24 h-24 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-[36px] font-bold shadow-sm uppercase`}>
            {selectedMember.name?.[0] || 'U'}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedMember.name}</h3>
            <p className="text-sm font-medium text-gray-505 uppercase tracking-widest">{selectedMember.role || '팀원'}</p>
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
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ChatVoteCard
function ChatVoteCard({ vote, userEmail, projectId, onVoteCasted }: { vote: Vote, userEmail: string, projectId: number, onVoteCasted: () => void }) {
  const [selected, setSelected] = useState<number[]>(vote.myOptionIds);
  const [isCasting, setIsCasting] = useState(false);

  useEffect(() => {
    setSelected(vote.myOptionIds);
  }, [vote.myOptionIds]);

  const hasVoted = vote.myOptionIds.length > 0;
  const hasChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...vote.myOptionIds].sort());

  const handleOptionSelect = (optionId: number) => {
    if (vote.isExpired) return;
    if (vote.isMultiple) {
      if (selected.includes(optionId)) {
        setSelected(selected.filter(id => id !== optionId));
      } else {
        setSelected([...selected, optionId]);
      }
    } else {
      if (selected.includes(optionId)) {
        setSelected([]);
      } else {
        setSelected([optionId]);
      }
    }
  };

  const handleCast = async () => {
    if (selected.length === 0) return;
    try {
      setIsCasting(true);
      await voteApi.castVote(projectId, vote.id, selected);
      onVoteCasted();
    } catch (e: any) {
      alert(e.response?.data?.message || "투표에 실패했습니다.");
    } finally {
      setIsCasting(false);
    }
  };

  return (
    <div className="w-[300px] sm:w-[320px] bg-white dark:bg-[#12182B] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden text-[#1A2340] dark:text-white mt-1">
      {/* Header */}
      <div className="p-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {vote.isExpired ? (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-400 text-[9px] font-black uppercase tracking-widest rounded">종료</span>
          ) : (
            <span className="px-2 py-0.5 bg-[#11B886]/10 text-[#11B886] text-[9px] font-black uppercase tracking-widest rounded animate-pulse">진행중</span>
          )}
          {vote.isAnonymous && <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-500 text-[9px] font-bold rounded">익명</span>}
          {vote.isMultiple && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 text-[9px] font-bold rounded">복수</span>}
        </div>
        <h4 className="text-[14px] font-bold tracking-tight truncate" title={vote.title}>{vote.title}</h4>
        {vote.description && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{vote.description}</p>}
      </div>

      {/* Options */}
      <div className="p-4 space-y-2">
        {vote.options.map(opt => {
          const isSelected = selected.includes(opt.id);
          const isMyOption = vote.myOptionIds.includes(opt.id);

          return (
            <button
              key={opt.id}
              onClick={() => handleOptionSelect(opt.id)}
              disabled={vote.isExpired}
              className="w-full text-left block focus:outline-none"
            >
              <div className={`p-2.5 rounded-xl border transition-all ${
                isSelected
                  ? 'border-[#11B886] bg-[#11B886]/5'
                  : 'border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 hover:border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-shrink-0">
                      {vote.isMultiple ? (
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#11B886] border-[#11B886]' : 'border-gray-300'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                        </div>
                      ) : (
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#11B886] bg-[#11B886]' : 'border-gray-300'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      )}
                    </div>
                    <span className={`text-[12px] font-bold truncate ${isSelected ? 'text-[#11B886]' : 'text-gray-700 dark:text-white/80'}`}>{opt.text}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400">{opt.voteCount}표 ({opt.percentage}%)</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${isMyOption ? 'bg-[#11B886]' : 'bg-gray-300'}`}
                    style={{ width: `${opt.percentage}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}

        {/* Action Button */}
        {!vote.isExpired && hasChanged && (
          <button
            onClick={handleCast}
            disabled={isCasting || selected.length === 0}
            className="w-full py-2 bg-[#11B886] hover:bg-[#0EA271] text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            {isCasting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {hasVoted ? "재투표 하기" : "투표 하기"}
          </button>
        )}

        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
          <span>총 {vote.totalVotes}표</span>
          {vote.deadline && (
            <span>마감: {new Date(vote.deadline).toLocaleDateString("ko-KR")}</span>
          )}
        </div>
      </div>
    </div>
  );
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
  const [mentionQuery, setMentionQuery] = useState<{ active: boolean, query: string, index: number } | null>(null);
  const [initialLastRead, setInitialLastRead] = useState<number>(0);

  // 투표 기능용 추가 상태
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isVoteMenuOpen, setIsVoteMenuOpen] = useState(false);
  const [isCreateVoteOpen, setIsCreateVoteOpen] = useState(false);
  const [voteForm, setVoteForm] = useState<CreateVoteData>({
    title: '',
    description: '',
    isAnonymous: false,
    isMultiple: false,
    deadline: '',
    options: ['', ''],
  });
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  const { 
    socket, 
    messagesStore, 
    setMessages, 
    addMessage, 
    setActiveChatKey, 
    initProjectChat, 
    onlineUsers, 
    unreadCounts, 
    clearUnread,
    readStates, 
    updateReadState 
  } = useChat();

  // 타이핑 인디케이터 상태
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const loadVotesList = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await voteApi.getVotes(projectId);
      setVotes(data);
    } catch (e) {
      console.error(e);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      loadVotesList();
    }
  }, [projectId, loadVotesList]);

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
<<<<<<< HEAD
    if (chatKey) {
      clearUnread(chatKey);
      if (chatMode === "INDIVIDUAL" && selectedMember) {
        clearUnread(`user-${projectId}-${selectedMember.id}`);
      }
    }
    setInitialLastRead(readStates[chatKey] || 0);
    // 채팅방 바뀌면 타이핑 상태 초기화
    setTypingUsers([]);
    isTypingRef.current = false;
    return () => setActiveChatKey(null);
  }, [chatKey, chatMode, selectedMember, projectId, setActiveChatKey, clearUnread, readStates]);

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
    
    // 현재 방의 최신 메시지 읽음 처리 (0.5초 딜레이로 "여기까지 읽으셨습니다" 선을 볼 수 있게 함)
    if (chatKey && currentMessages.length > 0) {
      const maxId = Math.max(...currentMessages.map(m => Number(m.id)));
      if (maxId > (readStates[chatKey] || 0)) {
        const timer = setTimeout(() => {
          updateReadState(chatKey, maxId);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [messagesStore, chatKey, typingUsers, currentMessages, readStates, updateReadState]);

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
    setMentionQuery(null);
  };

  const handleMentionSelect = (name: string) => {
    if (!mentionQuery) return;
    const before = inputText.slice(0, mentionQuery.index - mentionQuery.query.length - 1);
    const after = inputText.slice(mentionQuery.index);
    setInputText(`${before}@${name} ${after}`);
    setMentionQuery(null);
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

  // 투표 공유하기
  const handleShareVote = (voteId: number) => {
    if (!projectId || !socket || !user) return;
    socket.emit('sendMessage', {
      room: chatKey,
      senderEmail: user.email,
      content: `[VOTE_REF]:${voteId}`,
      projectId: chatMode === "TEAM" ? projectId : undefined,
      receiverEmail: chatMode === "INDIVIDUAL" ? selectedMember?.email : undefined
    });
    setIsVoteMenuOpen(false);
  };

  // 투표 생성 및 자동 공유
  const handleCreateVoteInChat = async () => {
    if (!voteForm.title.trim()) return alert('투표 제목을 입력하세요.');
    const validOptions = voteForm.options.filter(o => o.trim());
    if (validOptions.length < 2) return alert('선택지를 최소 2개 이상 입력하세요.');
    try {
      setIsSubmittingVote(true);
      const newVote = await voteApi.createVote(projectId!, { ...voteForm, options: validOptions });
      setIsCreateVoteOpen(false);
      setVoteForm({ title: '', description: '', isAnonymous: false, isMultiple: false, deadline: '', options: ['', ''] });
      
      await loadVotesList();

      socket?.emit('sendMessage', {
        room: chatKey,
        senderEmail: user!.email,
        content: `[VOTE_REF]:${newVote.id}`,
        projectId: chatMode === "TEAM" ? projectId : undefined,
        receiverEmail: chatMode === "INDIVIDUAL" ? selectedMember?.email : undefined
      });
    } catch (e: any) {
      alert(e.response?.data?.message || '생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleOpenVoteMenu = async () => {
    setIsVoteMenuOpen(!isVoteMenuOpen);
    if (!isVoteMenuOpen && projectId) {
      await loadVotesList();
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
              currentMessages.map((msg, idx) => {
                const isVoteMsg = msg.content.startsWith("[VOTE_REF]:");
                const voteId = isVoteMsg ? parseInt(msg.content.replace("[VOTE_REF]:", ""), 10) : null;
                const referencedVote = voteId ? votes.find(v => v.id === voteId) : null;

                const isFirstUnread = !msg.isMe && initialLastRead > 0 && Number(msg.id) > initialLastRead &&
                  (idx === 0 || Number(currentMessages[idx - 1].id) <= initialLastRead);

                return (
                  <div key={msg.id}>
                    {isFirstUnread && (
                      <div className="flex items-center gap-4 my-6">
                        <div className="h-px flex-1 bg-red-100 dark:bg-red-500/20"></div>
                        <span className="text-[11px] font-bold text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1 rounded-full">여기까지 읽으셨습니다</span>
                        <div className="h-px flex-1 bg-red-100 dark:bg-red-500/20"></div>
                      </div>
                    )}
                    <div className={`flex ${msg.isMe ? "justify-end" : "justify-start"} items-start gap-3 mt-4`}>
                      {!msg.isMe && (
                        <div className="w-9 h-9 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-sm font-bold shrink-0">
                          {msg.sender[0]}
                        </div>
                      )}
                      <div className={`max-w-[70%] flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}>
                        {!msg.isMe && <span className="text-xs text-gray-500 mb-1 ml-1">{msg.sender}</span>}

                        {isVoteMsg ? (
                          referencedVote ? (
                            <ChatVoteCard 
                              vote={referencedVote}
                              userEmail={user?.email || ''}
                              projectId={projectId}
                              onVoteCasted={loadVotesList}
                            />
                          ) : (
                            <div className="px-4 py-3 bg-gray-50 dark:bg-white/5 text-gray-400 text-[12px] font-bold rounded-2xl border border-gray-200 dark:border-white/10 italic flex items-center gap-1.5 mt-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              존재하지 않거나 삭제된 투표입니다
                            </div>
                          )
                        ) : msg.content.startsWith('[IMAGE]') ? (
                          <a href={msg.content.slice(7, -8)} target="_blank" rel="noreferrer">
                            <img
                              src={msg.content.slice(7, -8)}
                              alt="첨부 이미지"
                              className="max-w-[240px] rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          </a>
                        ) : msg.content.startsWith('[FILE]') ? (
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
                  </div>
                );
              })
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
          <div className="p-4 bg-white border-t border-gray-100 relative">
            {/* 투표 관련 드롭다운/메뉴 */}
            {isVoteMenuOpen && (
              <div className="absolute bottom-20 left-4 w-72 bg-white dark:bg-[#132038] rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 p-4 z-50 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-white/5">
                  <h4 className="text-[12px] font-bold text-gray-900 dark:text-white">팀 투표 올리기</h4>
                  <button onClick={() => setIsVoteMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">진행중인 투표 공유</p>
                  {votes.filter(v => !v.isExpired).length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic py-1">공유할 활성 투표가 없습니다.</p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {votes.filter(v => !v.isExpired).map(v => (
                        <button
                          key={v.id}
                          onClick={() => handleShareVote(v.id)}
                          className="w-full text-left px-2 py-1.5 hover:bg-[#11B886]/10 text-gray-700 dark:text-white/80 rounded-lg text-[12px] font-bold truncate transition-colors"
                        >
                          📊 {v.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsVoteMenuOpen(false);
                    setIsCreateVoteOpen(true);
                  }}
                  className="w-full py-2.5 bg-[#11B886] hover:bg-[#0EA271] text-white text-[12px] font-black uppercase tracking-widest rounded-xl text-center transition-all shadow-[0_2px_8px_rgba(17,184,134,0.2)]"
                >
                  + 새 투표 만들기
                </button>
              </div>
            )}

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

              {/* 투표 공유/생성 버튼 */}
              <button 
                onClick={handleOpenVoteMenu}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 ${
                  isVoteMenuOpen ? "bg-[#11B886]/10 text-[#11B886]" : "bg-gray-50 text-gray-400 hover:text-[#11B886] hover:bg-[#11B886]/10"
                }`}
                title="투표 공유 또는 만들기"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <input
                type="text"
                placeholder="메시지를 입력하세요... (@로 팀원 멘션)"
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400 py-2.5"
                value={inputText}
                onChange={(e) => {
                  const text = e.target.value;
                  setInputText(text);
                  emitTyping();
                  
                  if (chatMode === "TEAM") {
                    const cursorPos = e.target.selectionStart || 0;
                    const match = text.slice(0, cursorPos).match(/@(\S*)$/);
                    if (match) {
                      setMentionQuery({ active: true, query: match[1], index: cursorPos });
                    } else {
                      setMentionQuery(null);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    if (mentionQuery?.active) {
                      const matched = projectMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.query.toLowerCase()) && m.email !== user?.email);
                      if (matched.length > 0) {
                        handleMentionSelect(matched[0].name);
                      } else {
                        handleSend();
                      }
                    } else {
                      handleSend();
                    }
                  }
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() && !isUploading}
                className="w-10 h-10 flex items-center justify-center bg-[#11B886] hover:bg-[#0EA271] text-white rounded-xl shadow-[0_4px_12px_rgba(17,184,134,0.3)] transition-all shrink-0 disabled:opacity-50 disabled:shadow-none"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
            
            {/* 멘션 팝업 */}
            {mentionQuery?.active && chatMode === "TEAM" && (
              <div className="absolute bottom-[72px] left-14 bg-white shadow-xl rounded-xl border border-gray-100 p-2 w-56 z-50">
                <p className="text-[10px] text-gray-400 font-bold mb-1 ml-2">멘션할 팀원 선택</p>
                {projectMembers.filter(m => m.name.toLowerCase().includes(mentionQuery.query.toLowerCase()) && m.email !== user?.email).map(member => (
                  <button
                    key={member.email}
                    onClick={() => handleMentionSelect(member.name)}
                    className="w-full text-left px-3 py-2 hover:bg-[#11B886]/5 rounded-lg text-sm font-bold flex items-center gap-3 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-[10px] uppercase shrink-0">{member.name[0]}</span>
                    {member.name}
                  </button>
                ))}
              </div>
            )}
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
          {projectMembers.map(member => {
            const isOnline = onlineUsers.includes(member.email);
            const unreadKey = `user-${projectId}-${member.id}`;
            const unreadCount = unreadCounts[unreadKey] || 0;

            return (
              <button
                key={member.id}
                onClick={() => {
                  setSelectedMember(member);
                  setIsModalOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-sm font-bold">
                    {member.name?.[0] || 'U'}
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-[#11B886] ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-505 truncate">{member.role || '팀원'}</p>
                </div>
                {unreadCount > 0 && (
                  <span className="min-w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 shadow-sm shrink-0">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
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
      </AnimatePresence>

      {/* 채팅 투표 생성 모달 */}
      <AnimatePresence>
        {isCreateVoteOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setIsCreateVoteOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white dark:bg-[#132038] rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">새 투표 만들기</h3>
                <button onClick={() => setIsCreateVoteOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 제목 */}
                <div>
                  <label className="text-[10px] font-bold text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-1.5 block">투표 제목 *</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="예: 회의 일정 결정"
                    value={voteForm.title}
                    onChange={e => setVoteForm({ ...voteForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-xl text-[14px] font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#11B886] transition-all"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="text-[10px] font-bold text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-1.5 block">설명 (선택)</label>
                  <textarea
                    placeholder="상세 내용을 입력하세요"
                    value={voteForm.description}
                    onChange={e => setVoteForm({ ...voteForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-xl text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#11B886] transition-all resize-none"
                  />
                </div>

                {/* 선택지 */}
                <div>
                  <label className="text-[10px] font-bold text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-1.5 block">선택지 *</label>
                  <div className="space-y-2">
                    {voteForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#11B886]/10 text-[#11B886] text-[11px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                        <input
                          type="text"
                          placeholder={`선택지 ${i + 1}`}
                          value={opt}
                          onChange={e => {
                            const next = [...voteForm.options];
                            next[i] = e.target.value;
                            setVoteForm({ ...voteForm, options: next });
                          }}
                          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-lg text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#11B886] transition-all"
                        />
                        {voteForm.options.length > 2 && (
                          <button onClick={() => setVoteForm({ ...voteForm, options: voteForm.options.filter((_, j) => j !== i) })} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                             <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {voteForm.options.length < 8 && (
                      <button
                        onClick={() => setVoteForm({ ...voteForm, options: [...voteForm.options, ''] })}
                        className="w-full py-2 border border-dashed border-gray-300 dark:border-white/10 rounded-xl text-[12px] font-bold text-gray-400 dark:text-white/30 hover:border-[#11B886] hover:text-[#11B886] transition-all"
                      >
                        + 선택지 추가
                      </button>
                    )}
                  </div>
                </div>

                {/* 옵션 토글 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setVoteForm({ ...voteForm, isMultiple: !voteForm.isMultiple })}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${voteForm.isMultiple ? 'border-[#11B886] bg-[#11B886]/5 text-[#11B886]' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}
                  >
                    <Shuffle className="w-4 h-4" />
                    <span className="text-[12px] font-bold">복수선택</span>
                  </button>
                  <button
                    onClick={() => setVoteForm({ ...voteForm, isAnonymous: !voteForm.isAnonymous })}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${voteForm.isAnonymous ? 'border-[#11B886] bg-[#11B886]/5 text-[#11B886]' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-[12px] font-bold">익명투표</span>
                  </button>
                </div>

                {/* 마감일 */}
                <div>
                  <label className="text-[10px] font-bold text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-1.5 block">마감일 (선택)</label>
                  <input
                    type="datetime-local"
                    value={voteForm.deadline}
                    onChange={e => setVoteForm({ ...voteForm, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-xl text-[13px] font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#11B886] transition-all"
                  />
                </div>

                {/* 생성 버튼 */}
                <button
                  onClick={handleCreateVoteInChat}
                  disabled={isSubmittingVote}
                  className="w-full py-3 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-xl font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-[13px] shadow-[0_2px_8px_rgba(17,184,134,0.2)]"
                >
                  {isSubmittingVote ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isSubmittingVote ? '생성 중...' : '투표 생성 및 공유'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
