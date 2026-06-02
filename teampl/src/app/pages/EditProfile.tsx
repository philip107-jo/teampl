import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  User, GraduationCap, Building2, ChevronDown,
  CheckCircle2, ArrowLeft, Loader2, AlertCircle, Save, Camera,
  X, Mail, KeyRound, Timer, ShieldAlert, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";
import { userApi } from "../api/userApi";

const DEPARTMENTS = [
  "컴퓨터공학과", "소프트웨어융합보안학과", "AI전공", "정보통신학과",
  "건축디자인학과", "건축공학과", "건설시스템공학과", "유아교육과",
  "사회복지학과", "경영학과", "행정학과", "경찰학과", "군사학과",
  "호텔관광경영학과", "호텔조리학과", "외식사업학과", "항공서비스학과",
  "디자인학과", "스포츠마케팅학과", "체육학과", "보건행정학과"
];

export default function EditProfile() {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    studentId: user?.studentId || "",
    department: user?.department || "",
  });
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isCustomDept, setIsCustomDept] = useState(false);

  useEffect(() => {
    if (user?.department && !DEPARTMENTS.includes(user.department)) {
      setIsCustomDept(true);
    }
  }, [user]);

  // 회원탈퇴 관련 상태
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawalCode, setWithdrawalCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5분 (300초)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isWithdrawModalOpen && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setWithdrawalError("인증 번호 유효 시간이 만료되었습니다. 다시 요청해 주세요.");
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWithdrawModalOpen, timeLeft]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const updated = await userApi.uploadAvatar(file);
      updateUser(updated);
      showToast("프로필 이미지가 변경되었습니다.", "success");
    } catch (err: any) {
      showToast("프로필 이미지 업로드에 실패했습니다.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleOpenWithdrawModal = () => {
    setIsConfirmModalOpen(true);
  };

  const startWithdrawalProcess = async () => {
    setIsConfirmModalOpen(false);
    setSendingCode(true);
    setWithdrawalError("");
    setWithdrawalCode("");
    try {
      await userApi.sendWithdrawalCode();
      setTimeLeft(300); // 5분
      setIsWithdrawModalOpen(true);
      showToast("인증 번호가 이메일로 전송되었습니다.", "success");
    } catch (err: any) {
      showToast(err.response?.data?.message || "인증 번호 발송에 실패했습니다.", "error");
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    setSendingCode(true);
    setWithdrawalError("");
    try {
      await userApi.sendWithdrawalCode();
      setTimeLeft(300);
      showToast("인증 번호가 재전송되었습니다.", "success");
    } catch (err: any) {
      setWithdrawalError(err.response?.data?.message || "인증 번호 재전송에 실패했습니다.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleConfirmWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawalCode.trim()) {
      setWithdrawalError("인증 번호를 입력해주세요.");
      return;
    }
    if (timeLeft <= 0) {
      setWithdrawalError("인증 번호 유효 시간이 만료되었습니다. 다시 요청해 주세요.");
      return;
    }

    setDeleting(true);
    setWithdrawalError("");
    try {
      await userApi.deleteAccount(withdrawalCode);
      showToast("회원탈퇴가 완료되었습니다.", "success");
      setIsWithdrawModalOpen(false);
      logout();
      navigate("/login");
    } catch (err: any) {
      setWithdrawalError(err.response?.data?.message || "회원탈퇴에 실패했습니다.");
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const updated = await userApi.updateProfile({
        name: formData.name,
        studentId: formData.studentId,
        department: formData.department,
      });
      updateUser(updated);
      showToast("정보가 성공적으로 수정되었습니다!", "success");
      navigate("/mypage");
    } catch (err: any) {
      const msg = err.response?.data?.message || "정보 수정에 실패했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard pt-4 lg:max-w-3xl lg:mx-auto">
      {/* Header */}
      <section className="card hero-card mb-5 sm:mb-6">
        <div className="hero-top" style={{ alignItems: "flex-end", marginBottom: 0 }}>
          <div>
            <p className="hero-meta uppercase text-[10px] sm:text-[11px] font-bold text-[#11B886]">내 정보</p>
            <h1 className="hero-title text-xl md:text-2xl font-black tracking-tight leading-tight text-[#1A2340] dark:text-white">
              정보 수정
            </h1>
          </div>
        </div>
      </section>

      <div className="pb-24">
        <div className="card !p-5 sm:!p-8 border border-gray-200 dark:border-white/5 relative overflow-hidden !rounded-2xl sm:!rounded-3xl">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-28 h-28 sm:w-40 sm:h-40 bg-[#11B886]/10 rounded-bl-full -z-10 blur-2xl" />

          {/* Avatar Preview */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative group cursor-pointer">
              <label htmlFor="avatar-upload" className="flex-shrink-0 cursor-pointer block relative rounded-xl sm:rounded-2xl overflow-hidden group shadow-[0_0_20px_rgba(17,184,134,0.3)]">
                <Avatar 
                  name={formData.name || user?.name} 
                  avatarUrl={user?.avatarUrl} 
                  shape="squircle"
                  className="w-18 h-18 text-xl sm:text-2xl !rounded-xl sm:!rounded-2xl"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Camera className="w-5 h-5 text-white" />}
                </div>
              </label>
              <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#1A2340] dark:text-white tracking-tight">
                {formData.name || user?.name}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#7D879C] mt-0.5">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#7D879C] ml-1">이름</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-[#7D879C]/80 group-focus-within:text-[#11B886] transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-[#1A2340] dark:text-white placeholder:text-[#7D879C]/80 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] outline-none transition-all"
                  placeholder="홍길동"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            {/* 학번 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#7D879C] ml-1">학번</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <GraduationCap className="w-5 h-5 text-[#7D879C]/80 group-focus-within:text-[#11B886] transition-colors" />
                </div>
                <input
                  type="text"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-[#1A2340] dark:text-white placeholder:text-[#7D879C]/80 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] outline-none transition-all"
                  placeholder="20240001"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                />
              </div>
            </div>

            {/* 학과 드롭다운 */}
            {isCustomDept ? (
              <div className="space-y-2 relative group">
                <label className="text-sm font-bold text-[#7D879C] ml-1">학과 (직접 입력)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="w-5 h-5 text-[#7D879C]/80 group-focus-within:text-[#11B886] transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-24 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-[#1A2340] dark:text-white placeholder:text-[#7D879C]/80 focus:ring-4 focus:ring-[#11B886]/10 focus:border-[#11B886] outline-none transition-all"
                    placeholder="학과명을 직접 입력해주세요"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomDept(false);
                      setFormData({ ...formData, department: "" });
                    }}
                    className="absolute inset-y-0 right-4 flex items-center text-xs font-black text-[#11B886] hover:text-[#0EA271] transition-colors"
                  >
                    목록에서 선택
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 relative">
                <label className="text-sm font-bold text-[#7D879C] ml-1">학과</label>
                <button
                  type="button"
                  onClick={() => setIsDeptOpen(!isDeptOpen)}
                  className="w-full px-5 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-2xl text-left flex items-center justify-between group hover:border-[#11B886]/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#7D879C]/80 group-hover:text-[#11B886] transition-colors" />
                    <span className={formData.department ? "text-[#1A2340] dark:text-white font-medium" : "text-[#7D879C]/80"}>
                      {formData.department || "소속 학과를 선택해주세요"}
                    </span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[#7D879C]/80 transition-transform duration-300 ${isDeptOpen ? "rotate-180" : ""}`} />
                </button>

                {isDeptOpen && (
                  <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-white dark:bg-[#1A2340] border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
                    {DEPARTMENTS.map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => { setFormData({ ...formData, department: dept }); setIsDeptOpen(false); }}
                        className="w-full px-4 py-3 text-left text-sm text-[#7D879C] dark:text-white/70 hover:bg-[#11B886]/10 dark:hover:bg-white/5 hover:text-[#11B886] rounded-xl transition-colors flex items-center justify-between group"
                      >
                        {dept}
                        {formData.department === dept && <CheckCircle2 className="w-4.5 h-4.5 text-[#11B886]" />}
                      </button>
                    ))}

                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1 mx-2" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDept(true);
                        setFormData({ ...formData, department: "" });
                        setIsDeptOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-bold text-[#11B886] hover:bg-[#11B886]/15 rounded-xl transition-colors flex items-center justify-between group"
                    >
                      직접 입력...
                      <Sparkles className="w-4 h-4 text-[#11B886]" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate("/mypage")}
                className="flex-1 py-4 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-[#7D879C] dark:text-white/60 font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <ArrowLeft className="w-5 h-5" />
                취소
              </button>
              <button
                type="submit"
                disabled={loading || deleting}
                className="flex-1 py-4 bg-[#11B886] hover:bg-[#11B886]/90 text-white rounded-2xl font-bold shadow-lg shadow-[#11B886]/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    저장하기
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="mt-16 pt-8 border-t border-red-100 dark:border-red-900/30">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">위험 구역 (Danger Zone)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">계정을 삭제하면 복구할 수 없으며, 참여 중인 프로젝트와 작성한 모든 데이터가 함께 삭제됩니다.</p>
            <button
              type="button"
              onClick={handleOpenWithdrawModal}
              disabled={deleting || loading || sendingCode}
              className="w-full py-4 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-2xl font-bold border border-red-200 dark:border-red-500/30 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              {sendingCode ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "회원 탈퇴하기"
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isWithdrawModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsWithdrawModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-[#132038] w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden text-[#1A2340] dark:text-white"
              onClick={e => e.stopPropagation()}
            >
              {/* 닫기 버튼 */}
              <button 
                onClick={() => setIsWithdrawModalOpen(false)} 
                className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all rounded-full z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 헤더 */}
              <div className="flex flex-col items-center gap-4 text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">회원 탈퇴 인증</h3>
                  <p className="text-sm font-medium text-gray-400 mt-1">계정 보호를 위해 이메일 인증이 필요합니다.</p>
                </div>
              </div>

              {/* 본문 안내 */}
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-4 mb-6">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-relaxed text-center">
                  인증번호가 {user?.email} 주소로 발송되었습니다.<br />
                  탈퇴 완료 시 프로젝트, 과제, 메시지 등의 모든 데이터가<br />
                  즉시 영구 삭제되며 절대 복구할 수 없습니다.
                </p>
              </div>

              {/* 입력 폼 */}
              <form onSubmit={handleConfirmWithdrawal} className="space-y-4">
                {withdrawalError && (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl p-3 flex items-center gap-2.5 text-red-600 dark:text-red-400 text-xs animate-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="font-semibold">{withdrawalError}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 ml-1">인증번호 6자리</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <KeyRound className="w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={withdrawalCode}
                      onChange={(e) => setWithdrawalCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full pl-12 pr-24 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-150 dark:border-white/10 rounded-2xl text-center text-lg font-black tracking-widest text-gray-900 dark:text-white placeholder:text-gray-300 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all"
                    />
                    {/* 타이머 */}
                    <div className="absolute inset-y-0 right-4 flex items-center gap-1.5 text-xs font-black text-red-500 pointer-events-none">
                      <Timer className="w-4 h-4" />
                      <span>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={sendingCode || deleting}
                    className="flex-1 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-white/60 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {sendingCode ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    재전송
                  </button>
                  <button
                    type="submit"
                    disabled={deleting || sendingCode || timeLeft <= 0}
                    className="flex-[2] py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/10 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "최종 탈퇴 완료"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConfirmModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsConfirmModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-[#132038] w-full max-w-md rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-white/5 relative overflow-hidden text-[#1A2340] dark:text-white"
              onClick={e => e.stopPropagation()}
            >
              {/* 닫기 버튼 */}
              <button 
                onClick={() => setIsConfirmModalOpen(false)} 
                className="absolute top-6 right-6 p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all rounded-full z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 헤더 */}
              <div className="flex flex-col items-center gap-4 text-center mb-6">
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-500 shadow-sm">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">정말 탈퇴하시겠습니까?</h3>
                  <p className="text-sm font-medium text-gray-400 mt-1">탈퇴 전 아래의 경고 문구를 확인해주세요.</p>
                </div>
              </div>

              {/* 경고 본문 */}
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl p-5 mb-8">
                <ul className="text-xs font-semibold text-red-600 dark:text-red-400 space-y-2.5 list-disc list-inside">
                  <li>탈퇴 즉시 회원님의 계정 정보는 복구 불가합니다.</li>
                  <li>참여 중인 모든 프로젝트에서 탈퇴 및 제외 처리됩니다.</li>
                  <li>작성하셨던 모든 과제, 댓글, 대화 내용은 영구 소멸됩니다.</li>
                  <li>등록된 유료 카드 및 결제 세션도 함께 파기됩니다.</li>
                </ul>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-white/60 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center justify-center active:scale-[0.98]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={startWithdrawalProcess}
                  className="flex-[2] py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/10 transition-all flex items-center justify-center active:scale-[0.98]"
                >
                  인증 메일 전송 및 진행
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
