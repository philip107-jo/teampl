import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router";
import { LogIn, Mail, Lock, AlertCircle, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ForgotPasswordModal from "../components/ForgotPasswordModal";
import { TEAMPL_LOGO_URL } from "../constants/assets";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/projects";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      showToast("로그인에 성공했습니다!", "success");
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Login handler for demo/review profiles
  const handleQuickLogin = async (mockEmail: string) => {
    setEmail(mockEmail);
    setPassword("password123");
    setError("");
    setLoading(true);

    try {
      await login(mockEmail, "password123");
      showToast("간편 로그인에 성공했습니다!", "success");
      navigate(redirectPath);
    } catch (err: any) {
      setError(err.message || "간편 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden">
      {/* Left Side: Home Screen Style Immersive Design */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(9, 17, 31, 0.65), rgba(9, 17, 31, 0.85)), url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80')`
        }}
      >
        {/* Top Logo and Name */}
        <div className="flex items-center gap-3">
          <img 
            src={TEAMPL_LOGO_URL} 
            onError={(e) => { e.currentTarget.src = "/logo.png"; }}
            alt="Teampl Logo" 
            className="w-11 h-11 object-contain"
          />
          <span className="text-xl font-black text-white tracking-tight">Teampl</span>
        </div>

        {/* Main Content */}
        <div className="space-y-6 max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            팀프로젝트의<br />
            <span className="text-[#11B886]">새로운 기준</span>
          </h2>
          <p className="text-base text-white/80 leading-relaxed font-medium break-keep">
            단계별 워크플로우, 실시간 채팅, 파일 공유까지.<br />
            대학생을 위한 완벽한 협업 플랫폼, Teampl.
          </p>

        </div>

        {/* Footer info */}
        <p className="text-xs text-white/50 font-medium">
          &copy; 2026 Teampl. All rights reserved.
        </p>
      </div>

      {/* Right Side: Clean Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-16 lg:p-20">
        <div className="w-full max-w-[420px] space-y-8 animate-in fade-in duration-500">
          
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">다시 오신 걸 환영해요</h1>
            <p className="text-sm font-semibold text-slate-400">계정 정보를 입력하고 팀프로젝트를 이어가세요</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-semibold">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">이메일</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm"
                  placeholder="example@university.ac.kr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">비밀번호</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 font-semibold text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-[#11B886] focus:ring-[#11B886] transition-colors"
                />
                로그인 상태 유지
              </label>
              <button 
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="font-bold text-[#11B886] hover:text-[#0EA271] transition-colors"
              >
                비밀번호 찾기
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-bold shadow-lg shadow-[#11B886]/15 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  로그인
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>



          {/* Bottom links */}
          <p className="text-center text-sm font-semibold text-slate-400 pt-4">
            계정이 없으신가요?{" "}
            <Link to="/register" className="text-[#11B886] font-bold hover:underline transition-colors">
              회원가입 &rarr;
            </Link>
          </p>

        </div>
      </div>

      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
      />
    </div>
  );
}
