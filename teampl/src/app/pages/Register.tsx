import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { UserPlus, Mail, Lock, User as UserIcon, GraduationCap, Building2, ChevronDown, CheckCircle2, ArrowRight, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { authApi } from "../api/authApi";
import { useToast } from "../context/ToastContext";

const DEPARTMENTS = [
  "컴퓨터공학과", "소프트웨어융합보안학과", "AI전공", "정보통신학과",
  "건축디자인학과", "건축공학과", "건설시스템공학과", "유아교육과",
  "사회복지학과", "경영학과", "행정학과", "경찰학과", "군사학과",
  "호텔관광경영학과", "호텔조리학과", "외식사업학과", "항공서비스학과",
  "디자인학과", "스포츠마케팅학과", "체육학과", "보건행정학과"
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    password: "",
    passwordConfirm: "",
    department: "",
  });
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await authApi.register({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });
      showToast("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.", "success");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] relative overflow-hidden py-12 px-6">
      {/* Background Decorative Soft Blobs */}
      <div className="absolute top-[-5%] right-[-5%] w-[50%] h-[50%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-blue-50/40 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#1A2340] tracking-tight">계정 생성</h1>
          <div className="flex items-center justify-center mt-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50/50 border border-indigo-100/50 backdrop-blur-sm shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span className="text-[13px] font-bold text-[#7D879C]">
                더 나은 팀 협업 시스템, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-black tracking-tight">Teampl</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[48px] p-10 border border-white shadow-2xl shadow-gray-200/50">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            
            {error && (
              <div className="md:col-span-2 bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#7D879C] ml-1">이름</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="w-5 h-5 text-[#7D879C]/80 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[#1A2340] placeholder:text-[#7D879C]/80 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#7D879C] ml-1">학번</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <GraduationCap className="w-5 h-5 text-[#7D879C]/80 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[#1A2340] placeholder:text-[#7D879C]/80 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="20240001"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-[#7D879C] ml-1">이메일 주소</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-[#7D879C]/80 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[#1A2340] placeholder:text-[#7D879C]/80 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="name@university.ac.kr"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Department */}
            <div className="md:col-span-2 space-y-2 relative">
              <label className="text-sm font-bold text-[#7D879C] ml-1">학과</label>
              <button
                type="button"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-left flex items-center justify-between group hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-[#7D879C]/80 group-hover:text-indigo-600 transition-colors" />
                  <span className={formData.department ? "text-[#1A2340] font-medium" : "text-[#7D879C]/80"}>
                    {formData.department || "소속 학과를 선택해주세요"}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#7D879C]/80 transition-transform duration-300 ${isDeptOpen ? "rotate-180" : ""}`} />
              </button>

              {isDeptOpen && (
                <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 scrollbar-hide">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, department: dept });
                        setIsDeptOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-[#7D879C] hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center justify-between group"
                    >
                      {dept}
                      {formData.department === dept && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#7D879C] ml-1">비밀번호</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#7D879C]/80 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[#1A2340] placeholder:text-[#7D879C]/80 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            {/* Password Confirm */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#7D879C] ml-1">비밀번호 확인</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-[#7D879C]/80 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-[#1A2340] placeholder:text-[#7D879C]/80 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-700 text-[#1A2340] dark:text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "회원가입 완료"}
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="text-center mt-10 text-sm text-[#7D879C]">
            이미 계정이 있으신가요?{" "}
            <Link to="/login" className="text-indigo-600 font-bold hover:underline transition-all">
              로그인하기
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
