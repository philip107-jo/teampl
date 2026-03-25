import { useState } from "react";
import { User, Mail, Phone, Building2, Bell, Shield, LogOut, ChevronRight, Camera, Moon, Sun, Trophy, TrendingUp, Star, Plus, MessageSquare, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router";

export default function MyPage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [pushNoti, setPushNoti] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", department: "", phone: "010-1234-5678" });
  const isTestUser = user?.isTestUser;

  // From Team.tsx
  const contributors = isTestUser ? [
    { name: "나 (팀장)", score: 95, color: "bg-[#6366f1]", rank: 1 },
    { name: "김철수", score: 82, color: "bg-[#10b981]", rank: 2 },
    { name: "이영희", score: 78, color: "bg-[#d946ef]", rank: 3 },
  ] : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openEditProfile = () => {
    setEditForm({
      name: user?.name || "",
      department: user?.department || "컴퓨터공학과",
      phone: (user as any)?.phone || "010-1234-5678"
    });
    setIsEditingProfile(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (updateProfile) {
        await updateProfile({ name: editForm.name, department: editForm.department, phone: editForm.phone } as any);
      }
      setIsEditingProfile(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8faff] min-h-screen pb-24">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-gray-400 text-[14px] font-bold">내 정보</p>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight">프로필 설정 및 현황</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content: Profile, Notices, Settings */}
        <div className="lg:col-span-8 space-y-8">
          {/* Profile Card */}
          <div className="bg-white rounded-[32px] p-8 shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-[#f1f5f9] flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 blur-xl"></div>

            <div className="relative group cursor-pointer">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[40px] font-black shadow-lg shadow-indigo-200">
                {user?.name?.[0] || "U"}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <button className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-50 text-gray-600 hover:text-indigo-600">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-[24px] font-black text-gray-900 mb-1">{user?.name}</h2>
              <p className="text-[15px] font-bold text-gray-400 mb-4">{user?.department} / 팀장</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[13px] font-bold rounded-lg truncate max-w-full">
                  {user?.email}
                </span>
              </div>
            </div>

            <button onClick={openEditProfile} className="px-6 py-3 bg-gray-900 text-white text-[14px] font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
              프로필 수정
            </button>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Account Info */}
            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-[#f1f5f9]">
              <h3 className="text-[16px] font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                계정 정보
              </h3>
              <div className="space-y-4">
                {[
                  { label: "이름", value: user?.name, icon: User },
                  { label: "소속", value: user?.department, icon: Building2 },
                  { label: "이메일", value: user?.email, icon: Mail },
                  { label: "전화번호", value: (user as any)?.phone || "010-1234-5678", icon: Phone },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <item.icon className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-gray-400 mb-0.5">{item.label}</p>
                        <p className="text-[15px] font-bold text-gray-900">{item.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Preferences */}
              <div className="bg-white rounded-[28px] p-6 shadow-sm border border-[#f1f5f9]">
                <h3 className="text-[16px] font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-500" />
                  앱 설정
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">앱 푸시 알림</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPushNoti(!pushNoti)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${pushNoti ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${pushNoti ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                        {darkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-900">다크 모드</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Security / Logout */}
              <div className="bg-white rounded-[28px] p-6 shadow-sm border border-[#f1f5f9]">
                <div className="space-y-2">
                  <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors group">
                    <div className="flex items-center gap-4 text-gray-700 font-bold">
                      <Shield className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                      비밀번호 변경
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-4 text-red-500 font-bold">
                      <LogOut className="w-5 h-5" />
                      로그아웃
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (from Team.tsx) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Contributor of the Month */}
          <div className="bg-white rounded-[28px] p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-gray-50">
            <div className="flex items-center gap-3 mb-8">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h2 className="text-[18px] font-black text-gray-900 tracking-tight">이달의 기여자</h2>
            </div>
            {contributors.length > 0 ? (
              <div className="space-y-8">
                {contributors.map((c, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full ${c.color} flex items-center justify-center text-white text-[14px] font-bold`}>
                            {c.name[0]}
                          </div>
                          {c.rank === 1 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                              <span className="text-[10px] text-white font-black">1</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[15px] font-bold text-gray-800">{c.name}</span>
                      </div>
                      <span className="text-[13px] font-black text-gray-400">{c.score}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-gray-900 h-full rounded-full" style={{ width: `${c.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[14px] font-bold text-gray-900">기여자 데이터가 없습니다</p>
                <p className="text-[12px] text-gray-400 mt-1 font-medium">프로젝트를 진행하며 팀원들과 협업해보세요.</p>
              </div>
            )}
          </div>

          {/* Team Performance Summary */}
          <div className="bg-white rounded-[28px] p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] border border-[#f1f5f9]">
            <div className="flex items-center gap-3 mb-12">
              <TrendingUp className="w-7 h-7 text-[#6366f1]" />
              <h2 className="text-[20px] font-black text-gray-900 tracking-tight">팀 성과 요약</h2>
            </div>
            {isTestUser ? (
              <div className="space-y-7">
                <div className="flex justify-between items-center">
                  <span className="text-[16px] font-bold text-gray-500">이번 주 활동률</span>
                  <span className="text-[18px] font-black text-[#10b981]">+12%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[16px] font-bold text-gray-500">평균 응답 시간</span>
                  <span className="text-[19px] font-black text-gray-900">2.5시간</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[16px] font-bold text-gray-500">완료된 마일스톤</span>
                  <span className="text-[19px] font-black text-gray-900">18/24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[16px] font-bold text-gray-500">팀 만족도</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#f59e0b] fill-[#f59e0b]" />
                    <span className="text-[19px] font-black text-[#d97706]">4.8/5.0</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[14px] font-bold text-gray-900">집계 가능한 성과가 없습니다</p>
                <p className="text-[12px] text-gray-400 mt-1 font-medium">새로운 업무와 마일스톤을 달성해보세요.</p>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-[#6366f1] to-[#4f46e5] rounded-[28px] p-8 shadow-xl text-white space-y-6">
            <h2 className="text-[18px] font-black tracking-tight">빠른 작업</h2>
            <div className="space-y-3">
              {[
                { label: "새 팀원 초대하기", icon: Plus },
                { label: "전체 공지 보내기", icon: MessageSquare },
                { label: "성과 리포트 보기", icon: TrendingUp },
              ].map((action, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-left group">
                  <action.icon className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[14px] font-bold">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsEditingProfile(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">프로필 수정</h2>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">이름</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-[16px] text-gray-900 text-[15px] font-medium placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">소속</label>
                <input
                  type="text"
                  required
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-[16px] text-gray-900 text-[15px] font-medium placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">전화번호</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-[16px] text-gray-900 text-[15px] font-medium placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[16px] rounded-[16px] transition-colors shadow-lg shadow-indigo-200"
                >
                  변경사항 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
