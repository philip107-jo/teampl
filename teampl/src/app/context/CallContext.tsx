import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { socket } from "../socket";
import { useAuth } from "./AuthContext";

type CallStatus = "idle" | "calling" | "incoming" | "connected";

interface CallerInfo {
  room: string;
  callerEmail: string;
  callerName: string;
  isVideo: boolean;
}

interface CallContextType {
  status: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callerInfo: CallerInfo | null;
  peerEmail: string | null;
  peerName: string | null;
  isVideoCall: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  inCallUsers: string[];
  startCall: (roomKey: string, name: string, email: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" }
  ]
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<CallStatus>("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [peerEmail, setPeerEmail] = useState<string | null>(null);
  const [peerName, setPeerName] = useState<string | null>(null);
  const [isVideoCall, setIsVideoCall] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [inCallUsers, setInCallUsers] = useState<string[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeRoomRef = useRef<string | null>(null);

  // 실시간 통화 유저 명단 동기화
  useEffect(() => {
    if (!socket) return;

    const onInCallUsers = (users: string[]) => {
      setInCallUsers(users);
    };

    socket.on("inCallUsers", onInCallUsers);
    return () => {
      socket.off("inCallUsers", onInCallUsers);
    };
  }, []);

  // WebRTC 소켓 신호 리스너 설정
  useEffect(() => {
    if (!socket || !user) return;

    // 1. 전화 들어옴
    const onIncomingCall = (data: CallerInfo & { offer: any }) => {
      // 내가 통화 중이거나 통화 대기 중이 아닐 때만 수신
      if (status !== "idle") {
        // 통화 중이면 거절 신호(end-call)를 바로 보내서 통화중 거절 처리
        socket.emit("end-call", { room: data.room });
        return;
      }
      setStatus("incoming");
      setCallerInfo(data);
      setPeerEmail(data.callerEmail);
      setPeerName(data.callerName);
      setIsVideoCall(data.isVideo);
      activeRoomRef.current = data.room;

      // 피어 커넥션 사전 준비
      createPeerConnection(data.room);
      pcRef.current?.setRemoteDescription(new RTCSessionDescription(data.offer))
        .catch(err => console.error("setRemoteDescription failed", err));
    };

    // 2. 전화 수락됨
    const onCallAccepted = async (data: { answer: any }) => {
      if (status !== "calling" || !pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setStatus("connected");
        // 내 통화 중 상태를 전체에 전파
        socket.emit("set-call-status", { isInCall: true });
      } catch (err) {
        console.error("Failed to set remote answer", err);
      }
    };

    // 3. ICE Candidate 수신
    const onIceCandidateReceived = async (data: { candidate: any }) => {
      if (!pcRef.current) return;
      try {
        if (data.candidate) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error("Failed to add ICE candidate", err);
      }
    };

    // 4. 통화 강제 종료/거절됨
    const onCallEnded = () => {
      cleanupCall();
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("call-accepted", onCallAccepted);
    socket.on("ice-candidate", onIceCandidateReceived);
    socket.on("call-ended", onCallEnded);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("call-accepted", onCallAccepted);
      socket.off("ice-candidate", onIceCandidateReceived);
      socket.off("call-ended", onCallEnded);
    };
  }, [socket, user, status]);

  // PeerConnection 생성 유틸
  const createPeerConnection = (room: string) => {
    if (pcRef.current) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // ICE Candidate 이벤트 연결
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", { room, candidate: event.candidate });
      }
    };

    // 상대방 트랙 추가 시 remoteStream 저장
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };
  };

  // 전화 걸기
  const startCall = async (roomKey: string, name: string, email: string, isVideo: boolean) => {
    if (!socket || !user) return;
    setStatus("calling");
    setPeerEmail(email);
    setPeerName(name);
    setIsVideoCall(isVideo);
    activeRoomRef.current = roomKey;

    try {
      // 미디어 장치 권한 획득
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      createPeerConnection(roomKey);

      // 로컬 스트림 트랙을 PeerConnection에 주입
      stream.getTracks().forEach((track) => {
        if (pcRef.current) {
          pcRef.current.addTrack(track, stream);
        }
      });

      // SDP Offer 생성
      const offer = await pcRef.current!.createOffer();
      await pcRef.current!.setLocalDescription(offer);

      // 상대방에게 전화 발신 신호 전송
      socket.emit("call-user", {
        room: roomKey,
        offer,
        callerEmail: user.email,
        callerName: user.name || user.email.split("@")[0],
        isVideo
      });
    } catch (err) {
      console.error("Error starting call:", err);
      cleanupCall();
      alert("마이크 또는 카메라 장치를 찾을 수 없거나 권한이 거부되었습니다.");
    }
  };

  // 전화 수락하기
  const acceptCall = async () => {
    if (!socket || !activeRoomRef.current || !pcRef.current) return;

    try {
      // 내 미디어 장치 권한 획득
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoCall
      });
      setLocalStream(stream);
      localStreamRef.current = stream;

      // 내 트랙도 연결에 추가
      stream.getTracks().forEach((track) => {
        pcRef.current?.addTrack(track, stream);
      });

      // SDP Answer 생성 및 등록
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);

      // 상대에게 수락 응답 전송
      socket.emit("accept-call", {
        room: activeRoomRef.current,
        answer
      });

      setStatus("connected");
      // 소켓 서버에 통화자 등록 전파
      socket.emit("set-call-status", { isInCall: true });
    } catch (err) {
      console.error("Error accepting call:", err);
      cleanupCall();
      alert("마이크 또는 카메라 장치 연결에 실패했습니다.");
    }
  };

  // 전화 거절하기
  const rejectCall = () => {
    if (socket && activeRoomRef.current) {
      socket.emit("end-call", { room: activeRoomRef.current });
    }
    cleanupCall();
  };

  // 통화 강제 끊기 / 종료
  const endCall = () => {
    if (socket && activeRoomRef.current) {
      socket.emit("end-call", { room: activeRoomRef.current });
    }
    cleanupCall();
  };

  // 마이크 뮤트
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // 비디오 온오프
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  // 통화 상태 청소 및 초기화
  const cleanupCall = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setStatus("idle");
    setCallerInfo(null);
    setPeerEmail(null);
    setPeerName(null);
    setIsMuted(false);
    setIsCameraOff(false);
    activeRoomRef.current = null;

    if (socket) {
      socket.emit("set-call-status", { isInCall: false });
    }
  };

  return (
    <CallContext.Provider
      value={{
        status,
        localStream,
        remoteStream,
        callerInfo,
        peerEmail,
        peerName,
        isVideoCall,
        isMuted,
        isCameraOff,
        inCallUsers,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};
