import React, { useEffect, useRef, useState } from "react";
import { useCall } from "../context/CallContext";
import { useAuth } from "../context/AuthContext";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, ScreenShare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// 화면 공유 스트림 여부 판단 헬퍼 함수
const isScreenShareStream = (stream: MediaStream | null): boolean => {
  if (!stream) return false;
  const track = stream.getVideoTracks()[0];
  if (!track) return false;
  
  const settings = track.getSettings();
  if (settings && settings.displaySurface) return true;
  
  const label = (track.label || "").toLowerCase();
  if (
    label.includes("screen") || 
    label.includes("display") || 
    label.includes("window") || 
    label.includes("desktop")
  ) {
    return true;
  }
  return false;
};

export const CallWidget: React.FC = () => {
  const { user } = useAuth();
  const {
    status,
    localStream,
    remoteStream,
    peerName,
    isVideoCall,
    isMuted,
    isCameraOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    // Group call additions
    isGroupCall,
    groupCallRoom,
    groupCallParticipants,
    groupCallMembers,
    remoteStreamsMap,
    leaveGroupCall,
    // Screen share additions
    isSharingScreen,
    startScreenShare,
    stopScreenShare
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState(0);

  // 크기 조절 및 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [size, setSize] = useState({ width: 360, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const [focusedParticipantEmail, setFocusedParticipantEmail] = useState<string | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const resizeDirectionRef = useRef<"w" | "n" | "nw" | null>(null);

  // 통화 유형별 기본 크기 설정
  useEffect(() => {
    if (status === "connected") {
      setIsFullscreen(false);
      setFocusedParticipantEmail(null); // 통화 연결 시 포커스 초기화
      if (isGroupCall) {
        setSize({ width: 360, height: 500 });
      } else if (isVideoCall) {
        setSize({ width: 320, height: 380 });
      } else {
        setSize({ width: 256, height: 240 });
      }
    } else {
      setFocusedParticipantEmail(null); // 통화 끊길 시 포커스 해제
    }
  }, [status, isGroupCall, isVideoCall]);

  const startResize = (e: React.MouseEvent, direction: "w" | "n" | "nw") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeDirectionRef.current = direction;
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: size.width,
      h: size.height,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const { x, y, w, h } = resizeStartRef.current;
      const dir = resizeDirectionRef.current;
      const deltaX = e.clientX - x;
      const deltaY = e.clientY - y;

      let newWidth = w;
      let newHeight = h;

      if (dir === "w" || dir === "nw") {
        newWidth = w - deltaX;
      }
      if (dir === "n" || dir === "nw") {
        newHeight = h - deltaY;
      }

      const minWidth = 250;
      const minHeight = 200;
      const maxWidth = window.innerWidth - 48;
      const maxHeight = window.innerHeight - 48;

      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

      setSize(prev => ({
        width: (dir === "w" || dir === "nw") ? newWidth : prev.width,
        height: (dir === "n" || dir === "nw") ? newHeight : prev.height,
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      resizeDirectionRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // 통화 타이머 (초단위)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (status === "connected") {
      setDuration(0);
      timer = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);

  // 로컬 비디오 바인딩
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, status]);

  // 원격 비디오 바인딩
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, status]);

  // 원격 오디오 바인딩 (음성 통화용)
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      // 브라우저 미디어 자동 재생(Autoplay) 제한을 우회하기 위해 명시적으로 play() 호출
      remoteAudioRef.current.play().catch((err) => {
        console.error("Remote audio playback failed:", err);
      });
    }
  }, [remoteStream, status]);

  // 시간 포맷팅 (00:00)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (status === "idle") return null;

  return (
    <AnimatePresence>
      <div 
        className={`fixed z-[99999] font-sans transition-all duration-300 ${
          status === "connected" && isFullscreen 
            ? "inset-0 w-screen h-screen" 
            : "bottom-6 right-6"
        }`}
      >
        {/* Hidden audio elements for group call remote participants to play their voices */}
        {isGroupCall && Object.entries(remoteStreamsMap).map(([email, stream]) => {
          if (email === user?.email) return null;
          return (
            <audio
              key={email}
              ref={(el) => {
                if (el && el.srcObject !== stream) {
                  el.srcObject = stream;
                  el.play().catch((err) => {
                    console.error("Group call remote audio playback failed for", email, err);
                  });
                }
              }}
              autoPlay
              playsInline
              style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
            />
          );
        })}

        {/* 1. 전화 수신 벨소리 화면 (Incoming) */}
        {status === "incoming" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="w-80 bg-[#0B1528]/90 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-[0_20px_50px_rgba(17,184,134,0.15)] flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* 벨소리 진동 백그라운드 링 */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <span className="w-24 h-24 rounded-full border border-[#11B886]/30 animate-ping absolute" />
              <span className="w-32 h-32 rounded-full border border-blue-500/20 animate-pulse absolute" />
            </div>

            <div className="relative z-10 w-20 h-20 bg-[#11B886]/10 border border-[#11B886]/20 rounded-full flex items-center justify-center text-[28px] font-black text-[#11B886] mb-4">
              {peerName?.[0]?.toUpperCase()}
            </div>

            <div className="relative z-10 space-y-1 mb-6">
              <h4 className="text-[17px] font-extrabold text-white">{peerName}</h4>
              <p className="text-[12px] font-semibold text-gray-400">
                {isVideoCall ? "📹 영상 통화 요청 중..." : "📞 음성 통화 요청 중..."}
              </p>
            </div>

            <div className="relative z-10 w-full flex gap-4">
              <button
                onClick={rejectCall}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all font-bold text-sm"
              >
                <PhoneOff className="w-4 h-4" />
                거절
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 py-3 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#11B886]/20 transition-all font-bold text-sm"
              >
                <Phone className="w-4 h-4" />
                수락
              </button>
            </div>
          </motion.div>
        )}

        {/* 2. 전화 거는 중 화면 (Calling) */}
        {status === "calling" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="w-72 bg-[#0B1528]/95 border border-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-20 h-20 rounded-full border border-blue-500/30 animate-pulse absolute" />
            </div>

            <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-[22px] font-black text-blue-400 mb-4 animate-bounce">
              {peerName?.[0]?.toUpperCase()}
            </div>

            <div className="space-y-1 mb-6">
              <h4 className="text-[15px] font-extrabold text-white">{peerName}</h4>
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-gray-400">
                <span>전화 연결 중</span>
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </div>
            </div>

            <button
              onClick={endCall}
              className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/20 transition-all"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* 3. 통화 연결됨 화면 (Connected) */}
        {status === "connected" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className={`bg-[#0B1528]/90 border border-white/10 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center relative select-none ${
              isResizing ? "" : "transition-all duration-300"
            } ${
              isFullscreen ? "w-full h-full rounded-none p-8" : "rounded-3xl p-6"
            }`}
            style={isFullscreen ? {
              width: "100%",
              height: "100%",
              borderRadius: "0px",
            } : {
              width: size.width,
              height: size.height,
            }}
            onDoubleClick={(e) => {
              const target = e.target as HTMLElement;
              // 버튼, 비디오, 오디오 등의 컨트롤 요소를 더블클릭할 때는 무시
              if (target.closest("button") || target.closest("video") || target.closest("audio") || target.closest("svg")) {
                return;
              }
              setIsFullscreen(!isFullscreen);
            }}
          >
            {/* 크기 조절용 드래그 핸들 (전체화면이 아닐 때만 노출) */}
            {!isFullscreen && (
              <>
                {/* 왼쪽 테두리 */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-2 cursor-ew-resize hover:bg-[#11B886]/20 transition-all z-[100]"
                  onMouseDown={(e) => startResize(e, "w")}
                />
                {/* 위쪽 테두리 */}
                <div
                  className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-[#11B886]/20 transition-all z-[100]"
                  onMouseDown={(e) => startResize(e, "n")}
                />
                {/* 좌측 상단 모서리 */}
                <div
                  className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize hover:bg-[#11B886]/40 transition-all rounded-tl-3xl z-[101]"
                  onMouseDown={(e) => startResize(e, "nw")}
                />
              </>
            )}

            {isGroupCall ? (
              /* Group Call screen */
              <div className="w-full flex flex-col h-full justify-between">
                {/* Header */}
                <div className="w-full text-left mb-4 flex-shrink-0">
                  <h4 className="text-sm font-black text-white">👥 팀 그룹 통화</h4>
                  <span className="text-[10px] font-bold text-[#11B886] flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#11B886] animate-ping" />
                    {formatTime(duration)}
                  </span>
                </div>

                {/* Participant Grid / Focus View */}
                {focusedParticipantEmail && groupCallMembers.some(m => m.email === focusedParticipantEmail) ? (
                  (() => {
                    const member = groupCallMembers.find(m => m.email === focusedParticipantEmail)!;
                    const isConnected = groupCallParticipants.some(p => p.email === member.email);
                    const isMe = member.email === user?.email;
                    const stream = isMe ? localStream : remoteStreamsMap[member.email];
                    const hasVideo = isVideoCall || (stream && stream.getVideoTracks().length > 0);
                    const isScreenShare = stream ? (isMe ? isSharingScreen : isScreenShareStream(stream)) : false;

                    return (
                      <div className="w-full flex-1 min-h-0 flex flex-col gap-2 my-2 relative">
                        <div 
                          className="relative rounded-2xl overflow-hidden flex-1 flex flex-col items-center justify-center p-3 border transition-all bg-[#13223f] border-[#11B886] shadow-[0_0_25px_rgba(17,184,134,0.3)] cursor-pointer"
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setFocusedParticipantEmail(null);
                          }}
                        >
                          {isConnected && hasVideo && stream ? (
                            <div className="absolute inset-0 z-0 bg-black">
                              <video
                                ref={(el) => {
                                  if (el && el.srcObject !== stream) {
                                    el.srcObject = stream;
                                  }
                                }}
                                autoPlay
                                playsInline
                                muted={isMe}
                                className={`w-full h-full object-contain bg-black ${isMe && !isScreenShare ? "scale-x-[-1]" : ""}`}
                              />
                            </div>
                          ) : (
                            /* Avatar Display */
                            <div className="relative z-10 w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-2xl font-extrabold text-[#11B886]">
                              {member.name?.[0]?.toUpperCase()}
                            </div>
                          )}

                          {/* Status Label Overlay */}
                          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between">
                            <span className="text-[11px] font-black text-white truncate drop-shadow bg-black/60 px-3 py-1 rounded-full">
                              {member.name} {isMe && "(나)"} {isScreenShare && "• 화면 공유 중"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {isScreenShare && (
                                <span className="px-2 py-0.5 bg-[#11B886] text-white text-[9px] font-black uppercase tracking-wider rounded-md shadow-sm">
                                  공유 중
                                </span>
                              )}
                              {!isConnected && (
                                <span className="px-2 py-0.5 bg-red-500/80 text-white text-[9px] font-black uppercase tracking-wider rounded-md flex items-center gap-0.5">
                                  <PhoneOff className="w-2.5 h-2.5" />
                                  미참가
                                </span>
                              )}
                              {isConnected && (
                                <span className="w-2.5 h-2.5 bg-[#11B886] rounded-full animate-pulse" />
                              )}
                            </div>
                          </div>

                          {/* 격자 뷰로 복귀 버튼 (오버레이) */}
                          <button
                            onClick={() => setFocusedParticipantEmail(null)}
                            className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white border border-white/10 hover:border-white/20 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all"
                            title="격자 뷰로 돌아가기"
                          >
                            <span>격자 뷰 복귀</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className={`grid gap-3 my-4 overflow-y-auto pr-1 flex-1 ${
                    isFullscreen 
                      ? (groupCallMembers.length <= 1 ? "grid-cols-1" : groupCallMembers.length <= 2 ? "grid-cols-2" : groupCallMembers.length <= 4 ? "grid-cols-2" : groupCallMembers.length <= 6 ? "grid-cols-3" : "grid-cols-4")
                      : "grid-cols-2"
                  }`}>
                    {groupCallMembers.map((member) => {
                      const isConnected = groupCallParticipants.some(p => p.email === member.email);
                      const isMe = member.email === user?.email;
                      const stream = isMe ? localStream : remoteStreamsMap[member.email];
                      const hasVideo = isVideoCall || (stream && stream.getVideoTracks().length > 0);
                      const isScreenShare = stream ? (isMe ? isSharingScreen : isScreenShareStream(stream)) : false;

                      return (
                        <div 
                          key={member.email}
                          className={`relative rounded-2xl overflow-hidden flex flex-col items-center justify-center p-3 border transition-all cursor-pointer hover:border-[#11B886]/40 ${
                            isConnected 
                              ? "bg-[#13223f] border-[#11B886]/30 shadow-md" 
                              : "bg-[#070D19]/40 border-white/5 opacity-40 grayscale"
                          } ${
                            isFullscreen && isScreenShare
                              ? "col-span-full aspect-video border-[#11B886] shadow-[0_0_20px_rgba(17,184,134,0.2)]"
                              : "aspect-[4/3]"
                          }`}
                          onDoubleClick={(e) => {
                            e.stopPropagation(); // 모달 전체화면 토글 방지
                            if (isConnected) {
                              setFocusedParticipantEmail(member.email);
                            }
                          }}
                          title={`${member.name} 화면 더블클릭 시 전체보기`}
                        >
                          {isConnected && hasVideo && stream ? (
                            <div className="absolute inset-0 z-0 bg-black">
                              <video
                                ref={(el) => {
                                  if (el && el.srcObject !== stream) {
                                    el.srcObject = stream;
                                  }
                                }}
                                autoPlay
                                playsInline
                                muted={isMe}
                                className={`w-full h-full ${
                                  isScreenShare ? "object-contain bg-black" : "object-cover"
                                } ${isMe && !isScreenShare ? "scale-x-[-1]" : ""}`}
                              />
                            </div>
                          ) : (
                            /* Avatar Display */
                            <div className="relative z-10 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-sm font-extrabold text-[#11B886]">
                              {member.name?.[0]?.toUpperCase()}
                            </div>
                          )}

                          {/* Status Label Overlay */}
                          <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between">
                            <span className="text-[10px] font-black text-white truncate drop-shadow bg-black/40 px-2 py-0.5 rounded-full">
                              {member.name} {isMe && "(나)"}
                            </span>
                            <div className="flex items-center gap-1">
                              {isScreenShare && (
                                <span className="px-1.5 py-0.5 bg-[#11B886] text-white text-[8px] font-black uppercase tracking-wider rounded-md shadow-sm">
                                  공유 중
                                </span>
                              )}
                              {!isConnected && (
                                <span className="px-1.5 py-0.5 bg-red-500/80 text-white text-[8px] font-black uppercase tracking-wider rounded-md flex items-center gap-0.5">
                                  <PhoneOff className="w-2 h-2" />
                                  미참가
                                </span>
                              )}
                              {isConnected && (
                                <span className="w-2 h-2 bg-[#11B886] rounded-full animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Control Panel */}
                <div className="flex items-center gap-4 w-full justify-center mt-2 flex-shrink-0">
                  <button
                    onClick={toggleMute}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isMuted
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                    }`}
                    title={isMuted ? "마이크 켜기" : "음소거"}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={isSharingScreen ? stopScreenShare : startScreenShare}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSharingScreen
                        ? "bg-[#11B886] text-white shadow-lg shadow-[#11B886]/20"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                    }`}
                    title={isSharingScreen ? "화면 공유 중지" : "화면 공유 시작"}
                  >
                    <ScreenShare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={leaveGroupCall}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
                    title="통화 나가기"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>

                  {isVideoCall && (
                    <button
                      onClick={toggleCamera}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isCameraOff
                          ? "bg-red-500 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                      title={isCameraOff ? "카메라 켜기" : "카메라 끄기"}
                    >
                      {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ) : (isVideoCall || (localStream && localStream.getVideoTracks().length > 0) || (remoteStream && remoteStream.getVideoTracks().length > 0)) ? (
              /* A. 1:1 영상 통화 화면 (Video Call) */
              <div className="relative w-full h-full flex flex-col justify-between">
                {/* 원격 비디오 (전체화면) */}
                <div className="absolute inset-0 bg-[#070D19] z-0 flex items-center justify-center">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className={`w-full h-full ${
                        isScreenShareStream(remoteStream) ? "object-contain bg-black" : "object-cover"
                      }`}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-xl font-bold animate-pulse">
                        {peerName?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold text-gray-500">상대방 카메라 수신 대기 중...</span>
                    </div>
                  )}
                </div>

                {/* 로컬 비디오 (플로팅 작은화면) */}
                <div className="absolute top-4 right-4 w-24 h-32 bg-black/40 border border-white/10 rounded-2xl overflow-hidden z-10 shadow-lg">
                  {isCameraOff ? (
                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-gray-500 bg-gray-900">
                      OFF
                    </div>
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full ${
                        isSharingScreen ? "object-contain bg-black" : "object-cover scale-x-[-1]"
                      }`}
                    />
                  )}
                </div>

                {/* 상단 통화 정보 오버레이 */}
                <div className="relative z-10 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between w-full flex-shrink-0">
                  <div>
                    <h4 className="text-[13px] font-black text-white">{peerName}</h4>
                    <span className="text-[10px] font-bold text-[#11B886] flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#11B886] animate-ping" />
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* 하단 제어 바 오버레이 */}
                <div className="relative z-10 p-4 bg-gradient-to-t from-black/60 to-transparent w-full flex items-center justify-center gap-3 flex-shrink-0">
                  <button
                    onClick={toggleMute}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isMuted
                        ? "bg-red-500 text-white"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title={isMuted ? "마이크 켜기" : "음소거"}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={isSharingScreen ? stopScreenShare : startScreenShare}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSharingScreen
                        ? "bg-[#11B886] text-white shadow-lg shadow-[#11B886]/20"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                    }`}
                    title={isSharingScreen ? "화면 공유 중지" : "화면 공유 시작"}
                  >
                    <ScreenShare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={endCall}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
                    title="통화 종료"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>

                  <button
                    onClick={toggleCamera}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isCameraOff
                        ? "bg-red-500 text-white"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    title={isCameraOff ? "카메라 켜기" : "카메라 끄기"}
                  >
                    {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              /* B. 1:1 음성 통화 화면 (Voice Call) */
              <div className="w-full h-full flex flex-col items-center justify-center">
                {remoteStream && (
                  <audio
                    ref={remoteAudioRef}
                    autoPlay
                    playsInline
                    style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
                  />
                )}
                {/* 펄싱 링 이니셜 아바타 */}
                <div className="relative flex items-center justify-center w-24 h-24 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-[#11B886]/30 animate-pulse scale-110" />
                  <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping" />
                  <div className="w-16 h-16 bg-[#11B886]/10 border border-[#11B886]/20 rounded-full flex items-center justify-center text-[22px] font-black text-[#11B886] z-10">
                    {peerName?.[0]?.toUpperCase()}
                  </div>
                </div>

                <h4 className="text-[14px] font-extrabold text-white mb-0.5">{peerName}</h4>
                <div className="flex items-center gap-1.5 justify-center text-[10px] font-extrabold text-[#11B886] mb-6">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{formatTime(duration)}</span>
                </div>

                {/* 컨트롤 패널 */}
                <div className="flex items-center gap-4 w-full justify-center">
                  <button
                    onClick={toggleMute}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isMuted
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                        : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                    }`}
                    title={isMuted ? "마이크 켜기" : "음소거"}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={endCall}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
                    title="전화 끊기"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
};
