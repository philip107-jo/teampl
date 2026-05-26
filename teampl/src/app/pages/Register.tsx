import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User as UserIcon, 
  GraduationCap, 
  Building2, 
  ChevronDown, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  AlertCircle, 
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
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
  const [step, setStep] = useState(1); // 1: 기본정보, 2: 비밀번호
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    password: "",
    passwordConfirm: "",
    department: "",
  });
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  // 이메일 인증 관련 상태들
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [timer, setTimer] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    setError("");
    setSendingCode(true);
    try {
      await authApi.sendVerificationCode(formData.email);
      setIsEmailSent(true);
      setTimer(300);
      setTimerActive(true);
      showToast("인증 번호가 이메일로 전송되었습니다.", "success");
    } catch (err: any) {
      setError(err.response?.data?.message || "인증 번호 전송에 실패했습니다.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError("인증 번호 6자리를 입력해주세요.");
      return;
    }
    setError("");
    setVerifyingCode(true);
    try {
      await authApi.verifyCode(formData.email, verificationCode);
      setIsEmailVerified(true);
      setTimerActive(false);
      showToast("이메일 인증이 완료되었습니다.", "success");
    } catch (err: any) {
      setError(err.response?.data?.message || "인증 번호가 일치하지 않거나 유효하지 않습니다.");
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    if (!formData.studentId.trim()) {
      setError("학번을 입력해주세요.");
      return;
    }
    if (!formData.email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }
    if (!isEmailVerified) {
      setError("이메일 인증을 완료해주세요.");
      return;
    }
    if (!formData.department) {
      setError("학과를 선택해주세요.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 4) {
      setError("비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!agreeTerms) {
      setError("이용약관 및 개인정보처리방침 동의에 체크해주세요.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await authApi.register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        studentId: formData.studentId,
        department: formData.department
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] py-12 px-6 font-sans relative overflow-hidden">
      {/* Soft Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#11B886]/5 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1A2340]/5 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[520px] relative z-10 animate-in fade-in zoom-in-95 duration-500 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Teampl 회원가입</h1>
          <p className="text-sm font-semibold text-slate-400">신입생도 쉽게 가입하고 팀플을 시작하세요</p>
        </div>

        {/* Form Container Card */}
        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-8">
          
          {/* Step Progress Indicators */}
          <div className="flex items-center justify-center gap-6 max-w-xs mx-auto">
            {/* Step 1 indicator */}
            <div className="flex items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                  step > 1 
                    ? "bg-[#11B886] text-white shadow-md shadow-[#11B886]/10" 
                    : "bg-[#11B886] text-white ring-4 ring-[#11B886]/10"
                }`}
              >
                {step > 1 ? "✓" : "1"}
              </div>
              <span className={`text-sm font-bold transition-colors ${step === 1 ? "text-slate-900" : "text-slate-400"}`}>
                기본정보
              </span>
            </div>

            {/* Connecting line */}
            <div className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${step > 1 ? "bg-[#11B886]" : "bg-slate-100"}`}></div>

            {/* Step 2 indicator */}
            <div className="flex items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                  step === 2 
                    ? "bg-[#11B886] text-white ring-4 ring-[#11B886]/10" 
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                2
              </div>
              <span className={`text-sm font-bold transition-colors ${step === 2 ? "text-slate-900" : "text-slate-400"}`}>
                비밀번호
              </span>
            </div>
          </div>

          {/* Form Action Wrapper */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {step === 1 ? (
            /* ================= STEP 1: 기본정보 ================= */
            <form onSubmit={handleNextStep} className="space-y-5 animate-in fade-in duration-300">
              
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">이름</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">이메일 주소</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                    </div>
                    <input
                      type="email"
                      required
                      disabled={isEmailVerified}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm disabled:opacity-60 disabled:bg-slate-100"
                      placeholder="name@university.ac.kr"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!formData.email.trim() || isEmailVerified || sendingCode}
                    onClick={handleSendVerificationCode}
                    className="px-4 bg-[#11B886] hover:bg-[#0EA271] text-white text-xs font-black rounded-2xl shadow-md shadow-[#11B886]/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer flex items-center justify-center min-w-[90px]"
                  >
                    {sendingCode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isEmailSent ? (
                      "재전송"
                    ) : (
                      "인증 요청"
                    )}
                  </button>
                </div>
              </div>

              {/* Verification Code Input */}
              {isEmailSent && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-bold text-slate-700 ml-1 flex justify-between">
                    <span>인증번호 입력</span>
                    {timerActive && (
                      <span className="text-red-500 font-extrabold text-xs">
                        남은 시간: {formatTimer(timer)}
                      </span>
                    )}
                    {!timerActive && timer === 0 && (
                      <span className="text-red-500 font-extrabold text-xs">
                        인증 시간이 만료되었습니다.
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Sparkles className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        disabled={isEmailVerified || (!timerActive && timer === 0)}
                        maxLength={6}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm disabled:opacity-60 disabled:bg-slate-100"
                        placeholder="6자리 인증번호"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={verificationCode.length !== 6 || isEmailVerified || (!timerActive && timer === 0) || verifyingCode}
                      onClick={handleVerifyCode}
                      className="px-4 bg-[#1A2340] hover:bg-[#111827] text-white text-xs font-black rounded-2xl shadow-md hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap cursor-pointer flex items-center justify-center min-w-[90px]"
                    >
                      {verifyingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isEmailVerified ? (
                        "인증 완료"
                      ) : (
                        "인증 확인"
                      )}
                    </button>
                  </div>
                  {isEmailVerified && (
                    <p className="text-xs font-bold text-[#11B886] ml-1">이메일 인증이 완료되었습니다.</p>
                  )}
                </div>
              )}


              {/* Student ID */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">학번</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GraduationCap className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm"
                    placeholder="20240001"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  />
                </div>
              </div>

              {/* Department Select */}
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-slate-700 ml-1">학과</label>
                <button
                  type="button"
                  onClick={() => setIsDeptOpen(!isDeptOpen)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-left flex items-center justify-between group hover:border-[#11B886] focus:ring-4 focus:ring-[#11B886]/10 focus:bg-white transition-all outline-none"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400 group-hover:text-[#11B886] transition-colors" />
                    <span className={`text-sm font-semibold ${formData.department ? "text-slate-900" : "text-slate-400"}`}>
                      {formData.department || "소속 학과를 선택해주세요"}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isDeptOpen ? "rotate-180" : ""}`} />
                </button>

                {isDeptOpen && (
                  <div className="absolute z-50 mt-2 w-full max-h-56 overflow-y-auto bg-white border border-slate-100 rounded-2xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-200 scrollbar-hide">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, department: dept });
                          setIsDeptOpen(false);
                          setError("");
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-[#11B886] rounded-xl transition-colors flex items-center justify-between group"
                      >
                        {dept}
                        {formData.department === dept && <CheckCircle2 className="w-4.5 h-4.5 text-[#11B886]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button
                type="submit"
                className="w-full py-4 mt-6 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-bold shadow-lg shadow-[#11B886]/15 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                다음 단계로
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

            </form>
          ) : (
            /* ================= STEP 2: 비밀번호 ================= */
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-300">
              
              {/* Password */}
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
                    placeholder="4자 이상 입력"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 ml-1">4자 이상, 영문+숫자 조합 권장</p>
              </div>

              {/* Password Confirm */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">비밀번호 확인</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                  </div>
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm"
                    placeholder="비밀번호 재입력"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Agreement */}
              <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-500 cursor-pointer select-none leading-normal">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-[#11B886] focus:ring-[#11B886] transition-colors mt-0.5"
                />
                <span>이용약관과 개인정보처리방침에 동의합니다.</span>
              </label>

              {/* Control Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200/80 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4.5 h-4.5" />
                  이전
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-4 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-bold shadow-lg shadow-[#11B886]/15 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      회원가입 완료
                      <UserPlus className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Bottom Navigation */}
        <p className="text-center text-sm font-semibold text-slate-400">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="text-[#11B886] font-bold hover:underline transition-colors">
            로그인 &rarr;
          </Link>
        </p>

      </div>
    </div>
  );
}
