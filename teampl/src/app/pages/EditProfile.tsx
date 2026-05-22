import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User, GraduationCap, Building2, ChevronDown,
  CheckCircle2, ArrowLeft, Loader2, AlertCircle, Save, Camera
} from "lucide-react";
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
  const { user, updateUser } = useAuth();
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
      <section className="card hero-card mb-8">
        <div className="hero-top" style={{ alignItems: "flex-end", marginBottom: 0 }}>
          <div>
            <p className="hero-meta uppercase">내 정보</p>
            <h1 className="hero-title" style={{ fontSize: "2rem" }}>
              정보 수정
            </h1>
          </div>
        </div>
      </section>

      <div className="pb-24">
        <div className="card !p-10 border border-gray-200 dark:border-white/5 relative overflow-hidden !rounded-[40px]">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#11B886]/10 rounded-bl-full -z-10 blur-3xl" />

          {/* Avatar Preview */}
          <div className="flex items-center gap-6 mb-10">
            <div className="relative group cursor-pointer">
              <label htmlFor="avatar-upload" className="flex-shrink-0 cursor-pointer block relative rounded-[28px] overflow-hidden group shadow-[0_0_30px_rgba(17,184,134,0.4)]">
                <Avatar 
                  name={formData.name || user?.name} 
                  avatarUrl={user?.avatarUrl} 
                  shape="squircle"
                  className="w-20 h-20 text-[32px] !rounded-[28px]"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
                </div>
              </label>
              <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadingAvatar} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#1A2340] dark:text-white tracking-tight">
                {formData.name || user?.name}
              </h2>
              <p className="text-sm font-bold text-[#7D879C] mt-1">{user?.email}</p>
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
            <div className="space-y-2 relative">
              <label className="text-sm font-bold text-[#7D879C] ml-1">학과</label>
              <button
                type="button"
                onClick={() => setIsDeptOpen(!isDeptOpen)}
                className="w-full px-5 py-4 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl text-left flex items-center justify-between group hover:border-[#11B886]/30 transition-all"
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
                      {formData.department === dept && <CheckCircle2 className="w-4 h-4 text-[#11B886]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                disabled={loading}
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
        </div>
      </div>
    </div>
  );
}
