import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Folder, FileText, FileImage, FileBarChart, FileCode2,
  Search, Filter, MoreVertical, Plus, Upload, Download,
  ChevronRight, HardDrive, ExternalLink, ChevronLeft,
  Loader2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { officeApi, SharedDocument } from "../api/officeApi";

interface DriveProps {
  projectId?: number;
}

export default function Drive({ projectId: propProjectId }: DriveProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMockUser = user?.email === "test@naver.com";

  const [currentPath, setCurrentPath] = useState([{ name: propProjectId ? "프로젝트 파일" : "전체 스페이스", id: "root" }]);
  const [activeTab, setActiveTab] = useState("전체");
  const [officeDocs, setOfficeDocs] = useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (propProjectId) {
      loadDocuments();
    }
  }, [propProjectId]);

  const loadDocuments = async () => {
    if (!propProjectId) return;
    setIsLoading(true);
    try {
      const docs = await officeApi.getSharedDocuments(propProjectId);
      setOfficeDocs(docs);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  const mockFolders = [
    { id: "f1", name: "데이터베이스 설계", items: 5, theme: "blue" },
    { id: "f2", name: "UI/UX 디자인 리소스", items: 8, theme: "purple" },
    { id: "f3", name: "기획안 및 회의록", items: 12, theme: "orange" },
    { id: "f4", name: "프론트엔드 에셋", items: 3, theme: "green" },
  ];

  // 실제 DB 데이터와 목업 데이터를 조합
  const displayDocs = officeDocs.map(doc => ({
    id: `ms-${doc.id}`,
    name: doc.fileName,
    type: doc.fileType,
    creator: doc.creatorEmail === user?.email ? "나" : doc.creatorEmail.split('@')[0],
    date: new Date(doc.createdAt).toLocaleDateString(),
    size: "-",
    isWeb: true,
    webUrl: doc.webUrl,
    icon: doc.fileType === 'excel' ? "https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg" : doc.fileType === 'ppt' ? "https://upload.wikimedia.org/wikipedia/commons/0/0d/Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.svg" : "https://upload.wikimedia.org/wikipedia/commons/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg",
    theme: doc.fileType === 'excel' ? "green" : doc.fileType === 'ppt' ? "orange" : "blue"
  }));

  const mockStaticFiles = isMockUser ? [
    { id: "6", name: "발표용_배경에셋.zip", type: "zip", creator: "김철수", date: "1시간 전", size: "14.5MB", isWeb: false, icon: FileCode2, theme: "purple" },
    { id: "7", name: "로고_최종본_수정본.png", type: "image", creator: "이영희", date: "2일 전", size: "1.2MB", isWeb: false, icon: FileImage, theme: "green" },
  ] : [];

  const allFiles = [...displayDocs, ...mockStaticFiles];
  
  const filteredFiles = allFiles.filter(file => {
    if (activeTab === "MS오피스") return file.isWeb;
    if (activeTab === "일반파일") return !file.isWeb;
    return true;
  });

  const displayFolders = isMockUser ? mockFolders : [];

  return (
    <div className="dashboard pt-4 lg:max-w-7xl lg:mx-auto">
      {/* Top Navigation */}
      {!propProjectId && (
      <div className="hero-top mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="hero-action flex items-center justify-center p-0"
            title="이전 페이지로"
          >
            <ChevronLeft className="w-6 h-6 text-[#1A2340] dark:text-white" />
          </button>
        </div>
      </div>
      )}

      {/* Header */}
      {!propProjectId && (
      <section className="card hero-card mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-2 relative z-10">
          <div className="space-y-1">
            <p className="hero-meta uppercase">통합 저장소</p>
            <h1 className="hero-title flex items-center gap-4" style={{ fontSize: '2rem' }}>
              <div className="schedule-item purple !p-0 !border-none !bg-transparent">
                <div className="schedule-icon" style={{ width: 56, height: 56, borderRadius: 16 }}>
                  <HardDrive className="w-8 h-8" />
                </div>
              </div>
              공유 문서함
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 text-[#7D879C] dark:text-white/80 rounded-[20px] text-[14px] font-black uppercase tracking-widest hover:bg-white/60 dark:bg-white/10 transition-all shadow-sm active:scale-95">
              <Plus className="w-5 h-5" />
              새 폴더
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3.5 bg-[#7C6CFF] text-white rounded-[20px] text-[14px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(124,108,255,0.4)]">
              <Upload className="w-5 h-5" />
              파일 업로드
            </button>
          </div>
        </div>
      </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-10">
          
          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide w-full sm:w-auto text-[14px] font-black uppercase tracking-widest">
              {currentPath.map((path, idx) => (
                <div key={path.id} className="flex items-center gap-3 group whitespace-nowrap">
                  <button className={`hover:text-[#7C6CFF] transition-all ${idx === currentPath.length - 1 ? 'text-[#1A2340] dark:text-white' : 'text-[#7D879C]/80 dark:text-white/40'}`}>
                    {path.name}
                  </button>
                  {idx < currentPath.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-white/20" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isLoading && <Loader2 className="w-5 h-5 animate-spin text-[#7C6CFF]" />}
              <div className="relative flex-1 sm:w-72 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D879C]/80 dark:text-white/40 group-focus-within:text-[#7C6CFF] transition-colors" />
                <input
                  type="text"
                  placeholder="통합 검색..."
                  className="w-full pl-12 pr-5 py-3.5 bg-white dark:bg-[#12182B] border border-gray-200 dark:border-white/5 rounded-[20px] text-[14px] font-black uppercase tracking-widest text-[#1A2340] dark:text-white placeholder-white/20 focus:outline-none focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] transition-all"
                />
              </div>
              <button className="p-3.5 bg-white dark:bg-[#12182B] border border-gray-200 dark:border-white/5 rounded-[20px] text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:text-white hover:bg-white/60 dark:bg-white/10 transition-all shadow-sm">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Folders Section */}
          <div className="space-y-4">
            <h2 className="hero-meta px-1">분류 폴더</h2>
            {displayFolders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayFolders.map((folder) => (
                  <div key={folder.id} className="card !p-6 cursor-pointer hover:bg-white/40 dark:bg-[#1A2340] group !border-gray-200 dark:!border-white/5">
                    <div className="flex items-start justify-between mb-5">
                      <div className={`schedule-item ${folder.theme} !border-none !p-0 bg-transparent`}>
                        <div className="schedule-icon" style={{ width: 56, height: 56, borderRadius: 16 }}>
                          <Folder className="w-7 h-7" />
                        </div>
                      </div>
                      <button className="p-2 text-gray-300 dark:text-white/20 hover:text-[#1A2340] dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="card-title text-[15px] mb-1 truncate">{folder.name}</h3>
                    <div className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest leading-none">
                      {folder.items} ITEMS CONNECTED
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card !p-8 flex items-center justify-center border border-dashed border-gray-300 dark:border-white/10 text-center">
                <div className="text-[#7D879C]/80 dark:text-white/40 font-bold text-[13px]">생성된 폴더가 없습니다.</div>
              </div>
            )}
          </div>

          {/* Docs & Files Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="hero-meta">통합 목록</h2>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-[200px] sm:max-w-none">
                {["전체", "일반파일", "MS오피스"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#7C6CFF] text-white shadow-[0_0_15px_rgba(124,108,255,0.4)]' : 'bg-white dark:bg-[#12182B] text-[#7D879C]/80 dark:text-white/40 border border-gray-200 dark:border-white/5 hover:bg-white/60 dark:bg-white/10'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="hidden sm:grid grid-cols-12 gap-8 px-8 py-4 text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-[0.2em]">
                <div className="col-span-5">파일명 및 식별자</div>
                <div className="col-span-2">파일 크기</div>
                <div className="col-span-2">최종 수정자</div>
                <div className="col-span-3 text-right">상태 업데이트 / Action</div>
              </div>
              <div className="space-y-3">
                {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                  <div key={file.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 card !bg-white dark:!bg-[#12182B] hover:!bg-white/40 dark:!bg-[#1A2340] cursor-pointer group !rounded-[24px]">
                    <div className="col-span-12 sm:col-span-5 flex items-center gap-5 pl-2">
                      <div className={`schedule-item ${file.theme} !border-none !p-0 bg-transparent flex-shrink-0`}>
                        <div className="schedule-icon" style={{ width: 48, height: 48, borderRadius: 12 }}>
                          {typeof file.icon === 'string' ? (
                            <img src={file.icon} alt={file.type} className="w-7 h-7 object-contain drop-shadow-sm" />
                          ) : (
                            <file.icon className="w-6 h-6" />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-black text-[#1A2340] dark:text-white truncate transition-colors mb-0.5 group-hover:text-[#7C6CFF]">{file.name}</p>
                        <p className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest">{file.isWeb ? 'WEB DOCUMENT' : 'STATIC FILE'}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block col-span-2 text-[13px] font-black text-[#7D879C] dark:text-white/60">
                      {file.size}
                    </div>
                    <div className="hidden sm:flex col-span-2 items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/50 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-[#7D879C] dark:text-white/60 border border-gray-200 dark:border-white/5">
                        {file.creator[0]}
                      </div>
                      <span className="text-[13px] font-black text-[#7D879C] dark:text-white/60 truncate uppercase tracking-widest">{file.creator}</span>
                    </div>
                    <div className="hidden sm:flex col-span-3 items-center justify-end gap-3 pr-2">
                      <span className="text-[12px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest pr-2">{file.date}</span>
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                        {file.isWeb ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if ((file as any).webUrl) window.open((file as any).webUrl, '_blank');
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#7C6CFF]/20 text-[#7C6CFF] border border-[#7C6CFF]/30 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_10px_rgba(124,108,255,0.2)] hover:bg-[#7C6CFF]/30" 
                              title="웹에서 열기"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if ((file as any).webUrl) {
                                  const url = (file as any).webUrl;
                                  const dlUrl = url.includes('?') ? `${url}&download=1` : `${url}?download=1`;
                                  window.open(dlUrl, '_blank');
                                }
                              }}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 text-[#7D879C] dark:text-white/80 border border-gray-300 dark:border-white/10 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-white/60 dark:bg-white/10" 
                              title="사본 다운로드"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download
                            </button>
                          </div>
                        ) : (
                          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 text-[#7D879C] dark:text-white/80 border border-gray-300 dark:border-white/10 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-white/60 dark:bg-white/10" title="파일 다운로드">
                             <Download className="w-3.5 h-3.5" />
                             Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="card !p-12 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-white/10 text-center col-span-12">
                     <FileText className="w-12 h-12 text-gray-200 dark:text-white/10 mb-4" />
                     <div className="text-[#7D879C]/80 dark:text-white/40 font-bold text-[14px]">업로드된 파일이 없습니다.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#12182B] rounded-[32px] p-8 border border-gray-300 dark:border-white/10 flex flex-col items-center justify-center text-center hover:bg-white/50 dark:bg-white/5 transition-all cursor-pointer group shadow-sm">
            <div className="schedule-item blue !p-0 !border-none !bg-transparent mb-4 group-hover:scale-110 transition-transform">
              <div className="schedule-icon" style={{ width: 64, height: 64, borderRadius: 16 }}>
                <Upload className="w-8 h-8" />
              </div>
            </div>
            <p className="text-[14px] font-black text-[#1A2340] dark:text-white mb-1 uppercase tracking-widest">DRAG & DROP</p>
            <p className="text-[11px] font-black text-[#7C6CFF] uppercase tracking-widest">ZIP, PDF, MP4, ETC</p>
          </div>

          <div className="card !p-8 border border-gray-200 dark:border-white/5">
            <h3 className="hero-meta mb-6">INTEGRATIONS</h3>
            <div className="space-y-3">
              {[
                { label: "Word 문서", icon: "https://upload.wikimedia.org/wikipedia/commons/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg", theme: "blue", type: "word" },
                { label: "Excel 시트", icon: "https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg", theme: "green", type: "excel" },
                { label: "PPT 발표", icon: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.svg", theme: "orange", type: "ppt" },
              ].map((app, i) => {
                const isLocked = !user?.isUnivVerified;
                
                const handleMsDocClick = async () => {
                  if (isLocked) {
                    alert('대학생 인증이 필요한 기능입니다. 마이페이지에서 Microsoft 계정 연동을 진행해주세요.');
                    return;
                  }
                  if (!propProjectId) {
                     alert('진행 중인 프로젝트 내에서만 생성할 수 있습니다.');
                     return;
                  }
                  
                  try {
                    const data = await officeApi.createSharedDocument(propProjectId, app.type);
                    if (data.webUrl) {
                       window.open(data.webUrl, '_blank');
                       // 생성 후 목록 갱신
                       loadDocuments();
                    }
                  } catch (e: any) {
                    alert(e.response?.data?.message || '문서 시스템과 통신 실패');
                  }
                };

                return (
                  <button 
                    key={i} 
                    onClick={handleMsDocClick}
                    className={`w-full flex items-center justify-between p-4 bg-white dark:bg-[#12182B] rounded-2xl border border-gray-200 dark:border-white/5 transition-all group ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-white/50 dark:hover:bg-white/5 cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`schedule-item ${app.theme} !border-none !p-0 bg-transparent flex-shrink-0`}>
                        <div className="schedule-icon" style={{ width: 44, height: 44, borderRadius: 12 }}>
                           <img src={app.icon} alt={app.type} className="w-6 h-6 object-contain drop-shadow-sm" />
                        </div>
                      </div>
                      <span className="text-[13px] font-black text-[#7D879C] dark:text-white/80 group-hover:text-[#1A2340] dark:text-white uppercase tracking-widest">{app.label}</span>
                    </div>
                    {isLocked && <div className="text-gray-400 group-hover:text-red-400" title="잠김">🔒</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
