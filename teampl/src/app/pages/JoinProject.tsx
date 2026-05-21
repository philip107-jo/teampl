import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { projectApi } from "../api/projectApi";
import { Loader2 } from "lucide-react";

export default function JoinProject() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) {
      setError("유효하지 않은 초대 링크입니다.");
      return;
    }

    if (!user) {
      // 로그인 안 된 상태면 로그인 페이지로 리다이렉트
      navigate(`/login?redirect=/join?code=${code}`);
      return;
    }

    const join = async () => {
      try {
        const project = await projectApi.joinProject(code);
        navigate(`/projects/${project.id}`);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "참여에 실패했습니다.");
      }
    };

    join();
  }, [code, user, navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0B1120]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-[#1A2340] rounded-2xl shadow-xl flex flex-col items-center">
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">참여 실패</h2>
            <p className="text-gray-500 dark:text-white/60 mb-6">{error}</p>
            <button 
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-[#11B886] text-white rounded-xl font-bold hover:bg-[#0EA271] transition-colors"
            >
              홈으로 돌아가기
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-[#11B886] animate-spin mb-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">프로젝트에 참여하는 중...</h2>
            <p className="text-gray-500 dark:text-white/60">잠시만 기다려주세요.</p>
          </>
        )}
      </div>
    </div>
  );
}
