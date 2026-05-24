import React, { useEffect, useRef, useState } from "react";
import { useCall } from "../context/CallContext";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const CallWidget: React.FC = () => {
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
    toggleCamera
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);

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

  // 시간 포맷팅 (00:00)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (status === "idle") return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-[99999] font-sans">
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
            className={`bg-[#0B1528]/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-all flex flex-col items-center ${
              isVideoCall ? "w-80 h-[380px]" : "w-64 p-6 text-center"
            }`}
          >
            {/* A. 영상 통화 화면 (Video Call) */}
            {isVideoCall ? (
              <div className="relative w-full h-full flex flex-col justify-between">
                {/* 원격 비디오 (전체화면) */}
                <div className="absolute inset-0 bg-[#070D19] z-0 flex items-center justify-center">
                  {remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
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
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  )}
                </div>

                {/* 상단 통화 정보 오버레이 */}
                <div className="relative z-10 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between w-full">
                  <div>
                    <h4 className="text-[13px] font-black text-white">{peerName}</h4>
                    <span className="text-[10px] font-bold text-[#11B886] flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#11B886] animate-ping" />
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* 하단 제어 바 오버레이 */}
                <div className="relative z-10 p-4 bg-gradient-to-t from-black/60 to-transparent w-full flex items-center justify-center gap-3">
                  <button
                    onClick={toggleMute}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isMuted
                        ? "bg-red-500 text-white"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={endCall}
                    className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 transition-all"
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
                  >
                    {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              /* B. 음성 통화 화면 (Voice Call) */
              <div className="flex flex-col items-center">
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
