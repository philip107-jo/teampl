import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { LogIn, Mail, Lock, AlertCircle, Loader2, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] relative overflow-hidden p-6 font-sans">
      {/* Background Decorative Soft Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/50 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-50/50 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-600 shadow-xl shadow-indigo-200 mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
            <Compass className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">TeamSync</h1>
          <p className="text-gray-500 mt-3 font-medium">더 밝고 스마트한 협업의 시작</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[40px] p-10 border border-white shadow-2xl shadow-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">이메일</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="name@university.ac.kr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-gray-700">비밀번호</label>
                <Link to="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors">
                  비밀번호 찾기
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  로그인하기
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-10 text-sm text-gray-500">
            계정이 아직 없으신가요?{" "}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline transition-all">
              무료 회원가입
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-400 font-bold tracking-widest uppercase">
          &copy; 2026 TeamSync. Built for Success.
        </p>
      </div>
    </div>
  );
}
