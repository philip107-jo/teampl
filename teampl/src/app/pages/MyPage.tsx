import { useState, useEffect } from "react";
import { User, Mail, Building2, Bell, Shield, LogOut, ChevronRight, Camera, Moon, Sun, Eye, EyeOff, X, Lock, CreditCard, Trash2, Plus, Crown, Sparkles } from "lucide-react";
import { authApi } from "../api/authApi";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { useDarkMode } from "../context/DarkModeContext";
import { notificationApi } from "../api/notificationApi";
import Avatar from "../components/Avatar";
import { cardApi, PaymentCard } from "../api/cardApi";
import CardRegisterModal from "../components/CardRegisterModal";

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function MyPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { isDark: darkMode, toggleDark: setDarkModeToggle } = useDarkMode();
  const { showToast } = useToast();
  const [pushNoti, setPushNoti] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [deletingCardId, setDeletingCardId] = useState<number | null>(null);

  useEffect(() => {
    // Check initial subscription status
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setPushNoti(true);
        });
      });
    }
    // 카드 목록 불러오기
    cardApi.getCards().then(setCards).catch(() => {});
  }, []);

  const handlePushNotiToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('푸시 알림을 지원하지 않는 브라우저입니다.');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;

      if (!pushNoti) {
        // Turn ON
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
          return;
        }

        const publicKey = await notificationApi.getVapidPublicKey();
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(publicKey)
        });

        // Backend 에 구독 정보 저장
        // @ts-ignore
        await notificationApi.subscribePush(subscription);
        setPushNoti(true);
        alert('푸시 알림이 설정되었습니다.');
      } else {
        // Turn OFF
        const subscription = await reg.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await notificationApi.unsubscribePush(subscription.endpoint);
        }
        setPushNoti(false);
      }
    } catch (e: any) {
      console.error(e);
      alert('푸시 설정 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      showToast('모든 항목을 입력해주세요.', 'error');
      return;
    }
    if (pwForm.newPw.length < 6) {
      showToast('새 비밀번호는 6자 이상이어야 합니다.', 'error');
      return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      showToast('새 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm.current, pwForm.newPw);
      showToast('비밀번호가 성공적으로 변경되었습니다! 다시 로그인해주세요.', 'success');
      setIsPasswordModalOpen(false);
      setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => { logout(); navigate('/login'); }, 1500);
    } catch (e: any) {
      showToast(e.response?.data?.message || '비밀번호 변경에 실패했습니다.', 'error');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteCard = async (cardId: number) => {
    if (!confirm('이 카드를 삭제하시겠습니까?\n등록된 카드가 없으면 FREE 플랜으로 전환됩니다.')) return;
    setDeletingCardId(cardId);
    try {
      const res = await cardApi.deleteCard(cardId);
      setCards(prev => prev.filter(c => c.id !== cardId));
      await refreshUser();
      showToast(res.remainingCards === 0 ? '카드가 삭제되어 FREE 플랜으로 전환되었습니다.' : '카드가 삭제되었습니다.', 'success');
    } catch (e: any) {
      showToast(e.response?.data?.message || '카드 삭제에 실패했습니다.', 'error');
    } finally {
      setDeletingCardId(null);
    }
  };

  return (
    <div className="dashboard pt-4 lg:max-w-6xl lg:mx-auto">
      {/* Header */}
      <section className="card hero-card mb-8">
        <div className="hero-top" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
          <div>
            <p className="hero-meta uppercase">설정</p>
            <h1 className="hero-title" style={{ fontSize: '2rem' }}>
              프로필 및 시스템 환경
            </h1>
          </div>
        </div>
      </section>

      <div className="pb-24">
        {/* Main Content */}
        <div className="space-y-8">
          {/* Profile Card */}
          <div className="card !p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group transition-all !rounded-[40px] border border-gray-200 dark:border-white/5">
            <div className={`absolute top-0 right-0 w-48 h-48 bg-[#11B886]/10 rounded-bl-full -z-10 opacity-50 blur-3xl group-hover:scale-110 transition-transform duration-700`}></div>
            
            <div className="relative group/avatar cursor-pointer flex-shrink-0">
              <div className="w-32 h-32 shadow-[0_0_40px_rgba(17,184,134,0.4)] rounded-[40px]">
                <Avatar 
                  name={user?.name || "User"} 
                  avatarUrl={user?.avatarUrl} 
                  shape="squircle"
                  className="w-full h-full text-[48px] !rounded-[40px] !text-[#1A2340] dark:!text-white"
                />
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-[40px] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <Camera className="w-10 h-10 text-[#1A2340] dark:text-white" />
              </div>
              <button className="absolute -bottom-2 -right-2 w-11 h-11 bg-white/40 dark:bg-[#1A2340] rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-gray-300 dark:border-white/10 text-[#7D879C] dark:text-white/80 hover:text-[#11B886] transition-all active:scale-95">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-3xl font-black text-[#1A2340] dark:text-white tracking-tight mb-2">{user?.name}</h2>
                <p className="hero-meta">{user?.department} • 프로젝트 팀장</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-4 py-2 bg-white/50 dark:bg-white/5 text-[#7D879C] dark:text-white/60 text-[13px] font-black rounded-xl border border-gray-300 dark:border-white/10 truncate max-w-full">
                  {user?.email}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => navigate("/mypage/edit")}
              className="px-8 py-4 bg-white/50 dark:bg-white/5 text-[#1A2340] dark:text-white text-[14px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/60 dark:bg-white/10 transition-all border border-gray-300 dark:border-white/10 active:scale-95">
              정보수정
            </button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Info */}
            <div className="card !p-8 space-y-8 border border-gray-200 dark:border-white/5">
              <h3 className="hero-meta flex items-center gap-3">
                <User className="w-5 h-5 text-[#11B886]" />
                계정 상세 정보
              </h3>
              <div className="space-y-4">
                {[
                  { label: "사용자 이름", value: user?.name, icon: User },
                  { label: "학부/전공", value: user?.department || "미입력", icon: Building2 },
                  { label: "가입 이메일", value: user?.email, icon: Mail },
                ].map((item, idx) => (
                  <div key={idx} 
                    className="flex items-center justify-between p-5 bg-white/40 dark:bg-[#1A2340] rounded-[24px] border border-gray-200 dark:border-white/5 transition-all group cursor-default hover:bg-white/50 dark:bg-[#222E54] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5 transition-all text-[#7D879C]/80 dark:text-white/40 group-hover:text-[#11B886]">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-[15px] font-black text-[#1A2340] dark:text-white">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* App Settings */}
              <div className="card !p-8 space-y-8 border border-gray-200 dark:border-white/5">
                <h3 className="hero-meta flex items-center gap-3">
                  <Bell className="w-5 h-5 text-[#11B886]" />
                  환경 설정
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-5 bg-white/40 dark:bg-[#1A2340] rounded-[24px] border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:bg-[#222E54] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5">
                        <Bell className="w-5 h-5 text-[#11B886]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-[#1A2340] dark:text-white">앱 푸시 알림</p>
                        <p className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest mt-0.5">실시간 업무 상태 알림</p>
                      </div>
                    </div>
                    <button 
                      onClick={handlePushNotiToggle}
                      className={`w-14 h-7 rounded-full p-1.5 transition-all duration-300 border border-gray-300 dark:border-white/10 ${pushNoti ? 'bg-[#11B886] shadow-[0_0_15px_rgba(17,184,134,0.4)]' : 'bg-white dark:bg-[#12182B]'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${pushNoti ? 'translate-x-[26px]' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-white/40 dark:bg-[#1A2340] rounded-[24px] border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:bg-[#222E54] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5">
                        {darkMode ? <Moon className="w-5 h-5 text-[#11B886]" /> : <Sun className="w-5 h-5 text-[#FFB547]" />}
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-[#1A2340] dark:text-white">다크 모드</p>
                        <p className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest mt-0.5">시스템 컬러 구성 테마</p>
                      </div>
                    </div>
                    <button 
                      onClick={setDarkModeToggle}
                      className={`w-14 h-7 rounded-full p-1.5 transition-all duration-300 border border-gray-300 dark:border-white/10 ${darkMode ? 'bg-[#11B886] shadow-[0_0_15px_rgba(17,184,134,0.4)]' : 'bg-white dark:bg-[#12182B]'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${darkMode ? 'translate-x-[26px]' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security / Logout */}
              <div className="card !p-6 border border-gray-200 dark:border-white/5 space-y-4">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full flex items-center justify-between p-5 bg-white/40 dark:bg-[#1A2340] rounded-[24px] border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:bg-[#222E54] hover:shadow-lg transition-all group">
                  <div className="flex items-center gap-5 text-[#7D879C] dark:text-white/80 font-black uppercase tracking-widest text-[13px]">
                    <Shield className="w-5 h-5 text-[#7D879C]/80 dark:text-white/40 group-hover:text-[#11B886] transition-colors" />
                    보안 및 비밀번호 변경
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#7D879C]/80 dark:text-white/30 group-hover:text-[#1A2340] dark:text-white transition-all" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-5 bg-[#FF6B7A]/10 rounded-[24px] border border-[#FF6B7A]/20 hover:bg-[#FF6B7A]/20 transition-all group"
                >
                  <div className="flex items-center gap-5 text-[#FF6B7A] font-black uppercase tracking-widest text-[13px] drop-shadow-[0_0_8px_rgba(255,107,122,0.5)]">
                    <LogOut className="w-5 h-5" />
                    최종 로그아웃
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 구독 & 결제 섹션 */}
          <div className="card !p-8 border border-gray-200 dark:border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="hero-meta flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-500" />
                구독 및 결제 관리
              </h3>
              {/* 현재 플랜 뱃지 */}
              {user?.plan === 'PRO' ? (
                <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 text-[11px] font-black rounded-full border border-amber-500/20 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> PRO 플랜
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/40 text-[11px] font-black rounded-full border border-gray-200 dark:border-white/10">
                  FREE 플랜
                </span>
              )}
            </div>

            {/* 등록된 카드 목록 */}
            {cards.length > 0 ? (
              <div className="space-y-3">
                {cards.map(card => (
                  <div key={card.id} className="flex items-center justify-between p-4 bg-white/40 dark:bg-[#1A2340] rounded-2xl border border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-to-br from-[#11B886] to-[#0EA271] rounded-lg flex items-center justify-center shadow-sm">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-[#1A2340] dark:text-white">{card.maskedNumber}</p>
                        <p className="text-[11px] font-bold text-gray-400 dark:text-white/40">{card.cardCompany} · {card.expiryMonth}/{card.expiryYear} · {card.cardHolder}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={deletingCardId === card.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-white/30">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-bold">등록된 카드가 없습니다</p>
                <p className="text-xs mt-1">카드를 등록하면 PRO 플랜을 이용할 수 있습니다</p>
              </div>
            )}

            {/* 카드 추가 버튼 */}
            <button
              onClick={() => setIsCardModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-2xl text-[14px] font-black text-gray-500 dark:text-white/40 hover:border-[#11B886] hover:text-[#11B886] transition-all"
            >
              <Plus className="w-4 h-4" />
              카드 추가하기
            </button>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
          <div className="bg-white dark:bg-[#132038] rounded-[32px] shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-md p-8">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#11B886]/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#11B886]" />
                </div>
                <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white">비밀번호 변경</h2>
              </div>
              <button onClick={() => { setIsPasswordModalOpen(false); setPwForm({ current: '', newPw: '', confirm: '' }); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 입력 필드 */}
            <div className="space-y-4">
              {[
                { label: '현재 비밀번호', key: 'current', show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                { label: '새 비밀번호 (6자 이상)', key: 'newPw', show: showNew, toggle: () => setShowNew(v => !v) },
                { label: '새 비밀번호 확인', key: 'confirm', show: showConfirm, toggle: () => setShowConfirm(v => !v) },
              ].map(({ label, key, show, toggle }) => (
                <div key={key}>
                  <label className="text-[11px] font-black text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-2 block">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={pwForm[key as keyof typeof pwForm]}
                      onChange={e => setPwForm(prev => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                      className="w-full px-4 py-3.5 pr-12 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-2xl text-[14px] font-semibold text-[#1A2340] dark:text-white outline-none focus:border-[#11B886] transition-all placeholder-gray-300 dark:placeholder-white/20"
                      placeholder={label}
                    />
                    <button type="button" onClick={toggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#11B886] transition-colors">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => { setIsPasswordModalOpen(false); setPwForm({ current: '', newPw: '', confirm: '' }); }}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 text-[14px] font-black text-gray-500 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                className="flex-1 py-3.5 rounded-2xl bg-[#11B886] text-white text-[14px] font-black hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(17,184,134,0.35)] disabled:opacity-50"
              >
                {pwLoading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카드 등록 모달 */}
      {isCardModalOpen && (
        <CardRegisterModal
          onClose={() => setIsCardModalOpen(false)}
          onSuccess={() => {
            cardApi.getCards().then(setCards).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
