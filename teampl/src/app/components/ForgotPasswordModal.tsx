import { useState } from "react";
import { X, Mail, KeyRound, Lock, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { authApi } from "../api/authApi";
import { useToast } from "../context/ToastContext";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setEmail("");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await authApi.sendForgotPasswordCode(email);
      showToast("인증번호가 전송되었습니다. 이메일을 확인해주세요.", "success");
      setStep(2);
    } catch (err: any) {
      showToast(err.response?.data?.message || "인증번호 전송에 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    try {
      await authApi.verifyForgotPasswordCode(email, code);
      showToast("인증이 완료되었습니다.", "success");
      setStep(3);
    } catch (err: any) {
      showToast(err.response?.data?.message || "잘못된 인증번호입니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      showToast("비밀번호가 일치하지 않습니다.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("비밀번호는 6자 이상이어야 합니다.", "error");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(email, newPassword);
      showToast("비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.", "success");
      handleClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || "비밀번호 변경에 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">비밀번호 찾기</h2>
          <button 
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10">
              <div 
                className="h-full bg-[#11B886] rounded-full transition-all duration-500"
                style={{ width: `${(step - 1) * 50}%` }}
              />
            </div>
            
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300 ${
                  step >= s 
                    ? "bg-[#11B886] border-[#11B886] text-white" 
                    : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-1.5 mb-6">
                <h3 className="text-lg font-bold text-slate-800">이메일 인증</h3>
                <p className="text-sm text-slate-500">가입하신 이메일 주소를 입력해주세요.</p>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm"
                    placeholder="example@university.ac.kr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-4 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-bold shadow-lg shadow-[#11B886]/15 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "인증번호 발송"}
              </button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-1.5 mb-6">
                <h3 className="text-lg font-bold text-slate-800">인증번호 입력</h3>
                <p className="text-sm text-slate-500">이메일로 전송된 6자리 코드를 입력해주세요.</p>
              </div>

              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-center tracking-[0.5em] text-lg"
                    placeholder="000000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-4 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-bold shadow-lg shadow-[#11B886]/15 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "인증 확인"}
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="text-center space-y-1.5 mb-6">
                <h3 className="text-lg font-bold text-slate-800">새 비밀번호 설정</h3>
                <p className="text-sm text-slate-500">새롭게 사용할 비밀번호를 입력해주세요.</p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm"
                    placeholder="새 비밀번호 (6자 이상)"
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-[#11B886] transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] focus:bg-white outline-none transition-all font-medium text-sm"
                    placeholder="새 비밀번호 확인"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full py-4 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl font-bold shadow-lg shadow-[#11B886]/15 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "비밀번호 변경 완료"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
