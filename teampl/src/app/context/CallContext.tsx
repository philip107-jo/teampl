import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { socket } from "../socket";
import { useAuth } from "./AuthContext";
import { ringtonePlayer, ringbackPlayer, playConnectSound, playDisconnectSound } from "../utils/audioHelper";

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
  // Group call additions
  isGroupCall: boolean;
  groupCallRoom: string | null;
  groupCallParticipants: { email: string, name: string, socketId: string }[];
  activeGroupCall: { room: string, participants: any[], isVideo: boolean } | null;
  groupCallMembers: any[];
  remoteStreamsMap: Record<string, MediaStream>;
  startGroupCall: (room: string, members: any[], isVideo: boolean) => Promise<void>;
  joinGroupCall: (room: string, members: any[], isVideo: boolean) => Promise<void>;
  leaveGroupCall: () => void;
  // Screen Share additions
  isSharingScreen: boolean;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const getIceServers = (): RTCConfiguration => {
  const stunUrls = import.meta.env.VITE_ICE_STUN_URLS
    ? import.meta.env.VITE_ICE_STUN_URLS.split(",")
    : [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302"
      ];

  const servers: RTCIceServer[] = stunUrls.map((url: string) => ({ urls: url.trim() }));

  if (import.meta.env.VITE_ICE_TURN_URL) {
    servers.push({
      urls: import.meta.env.VITE_ICE_TURN_URL.trim(),
      username: import.meta.env.VITE_ICE_TURN_USERNAME || "",
      credential: import.meta.env.VITE_ICE_TURN_CREDENTIAL || ""
    });
  }

  return { iceServers: servers };
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<CallStatus>("idle");

  // 1x1 픽셀 검은색 더미 비디오 트랙 생성
  const createDummyVideoTrack = (): MediaStreamTrack => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, 16, 16);
    }
    const stream = (canvas as any).captureStream ? (canvas as any).captureStream(1) : (canvas as any).mozCaptureStream ? (canvas as any).mozCaptureStream(1) : null;
    if (stream && stream.getVideoTracks().length > 0) {
      return stream.getVideoTracks()[0];
    }
    const mockCanvas = document.createElement("canvas");
    const mockStream = (mockCanvas as any).captureStream?.(1);
    return mockStream ? mockStream.getVideoTracks()[0] : new MediaStream().getVideoTracks()[0];
  };

  // 무음 더미 오디오 트랙 생성
  const createDummyAudioTrack = (): MediaStreamTrack => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const dst = ctx.createMediaStreamDestination();
      oscillator.connect(dst);
      oscillator.start();
      const track = dst.stream.getAudioTracks()[0];
      track.enabled = false;
      return track;
    } catch (e) {
      console.error("Failed to create dummy audio track:", e);
      return new MediaStream().getAudioTracks()[0];
    }
  };

  // 마이크/카메라 없을 때 수신 전용 모드로 폴백하기 위한 미디어 스트림 획득 함수
  const getFallbackStream = async (isVideo: boolean): Promise<{ stream: MediaStream, infoMsg?: string }> => {
    // 1단계: 마이크와 웹캠 모두 정상 작동 시도
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (!isVideo) {
        stream.getVideoTracks().forEach(t => {
          t.enabled = false;
        });
      }
      return { stream };
    } catch (err) {
      console.warn("First getUserMedia (audio+video) failed, trying fallback...", err);
    }

    // 2단계: 비디오 실패 시 오디오만 시도
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const dummyVideo = createDummyVideoTrack();
      if (dummyVideo) {
        stream.addTrack(dummyVideo);
      }
      return { 
        stream, 
        infoMsg: isVideo ? "웹캠 장치를 찾을 수 없거나 권한이 없어 음성만 송신하며 통화에 참여합니다. (보기 전용)" : undefined 
      };
    } catch (err) {
      console.warn("Audio-only getUserMedia fallback failed, trying silent fallback...", err);
    }

    // 3단계: 오디오 장치마저 없거나 차단된 경우 -> 무음 더미 오디오 + 검은색 더미 비디오로 완벽 폴백
    const finalStream = new MediaStream();
    const dummyAudio = createDummyAudioTrack();
    const dummyVideo = createDummyVideoTrack();
    if (dummyAudio) finalStream.addTrack(dummyAudio);
    if (dummyVideo) finalStream.addTrack(dummyVideo);
    
    return { 
      stream: finalStream, 
      infoMsg: "마이크 또는 웹캠 장치가 발견되지 않아 수신 전용(듣기/보기)으로 통화에 참여합니다." 
    };
  };

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [peerEmail, setPeerEmail] = useState<string | null>(null);
  const [peerName, setPeerName] = useState<string | null>(null);
  const [isVideoCall, setIsVideoCall] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isCameraOff, setIsCameraOff] = useState<boolean>(false);
  const [inCallUsers, setInCallUsers] = useState<string[]>([]);

  // Group call states
  const [isGroupCall, setIsGroupCall] = useState<boolean>(false);
  const [groupCallRoom, setGroupCallRoom] = useState<string | null>(null);
  const [groupCallParticipants, setGroupCallParticipants] = useState<{ email: string, name: string, socketId: string }[]>([]);
  const [activeGroupCall, setActiveGroupCall] = useState<{ room: string, participants: any[], isVideo: boolean } | null>(null);
  const [groupCallMembers, setGroupCallMembers] = useState<any[]>([]);
  const [remoteStreamsMap, setRemoteStreamsMap] = useState<Record<string, MediaStream>>({});

  // Screen Share states
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
 
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const activeRoomRef = useRef<string | null>(null);
  const statusRef = useRef<CallStatus>(status);

  const isCallerRef = useRef<boolean>(false);
  const callStartTimeRef = useRef<number | null>(null);
  const peerEmailRef = useRef<string | null>(null);
  const isVideoCallRef = useRef<boolean>(false);
  const isGroupCallRef = useRef<boolean>(false);
  const groupCallParticipantsRef = useRef<any[]>([]);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const hadMultipleParticipantsRef = useRef<boolean>(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    isGroupCallRef.current = isGroupCall;
  }, [isGroupCall]);

  useEffect(() => {
    groupCallParticipantsRef.current = groupCallParticipants;
  }, [groupCallParticipants]);

  // 로그인 정보 소켓에 연동 및 재연결 대응
  useEffect(() => {
    if (!socket || !user?.email) return;

    const handleConnect = () => {
      socket.emit("userConnected", user.email);
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, user]);

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

    // 5. 그룹 통화 상태 수신
    const onGroupCallActive = (data: { room: string, participants: any[], isVideo: boolean }) => {
      setActiveGroupCall(data);
      if (activeRoomRef.current === data.room) {
        setGroupCallParticipants(data.participants);
      }
    };

    const onGroupCallEnded = (data: { room: string }) => {
      setActiveGroupCall(null);
      if (activeRoomRef.current === data.room) {
        cleanupGroupCall();
      }
    };

    const onPeerJoined = (data: { socketId: string, email: string, name: string }) => {
      if (activeRoomRef.current && isGroupCallRef.current) {
        createGroupPeerConnection(data.socketId, data.email, true);
      }
    };

    const onSignalReceived = async (data: { senderSocketId: string, signal: any }) => {
      if (!activeRoomRef.current || !isGroupCallRef.current) return;
      const pc = peerConnectionsRef.current.get(data.senderSocketId);

      if (data.signal.candidate) {
        if (pc) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          } catch (e) {
            console.error("Failed to add ICE candidate:", e);
          }
        }
      } else if (data.signal.type === 'offer') {
        const peerInfo = groupCallParticipantsRef.current.find(p => p.socketId === data.senderSocketId);
        const email = peerInfo ? peerInfo.email : '';
        createGroupPeerConnection(data.senderSocketId, email, false);
        const targetPc = peerConnectionsRef.current.get(data.senderSocketId);
        if (targetPc) {
          try {
            await targetPc.setRemoteDescription(new RTCSessionDescription(data.signal));
            const answer = await targetPc.createAnswer();
            await targetPc.setLocalDescription(answer);
            socket.emit('send-group-signal', {
              targetSocketId: data.senderSocketId,
              signal: answer
            });
          } catch (e) {
            console.error("Failed to answer group call offer:", e);
          }
        }
      } else if (data.signal.type === 'answer') {
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          } catch (e) {
            console.error("Failed to set group call answer:", e);
          }
        }
      }
    };

    const onPeerLeft = (data: { socketId: string }) => {
      const pc = peerConnectionsRef.current.get(data.socketId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.socketId);
      }
      remoteStreamsRef.current.delete(data.socketId);
      setRemoteStreamsMap(prev => {
        const copy = { ...prev };
        const peer = groupCallParticipantsRef.current.find(p => p.socketId === data.socketId);
        if (peer) {
          delete copy[peer.email];
        }
        return copy;
      });
    };

    // 1. 전화 들어옴
    const onIncomingCall = (data: CallerInfo & { offer: any }) => {
      // 내가 통화 중이거나 통화 대기 중이 아닐 때만 수신
      if (statusRef.current !== "idle") {
        // 통화 중이면 거절 신호(end-call)를 바로 보내서 통화중 거절 처리
        socket.emit("end-call", { room: data.room });
        return;
      }
      setStatus("incoming");
      setCallerInfo(data);
      setPeerEmail(data.callerEmail);
      peerEmailRef.current = data.callerEmail;
      setPeerName(data.callerName);
      setIsVideoCall(data.isVideo);
      isVideoCallRef.current = data.isVideo;
      activeRoomRef.current = data.room;

      // 벨소리 재생 시작
      ringtonePlayer.start();

      // 피어 커넥션 사전 준비
      createPeerConnection(data.room);
      pcRef.current?.setRemoteDescription(new RTCSessionDescription(data.offer))
        .catch(err => console.error("setRemoteDescription failed", err));
    };

    // 2. 전화 수락됨
    const onCallAccepted = async (data: { answer: any }) => {
      if (statusRef.current !== "calling" || !pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        setStatus("connected");
        callStartTimeRef.current = Date.now();
        // 내 통화 중 상태를 전체에 전파
        socket.emit("set-call-status", { isInCall: true });

        // 발신 신호음 중지 및 연결 효과음 재생
        ringbackPlayer.stop();
        playConnectSound();

        // 1:1 통화 시작 메시지 발송
        if (isCallerRef.current && socket && user && activeRoomRef.current) {
          socket.emit('sendMessage', {
            room: activeRoomRef.current,
            senderEmail: user.email,
            content: `[CALL_START]:${isVideoCallRef.current ? 'video' : 'voice'}`,
            receiverEmail: peerEmailRef.current
          });
        }
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
      if (statusRef.current !== "idle") {
        playDisconnectSound();
      }
      cleanupCall();
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("call-accepted", onCallAccepted);
    socket.on("ice-candidate", onIceCandidateReceived);
    socket.on("call-ended", onCallEnded);
    socket.on("group-call-active", onGroupCallActive);
    socket.on("group-call-ended", onGroupCallEnded);
    socket.on("peer-joined", onPeerJoined);
    socket.on("signal-received", onSignalReceived);
    socket.on("peer-left", onPeerLeft);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("call-accepted", onCallAccepted);
      socket.off("ice-candidate", onIceCandidateReceived);
      socket.off("call-ended", onCallEnded);
      socket.off("group-call-active", onGroupCallActive);
      socket.off("group-call-ended", onGroupCallEnded);
      socket.off("peer-joined", onPeerJoined);
      socket.off("signal-received", onSignalReceived);
      socket.off("peer-left", onPeerLeft);
    };
  }, [socket, user]); // remove status from dependencies to prevent re-binding and missing events

  // 다자간 PeerConnection 생성 유틸
  const createGroupPeerConnection = (targetSocketId: string, peerEmail: string, isOffer: boolean) => {
    if (peerConnectionsRef.current.has(targetSocketId)) return;

    const pc = new RTCPeerConnection(getIceServers());
    peerConnectionsRef.current.set(targetSocketId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('send-group-signal', {
          targetSocketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamsRef.current.set(targetSocketId, event.streams[0]);
        setRemoteStreamsMap(prev => ({
          ...prev,
          [peerEmail]: event.streams[0]
        }));
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    if (isOffer) {
      pc.createOffer().then(offer => {
        return pc.setLocalDescription(offer).then(() => {
          socket?.emit('send-group-signal', {
            targetSocketId,
            signal: offer
          });
        });
      }).catch(err => console.error("Group offer creation failed:", err));
    }
  };

  // PeerConnection 생성 유틸
  const createPeerConnection = (room: string) => {
    if (pcRef.current) return;

    const pc = new RTCPeerConnection(getIceServers());
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
    isCallerRef.current = true;
    setStatus("calling");
    setPeerEmail(email);
    peerEmailRef.current = email;
    setPeerName(name);
    setIsVideoCall(isVideo);
    isVideoCallRef.current = isVideo;
    activeRoomRef.current = roomKey;

    // 발신 대기음 재생 시작
    ringbackPlayer.start();

    try {
      // 미디어 장치 권한 획득 (폴백 처리 적용)
      const { stream, infoMsg } = await getFallbackStream(isVideo);
      if (infoMsg) {
        alert(infoMsg);
      }
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
      // 내 미디어 장치 권한 획득 (폴백 처리 적용)
      const { stream, infoMsg } = await getFallbackStream(isVideoCall);
      if (infoMsg) {
        alert(infoMsg);
      }
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
      callStartTimeRef.current = Date.now();
      // 소켓 서버에 통화자 등록 전파
      socket.emit("set-call-status", { isInCall: true });

      // 벨소리 중지 및 연결 성공음 재생
      ringtonePlayer.stop();
      playConnectSound();
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
    playDisconnectSound();
    cleanupCall();
  };

  // 통화 강제 끊기 / 종료
  const endCall = () => {
    if (socket && activeRoomRef.current) {
      socket.emit("end-call", { room: activeRoomRef.current });
    }
    playDisconnectSound();
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

  // 화면 공유 시작
  const startScreenShare = async () => {
    if (!localStreamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      const screenTrack = stream.getVideoTracks()[0];
      if (!screenTrack) return;

      setScreenStream(stream);
      screenStreamRef.current = stream;
      setIsSharingScreen(true);

      // 기존 카메라 비디오 트랙 백업
      const localVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (localVideoTrack) {
        originalVideoTrackRef.current = localVideoTrack;
      }

      // 비디오 트랙 스왑 (replaceTrack)
      if (isGroupCallRef.current) {
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });
      } else {
        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }
      }

      // 로컬 스트림의 비디오 트랙을 화면 공유 트랙으로 스위칭
      const currentTracks = localStreamRef.current.getVideoTracks();
      currentTracks.forEach(t => localStreamRef.current?.removeTrack(t));
      localStreamRef.current?.addTrack(screenTrack);
      
      // 상태 강제 트리거
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

      // 브라우저 기본 UI의 "공유 중지" 버튼 대응
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Failed to start screen share:", err);
      stopScreenShare();
    }
  };

  // 화면 공유 중지
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsSharingScreen(false);

    // 백업해둔 카메라 비디오 트랙 복구
    if (localStreamRef.current) {
      const originalTrack = originalVideoTrackRef.current;
      
      // 로컬 스트림 비디오 트랙 스왑 백
      const currentTracks = localStreamRef.current.getVideoTracks();
      currentTracks.forEach(t => localStreamRef.current?.removeTrack(t));
      if (originalTrack) {
        localStreamRef.current?.addTrack(originalTrack);
      }
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

      // 피어 커넥션 송신기 트랙 복구
      if (isGroupCallRef.current) {
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(originalTrack || null);
          }
        });
      } else {
        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(originalTrack || null);
          }
        }
      }
    }
    originalVideoTrackRef.current = null;
  };

  // 통화 상태 청소 및 초기화
  const cleanupCall = () => {
    // 진행 중인 벨소리/발신음 모두 정지
    ringtonePlayer.stop();
    ringbackPlayer.stop();

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    const prevStatus = statusRef.current;
    const roomKey = activeRoomRef.current;
    const isVideo = isVideoCallRef.current;
    const pEmail = peerEmailRef.current;

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsSharingScreen(false);
    originalVideoTrackRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setStatus("idle");
    setCallerInfo(null);
    setPeerEmail(null);
    peerEmailRef.current = null;
    setPeerName(null);
    setIsMuted(false);
    setIsCameraOff(false);
    isVideoCallRef.current = false;
    activeRoomRef.current = null;

    if (socket) {
      socket.emit("set-call-status", { isInCall: false });
    }

    // 발신자이고 활성 통화 방이 있을 때 채팅 메시지 전송
    if (isCallerRef.current && socket && user && roomKey) {
      if (prevStatus === "connected" && callStartTimeRef.current) {
        const durationSec = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        socket.emit('sendMessage', {
          room: roomKey,
          senderEmail: user.email,
          content: `[CALL_END]:${isVideo ? 'video' : 'voice'}:${durationSec}`,
          receiverEmail: pEmail
        });
      } else if (prevStatus === "calling" || prevStatus === "incoming") {
        socket.emit('sendMessage', {
          room: roomKey,
          senderEmail: user.email,
          content: `[CALL_MISSED]:${isVideo ? 'video' : 'voice'}`,
          receiverEmail: pEmail
        });
      }
    }

    isCallerRef.current = false;
    callStartTimeRef.current = null;
  };

  const startGroupCall = async (room: string, members: any[], isVideo: boolean) => {
    await joinGroupCall(room, members, isVideo);
  };

  const joinGroupCall = async (room: string, members: any[], isVideo: boolean) => {
    if (!socket || !user) return;
    setStatus("connected");
    setIsGroupCall(true);
    setGroupCallRoom(room);
    setGroupCallMembers(members);
    setIsVideoCall(isVideo);
    activeRoomRef.current = room;

    try {
      // 미디어 장치 권한 획득 (폴백 처리 적용)
      const { stream, infoMsg } = await getFallbackStream(isVideo);
      if (infoMsg) {
        alert(infoMsg);
      }
      setLocalStream(stream);
      localStreamRef.current = stream;

      socket.emit('join-group-call', {
        room,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        isVideo
      });
    } catch (err) {
      console.error("Error joining group call:", err);
      cleanupGroupCall();
      alert("마이크 또는 카메라 장치를 찾을 수 없거나 권한이 거부되었습니다.");
    }
  };

  const leaveGroupCall = () => {
    if (socket && groupCallRoom) {
      socket.emit('leave-group-call', { room: groupCallRoom });
    }
    playDisconnectSound();
    cleanupGroupCall();
  };

  const cleanupGroupCall = () => {
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    setRemoteStreamsMap({});

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsSharingScreen(false);
    originalVideoTrackRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setStatus("idle");
    setIsGroupCall(false);
    setGroupCallRoom(null);
    setGroupCallParticipants([]);
    setGroupCallMembers([]);
    setIsVideoCall(false);
    activeRoomRef.current = null;
    hadMultipleParticipantsRef.current = false;
  };

  useEffect(() => {
    if (!isGroupCall) {
      hadMultipleParticipantsRef.current = false;
      return;
    }

    if (groupCallParticipants.length > 1) {
      hadMultipleParticipantsRef.current = true;
    } else if (groupCallParticipants.length === 1 && hadMultipleParticipantsRef.current) {
      leaveGroupCall();
    }
  }, [groupCallParticipants, isGroupCall]);

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
        toggleCamera,
        // Group call additions
        isGroupCall,
        groupCallRoom,
        groupCallParticipants,
        activeGroupCall,
        groupCallMembers,
        remoteStreamsMap,
        startGroupCall,
        joinGroupCall,
        leaveGroupCall,
        // Screen Share additions
        isSharingScreen,
        startScreenShare,
        stopScreenShare
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
