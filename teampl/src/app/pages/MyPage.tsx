import { useState } from "react";
import { User, Mail, Phone, Building2, Bell, Shield, LogOut, ChevronRight, Camera, Moon, Sun, TrendingUp, Star, Plus, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { useDarkMode } from "../context/DarkModeContext";

export default function MyPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark: darkMode, toggleDark: setDarkModeToggle } = useDarkMode();
  const [pushNoti, setPushNoti] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/login");
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Profile Card */}
          <div className="card !p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden group transition-all !rounded-[40px] border border-gray-200 dark:border-white/5">
            <div className={`absolute top-0 right-0 w-48 h-48 bg-[#7C6CFF]/10 rounded-bl-full -z-10 opacity-50 blur-3xl group-hover:scale-110 transition-transform duration-700`}></div>
            
            <div className="relative group/avatar cursor-pointer flex-shrink-0">
              <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-[#7C6CFF] to-[#3B2D9C] flex items-center justify-center text-[#1A2340] dark:text-white text-[48px] font-black shadow-[0_0_40px_rgba(124,108,255,0.4)]">
                {user?.name?.[0] || "U"}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-[40px] opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <Camera className="w-10 h-10 text-[#1A2340] dark:text-white" />
              </div>
              <button className="absolute -bottom-2 -right-2 w-11 h-11 bg-white/40 dark:bg-[#1A2340] rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-gray-300 dark:border-white/10 text-[#7D879C] dark:text-white/80 hover:text-[#7C6CFF] transition-all active:scale-95">
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
                <User className="w-5 h-5 text-[#7C6CFF]" />
                계정 상세 정보
              </h3>
              <div className="space-y-4">
                {[
                  { label: "사용자 이름", value: user?.name, icon: User },
                  { label: "학부/전공", value: user?.department, icon: Building2 },
                  { label: "학교 이메일", value: user?.email, icon: Mail },
                  { label: "연락처", value: "010-1234-5678", icon: Phone },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-white/40 dark:bg-[#1A2340] rounded-[24px] border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:bg-[#222E54] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all cursor-pointer group">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5 text-[#7D879C]/80 dark:text-white/40 group-hover:text-[#7C6CFF] transition-all`}>
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
                  <Bell className="w-5 h-5 text-[#7C6CFF]" />
                  환경 설정
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-5 bg-white/40 dark:bg-[#1A2340] rounded-[24px] border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:bg-[#222E54] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5">
                        <Bell className="w-5 h-5 text-[#7C6CFF]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-[#1A2340] dark:text-white">앱 푸시 알림</p>
                        <p className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest mt-0.5">실시간 업무 상태 알림</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPushNoti(!pushNoti)}
                      className={`w-14 h-7 rounded-full p-1.5 transition-all duration-300 border border-gray-300 dark:border-white/10 ${pushNoti ? 'bg-[#7C6CFF] shadow-[0_0_15px_rgba(124,108,255,0.4)]' : 'bg-white dark:bg-[#12182B]'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${pushNoti ? 'translate-x-[26px]' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-5 bg-white/40 dark:bg-[#1A2340] rounded-[24px] border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:bg-[#222E54] transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#12182B] flex items-center justify-center border border-gray-200 dark:border-white/5">
                        {darkMode ? <Moon className="w-5 h-5 text-[#7C6CFF]" /> : <Sun className="w-5 h-5 text-[#FFB547]" />}
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-[#1A2340] dark:text-white">다크 모드</p>
                        <p className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest mt-0.5">시스템 컬러 구성 테마</p>
                      </div>
                    </div>
                    <button 
                      onClick={setDarkModeToggle}
                      className={`w-14 h-7 rounded-full p-1.5 transition-all duration-300 border border-gray-300 dark:border-white/10 ${darkMode ? 'bg-[#7C6CFF] shadow-[0_0_15px_rgba(124,108,255,0.4)]' : 'bg-white dark:bg-[#12182B]'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${darkMode ? 'translate-x-[26px]' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security / Logout */}
              <div className="card !p-6 border border-gray-200 dark:border-white/5 space-y-4">
                <button className="w-full flex items-center justify-between p-5 bg-white/40 dark:bg-[#1A2340] rounded-[24px] border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:bg-[#222E54] hover:shadow-lg transition-all group">
                  <div className="flex items-center gap-5 text-[#7D879C] dark:text-white/80 font-black uppercase tracking-widest text-[13px]">
                    <Shield className="w-5 h-5 text-[#7D879C]/80 dark:text-white/40 group-hover:text-[#7C6CFF] transition-colors" />
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
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Team Performance Summary */}
          <div className="card !p-10 border border-gray-200 dark:border-white/5 group hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all">
            <div className="flex items-center gap-4 mb-10">
              <div className="schedule-item purple !p-0 !border-none bg-transparent">
                <div className="schedule-icon" style={{ width: 48, height: 48, borderRadius: 14 }}>
                  <TrendingUp className="w-6 h-6 text-[#1A2340] dark:text-white" />
                </div>
              </div>
              <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white tracking-tight uppercase tracking-widest">팀 성과 요약</h2>
            </div>
            <div className="space-y-8">
              <div className="flex justify-between items-center group/item cursor-default">
                <div className="space-y-1">
                  <span className="hero-meta">이번 주 활동률</span>
                  <div className="w-32 bg-white dark:bg-[#12182B] h-1.5 rounded-full overflow-hidden mt-1.5 border border-gray-200 dark:border-white/5">
                    <div className="bg-[#23D7A1] h-full rounded-full shadow-[0_0_10px_rgba(35,215,161,0.5)]" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <span className="text-[20px] font-black text-[#23D7A1] drop-shadow-[0_0_8px_rgba(35,215,161,0.4)]">+12.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="hero-meta">평균 응답 시간</span>
                <span className="text-[20px] font-black text-[#1A2340] dark:text-white tracking-tight">2.5 H</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="hero-meta">완료된 마일스톤</span>
                <span className="text-[20px] font-black text-[#1A2340] dark:text-white tracking-tight">18 / 24</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="hero-meta">팀 만족도</span>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#FFB547]/10 rounded-xl border border-[#FFB547]/20">
                  <Star className="w-5 h-5 text-[#FFB547] fill-[#FFB547]" />
                  <span className="text-[18px] font-black text-[#FFB547] drop-shadow-[0_0_8px_rgba(255,181,71,0.4)]">4.8</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card !p-10 border border-[#7C6CFF]/30 bg-gradient-to-br from-[#12182B] to-[#1A2340] text-[#1A2340] dark:text-white space-y-8 relative overflow-hidden group shadow-[0_0_30px_rgba(124,108,255,0.15)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C6CFF]/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
            <h2 className="text-[18px] font-black tracking-tight uppercase tracking-widest relative z-10 text-[#7C6CFF]">빠른 업무 생산</h2>
            <div className="space-y-3 relative z-10">
              {[
                { label: "새 팀원 초대하기", icon: Plus },
                { label: "전체 공지 메시지", icon: MessageSquare },
                { label: "성과 리포트 익스포트", icon: TrendingUp },
              ].map((action, i) => (
                <button key={i} className="w-full flex items-center justify-between p-5 bg-white dark:bg-[#12182B]/80 hover:bg-[#7C6CFF]/10 rounded-[20px] transition-all text-left group/btn border border-gray-200 dark:border-white/5 hover:border-[#7C6CFF]/30 active:scale-95 shadow-lg">
                  <div className="flex items-center gap-4">
                    <action.icon className="w-5 h-5 text-[#7D879C] dark:text-white/50 group-hover/btn:text-[#7C6CFF] group-hover/btn:scale-110 transition-all" />
                    <span className="text-[14px] font-black uppercase tracking-widest text-[#7D879C] dark:text-white/80 group-hover/btn:text-[#1A2340] dark:text-white">{action.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20 group-hover/btn:text-[#7C6CFF] group-hover/btn:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
