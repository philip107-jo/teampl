import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { 
  Folder, FileText, FileImage, FileBarChart, FileCode2,
  Search, Filter, MoreVertical, Plus, Upload, Download,
  ChevronRight, HardDrive, ExternalLink, ChevronLeft,
  Loader2, CheckCircle2, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { officeApi, SharedDocument } from "../api/officeApi";
import { driveApi, DriveFolder, DriveFile } from "../api/driveApi";
import { useRef } from "react";

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
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isDark } = useDarkMode();

  // Custom Create Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [targetDocApp, setTargetDocApp] = useState<{label: string, type: string, theme: string} | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propProjectId) {
      loadDocuments();
    }
  }, [propProjectId]);

  const loadDocuments = async () => {
    if (!propProjectId) return;
    setIsLoading(true);
    try {
      const [docs, driveContents] = await Promise.all([
        officeApi.getSharedDocuments(propProjectId),
        driveApi.getDriveContents(propProjectId)
      ]);
      setOfficeDocs(docs);
      setDriveFolders(driveContents.folders);
      setDriveFiles(driveContents.files);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!propProjectId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      // folderId 매핑 로직 추가 가능 (우선 루트 폴더 저장)
      await driveApi.uploadFile(propProjectId, file);
      await loadDocuments(); // 새로고침
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!propProjectId) return;
    const name = window.prompt("새 폴더 이름을 입력하세요:");
    if (!name) return;
    try {
      setIsLoading(true);
      await driveApi.createFolder(propProjectId, name);
      await loadDocuments();
    } catch (e) {
      console.error("Fail to create folder", e);
    } finally {
      setIsLoading(false);
    }
  };

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
    icon: doc.fileType === 'excel' ? FileBarChart : doc.fileType === 'ppt' ? FileImage : FileText,
    theme: doc.fileType === 'excel' ? "green" : doc.fileType === 'ppt' ? "orange" : "blue",
    url: doc.webUrl
  }));

  const displayDbFiles = driveFiles.map(file => {
    const isImage = file.type.startsWith('image/');
    return {
      id: `db-${file.id}`,
      name: file.originalName,
      type: file.type,
      creator: file.uploader?.name || file.uploaderEmail.split('@')[0],
      date: new Date(file.createdAt).toLocaleDateString(),
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      isWeb: false,
      webUrl: null,
      url: `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080'}${file.url}`,
      icon: isImage ? FileImage : FileCode2,
      theme: isImage ? "green" : "purple"
    };
  });

  const allFiles = [...displayDocs, ...displayDbFiles];
  
  const filteredFiles = allFiles.filter(file => {
    if (activeTab === "MS오피스") return file.isWeb;
    if (activeTab === "일반파일") return !file.isWeb;
    return true;
  });

  const displayFolders = driveFolders.map(f => ({
    ...f, items: driveFiles.filter(file => file.folderId === f.id).length
  }));

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
            <button onClick={handleCreateFolder} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 text-[#7D879C] dark:text-white/80 rounded-[20px] text-[14px] font-black uppercase tracking-widest hover:bg-white/60 dark:bg-white/10 transition-all shadow-sm active:scale-95">
              <Plus className="w-5 h-5" />
              새 폴더
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-6 py-3.5 bg-[#7C6CFF] text-white rounded-[20px] text-[14px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(124,108,255,0.4)]">
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
                          <file.icon className="w-6 h-6" />
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
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if ((file as any).url) {
                                const a = document.createElement('a');
                                a.href = (file as any).url;
                                a.download = file.name;
                                a.click();
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 text-[#7D879C] dark:text-white/80 border border-gray-300 dark:border-white/10 rounded-xl transition-all text-[11px] font-black uppercase tracking-widest whitespace-nowrap hover:bg-white/60 dark:bg-white/10" title="파일 다운로드">
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
                { label: "Word 문서", icon: FileText, theme: "blue", type: "word" },
                { label: "Excel 시트", icon: FileBarChart, theme: "green", type: "excel" },
                { label: "PPT 발표", icon: FileImage, theme: "orange", type: "ppt" },
              ].map((app, i) => {
                const isLocked = !user?.isUnivVerified;
                
                const handleMsDocClick = () => {
                  if (isLocked) {
                    alert('대학생 인증이 필요한 기능입니다. 마이페이지에서 Microsoft 계정 연동을 진행해주세요.');
                    return;
                  }
                  if (!propProjectId) {
                     alert('진행 중인 프로젝트 내에서만 생성할 수 있습니다.');
                     return;
                  }
                  
                  setTargetDocApp(app);
                  setNewDocTitle(`새 ${app.label}`);
                  setIsCreateModalOpen(true);
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
                          <app.icon className="w-5 h-5" />
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
      {/* -- Custom MS Create Modal -- */}
      <AnimatePresence>
        {isCreateModalOpen && targetDocApp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              className="card w-full max-w-[440px] !p-8 text-center border border-gray-200 dark:border-none shadow-[0_30px_90px_rgba(124,108,255,0.15)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-visible bg-white"
              style={isDark ? { background: 'linear-gradient(180deg, #162540 0%, #132038 100%)' } : {}}
            >
              {/* Decoration Glow */}
              <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#7C6CFF]/15 blur-[60px] rounded-full`} />
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-center mb-2">
                   <div className={`px-4 py-1.5 rounded-xl bg-[#7C6CFF]/10 text-[#7C6CFF] text-[11px] font-black uppercase tracking-widest`}>
                      Create Microsoft Asset
                   </div>
                   <button 
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                </div>

                <div className="space-y-4">
                  <div className="text-left">
                    <h2 className="text-[24px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                      제목을 설정하세요
                    </h2>
                    <p className="text-[13px] font-bold text-slate-500 dark:text-white/40 mt-1">
                      {targetDocApp.label}를 생성합니다. (나중에 변경 가능)
                    </p>
                  </div>

                  <div className="relative group/input">
                     <input 
                       autoFocus
                       type="text"
                       value={newDocTitle}
                       onChange={(e) => setNewDocTitle(e.target.value)}
                       onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isCreating) {
                            (async () => {
                              if (!propProjectId) return;
                              setIsCreating(true);
                              try {
                                const data = await officeApi.createSharedDocument(propProjectId, targetDocApp.type, newDocTitle);
                                if (data.webUrl) {
                                  window.open(data.webUrl, '_blank');
                                  loadDocuments();
                                  setIsCreateModalOpen(false);
                                }
                              } catch (e: any) {
                                alert(e.response?.data?.message || '실패!');
                              } finally {
                                setIsCreating(false);
                              }
                            })();
                          }
                       }}
                       placeholder="파일 제목 입력"
                       className="w-full px-6 py-4 bg-white dark:bg-[#12182B]/60 border border-gray-200 dark:border-white/10 rounded-2xl text-[16px] font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C6CFF]/50 transition-all shadow-inner"
                     />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    disabled={isCreating}
                    onClick={async () => {
                      if (!propProjectId) return;
                      setIsCreating(true);
                      try {
                        const data = await officeApi.createSharedDocument(propProjectId, targetDocApp.type, newDocTitle);
                        if (data.webUrl) {
                          window.open(data.webUrl, '_blank');
                          loadDocuments();
                          setIsCreateModalOpen(false);
                        }
                      } catch (e: any) {
                        alert(e.response?.data?.message || '생성 실패');
                      } finally {
                        setIsCreating(false);
                      }
                    }}
                    className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_12px_24px_rgba(124,108,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                    {isCreating ? 'CREATING...' : '문서 생성하기'}
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-full py-4 text-slate-400 dark:text-white/30 text-[12px] font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-white transition-all underline underline-offset-4"
                  >
                    나중에 할게요
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
