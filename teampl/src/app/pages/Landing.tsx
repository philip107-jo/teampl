import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { 
  CheckSquare, 
  Lock, 
  MessageSquare, 
  FolderOpen, 
  Users, 
  BarChart3, 
  ArrowRight, 
  ChevronDown 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  // If already authenticated, redirect straight to projects
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/projects", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Track scroll position to update header styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 scroll-smooth antialiased">
      <header 
        className={`fixed top-0 left-0 right-0 h-20 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm" 
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <div 
            className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform duration-200" 
            onClick={() => scrollToSection("home")}
          >
            <img 
              src="https://obj-e-1.ktcloud.com/teampl/ChatGPT%20Image%20May%2022,%202026,%2005_24_33%20PM.png" 
              onError={(e) => { e.currentTarget.src = "/logo.png"; }}
              alt="Teampl Logo" 
              className="w-11 h-11 object-contain"
            />
            <span className={`text-xl font-black tracking-tight transition-colors duration-300 ${isScrolled ? "text-slate-950" : "text-white"}`}>Teampl</span>
          </div>

          {/* Navigation Menu */}
          <nav className={`hidden md:flex items-center gap-8 font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600" : "text-white/80"}`}>
            <button 
              onClick={() => scrollToSection("home")} 
              className="hover:text-[#11B886] transition-colors cursor-pointer"
            >
              홈
            </button>
            <button 
              onClick={() => scrollToSection("features")} 
              className="hover:text-[#11B886] transition-colors cursor-pointer"
            >
              기능
            </button>
            <button 
              onClick={() => scrollToSection("how-to-use")} 
              className="hover:text-[#11B886] transition-colors cursor-pointer"
            >
              이용방법
            </button>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className={`text-sm font-bold transition-colors duration-300 ${isScrolled ? "text-slate-600 hover:text-slate-900" : "text-white/80 hover:text-white"}`}
            >
              로그인
            </Link>
            <Link 
              to="/register" 
              className="px-5 py-2.5 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-full text-sm font-bold shadow-md shadow-[#11B886]/10 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        id="home" 
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(9, 17, 31, 0.55), rgba(9, 17, 31, 0.75)), url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1920&q=80')`
        }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center py-32 relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow-sm mb-6 animate-in fade-in duration-700">
            <span className="text-[13px] font-bold text-white/90">
              대학 신입생을 위한 팀워크 플랫폼
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight md:leading-[1.15] mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            신입생도 쉽게 쓰는<br />
            <span className="text-[#11B886]">팀프로젝트 협업 툴</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-white/80 font-medium max-w-2xl leading-relaxed mb-10 break-keep animate-in fade-in slide-in-from-bottom-6 duration-700">
            조별과제가 두렵지 않도록, Teampl이 함께합니다.<br />
            과제 관리부터 파일 공유, 실시간 채팅까지 한 곳에서 해결하세요.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Link 
              to="/register" 
              className="w-full sm:w-auto px-8 py-4 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-full text-base font-black shadow-lg shadow-[#11B886]/30 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              무료로 시작하기
            </Link>
            <button 
              onClick={() => scrollToSection("features")}
              className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-full text-base font-bold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 backdrop-blur-sm transition-all duration-200"
            >
              기능 살펴보기
            </button>
          </div>

          {/* Bottom Chevron Arrow */}
          <button 
            onClick={() => scrollToSection("features")}
            className="animate-bounce p-3 bg-white/10 border border-white/10 shadow-md hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-all active:scale-90"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/50 mb-4">
              <span className="text-[12px] font-extrabold text-[#11B886] uppercase tracking-wider">
                핵심 기능
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#1A2340] tracking-tight leading-snug mb-4">
              팀프로젝트의 모든 것을 한 곳에서
            </h2>
            <p className="text-slate-500 font-semibold break-keep">
              Teampl 하나로 과제, 소통, 파일 공유까지 완벽하게 관리하세요.
            </p>
          </div>

          {/* Grid of 6 Premium Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Card 1: 과제 관리 */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-[#11B886]/30 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2340] mb-3">과제 관리</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep">
                마감일과 진행 상황을 한눈에 확인하고 팀원과 공유하세요. 깔끔한 보드 뷰로 업무 현황을 파악합니다.
              </p>
            </div>

            {/* Card 2: 단계별 잠금 해제 워크플로우 */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-[#11B886]/30 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2340] mb-3">단계별 잠금 해제 워크플로우</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep mb-6">
                이전 단계의 모든 과제를 완료해야 다음 단계가 자동으로 열립니다. 체계적인 순차 진행으로 팀의 완성도를 높여보세요.
              </p>
              {/* Step indicator visualizer */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <div className="w-6 h-6 bg-[#11B886] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm shadow-[#11B886]/20">✓</div>
                <div className="h-0.5 w-6 bg-emerald-200"></div>
                <div className="w-6 h-6 bg-[#11B886]/20 text-[#11B886] rounded-full flex items-center justify-center text-xs font-bold">⚙</div>
                <div className="h-0.5 w-6 bg-slate-200"></div>
                <div className="w-6 h-6 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-xs font-bold">🔒</div>
              </div>
            </div>

            {/* Card 3: 실시간 채팅 */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-[#11B886]/30 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2340] mb-3">실시간 채팅</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep">
                별도의 메신저 없이 팀원들과 실시간으로 소통하세요. 프로젝트별 대화방으로 정리됩니다.
              </p>
            </div>

            {/* Card 4: 파일 공유 / 자료실 */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-[#11B886]/30 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <FolderOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2340] mb-3">파일 공유 / 자료실</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep">
                PPT, PDF, 보고서 등 모든 자료를 한 곳에 업로드하고 팀원들과 편하게 공유하세요.
              </p>
            </div>

            {/* Card 5: 팀원 역할 및 업무 분담 */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-[#11B886]/30 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2340] mb-3">팀원 역할 및 업무 분담</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep">
                팀장, 발표자, 자료조사 등 역할을 명확히 나누고 담당자별 업무를 투명하게 관리하세요.
              </p>
            </div>

            {/* Card 6: 투표 / 의사결정 */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 hover:bg-white hover:border-[#11B886]/30 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 group">
              <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-[#1A2340] mb-3">투표 / 의사결정</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep">
                모임 시간 조율이나 주제 선정처럼 간단한 의사결정을 투표 기능으로 빠르게 해결하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section id="how-to-use" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side: Illustration */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 group">
              <div className="absolute inset-0 bg-[#11B886]/5 mix-blend-multiply transition-colors group-hover:bg-[#11B886]/0 duration-300" />
              <img 
                src="https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&w=800&q=80" 
                alt="Students collaborating" 
                className="w-full object-cover aspect-[4/3] group-hover:scale-[1.02] transition-transform duration-500"
              />
              {/* Badge */}
              <div className="absolute top-6 left-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/50 shadow-md">
                <span className="text-[12px] font-extrabold text-[#11B886]">
                  이용 방법
                </span>
              </div>
            </div>

            {/* Right Side: Steps */}
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-[#1A2340] tracking-tight leading-snug mb-4">
                  3단계로 끝내는 스마트한 팀워크
                </h2>
                <p className="text-slate-500 font-semibold break-keep leading-relaxed">
                  복잡한 설정 없이, Teampl에 가입하고 프로젝트를 생성하면 팀원 초대부터 과제 관리까지 순식간에 시작할 수 있어요.
                </p>
              </div>

              {/* Step Checklist */}
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm border border-emerald-100/20">
                    01
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1A2340] mb-1.5">팀 프로젝트 생성</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep">
                      과목명과 팀원을 입력해서 새로운 프로젝트를 만듭니다. 초대 링크로 팀원을 쉽게 초대할 수 있어요.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm border border-emerald-100/20">
                    02
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1A2340] mb-1.5">단계별 워크플로우 설정</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep">
                      프로젝트를 단계별로 나누고, 각 단계에 과제를 배정합니다. 이전 단계를 완료해야 다음 단계로 넘어갈 수 있어요.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-5">
                  <div className="w-12 h-12 bg-emerald-50 text-[#11B886] rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-sm border border-emerald-100/20">
                    03
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1A2340] mb-1.5">협업 및 소통</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed break-keep">
                      채팅으로 실시간 소통하고, 파일을 공유하며 투표로 빠르게 의사결정을 내려요.
                    </p>
                  </div>
                </div>
              </div>

              {/* Start Now CTA */}
              <div className="pt-4">
                <Link 
                  to="/register"
                  className="inline-flex items-center gap-2 px-8 py-4.5 bg-[#1A2340] hover:bg-[#132038] text-white rounded-2xl font-black text-sm tracking-wider shadow-xl shadow-indigo-950/20 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                >
                  지금 시작해보기
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-white border-t border-slate-100 py-12 text-center text-slate-400 font-semibold text-sm">
        <div className="max-w-7xl mx-auto px-6">
          <p className="uppercase tracking-widest text-xs mb-2">&copy; 2026 Teampl. Built for Success.</p>
          <p className="text-xs text-slate-400/85">더 밝고 스마트한 협업의 시작, Teampl</p>
        </div>
      </footer>
    </div>
  );
}
