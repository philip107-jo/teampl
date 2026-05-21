import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { useNavigate } from "react-router";
import {
  Folder, FolderOpen, FileText, FileImage, FileCode2, FileType2, FileSpreadsheet,
  Search, Plus, Upload, Download,
  ChevronRight, HardDrive, ChevronLeft,
  Loader2, Trash2, CloudUpload, CheckCircle2, GripVertical, Move
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { driveApi, DriveFolder, DriveFile } from "../api/driveApi";
import FilePreviewModal from "../components/FilePreviewModal";

interface DriveProps {
  projectId?: number;
}

function getFileIcon(type: string, name: string = "") {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls' || type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (ext === 'docx' || ext === 'doc' || type.includes('word') || type.includes('officedocument.wordprocessingml')) return FileText;
  if (type.startsWith("image/")) return FileImage;
  if (type === "application/pdf") return FileType2;
  if (type.includes("text") || type.includes("code")) return FileCode2;
  return FileText;
}

function getFileTheme(type: string, name: string = "") {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls' || type.includes('spreadsheet') || type.includes('excel')) return "green";
  if (ext === 'docx' || ext === 'doc' || type.includes('word') || type.includes('officedocument.wordprocessingml')) return "blue";
  if (type.startsWith("image/")) return "purple";
  if (type === "application/pdf") return "red";
  return "blue";
}

const themeColorMap: Record<string, { bg: string, icon: string, border: string }> = {
  green: {
    bg: "bg-[#E8F8F4] dark:bg-[#11B886]/10",
    icon: "text-[#11B886]",
    border: "border-[#11B886]/20"
  },
  blue: {
    bg: "bg-[#EEF4FF] dark:bg-blue-500/10",
    icon: "text-[#3538CD]",
    border: "border-blue-500/20"
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-500/10",
    icon: "text-purple-500",
    border: "border-purple-500/20"
  },
  red: {
    bg: "bg-red-50 dark:bg-red-500/10",
    icon: "text-red-500",
    border: "border-red-500/20"
  }
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(0)}KB`;
}

export default function Drive({ projectId: propProjectId }: DriveProps = {}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);

  // 탐색 및 드래그앤드롭 상태
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [draggingFileId, setDraggingFileId] = useState<number | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [isDragOverBreadcrumb, setIsDragOverBreadcrumb] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = useCallback(async () => {
    if (!propProjectId) return;
    setIsLoading(true);
    try {
      const driveContents = await driveApi.getDriveContents(propProjectId);
      setDriveFolders(driveContents.folders);
      setDriveFiles(driveContents.files);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  }, [propProjectId]);

  useEffect(() => {
    if (propProjectId) loadDocuments();
  }, [propProjectId, loadDocuments]);

  const uploadFiles = async (files: FileList | File[], folderId?: number | null) => {
    if (!propProjectId) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const names = fileArray.map(f => f.name);
    setUploadingFiles(names);

    try {
      const targetFolderId = folderId !== undefined ? folderId : currentFolderId;
      for (const file of fileArray) {
        await driveApi.uploadFile(propProjectId, file, targetFolderId || undefined);
      }
      setUploadSuccess(true);
      showToast("파일 업로드 완료!", "success");
      setTimeout(() => setUploadSuccess(false), 2500);
      await loadDocuments();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "업로드 중 오류가 발생했습니다.", "error");
    } finally {
      setUploadingFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  const handleCreateFolder = async () => {
    if (!propProjectId) return;
    const name = window.prompt("새 폴더 이름을 입력하세요:");
    if (!name?.trim()) return;
    try {
      setIsLoading(true);
      await driveApi.createFolder(propProjectId, name.trim());
      showToast("폴더가 생성되었습니다.", "success");
      await loadDocuments();
    } catch (e) {
      console.error("폴더 생성 실패", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async (file: DriveFile) => {
    if (!propProjectId) return;
    if (!confirm(`"${file.originalName}" 파일을 삭제하시겠습니까?`)) return;
    try {
      await driveApi.deleteFile(propProjectId, file.id);
      showToast("파일이 삭제되었습니다.", "success");
      await loadDocuments();
    } catch (e) {
      console.error("파일 삭제 실패", e);
    }
  };

  const handleMoveFile = async (fileId: number, targetFolderId: number | null) => {
    if (!propProjectId) return;
    try {
      await driveApi.moveFile(propProjectId, fileId, targetFolderId);
      const targetFolderName = targetFolderId 
        ? driveFolders.find(f => f.id === targetFolderId)?.name || "폴더"
        : "자료실";
      showToast(`파일이 '${targetFolderName}'(으)로 이동되었습니다.`, "success");
      await loadDocuments();
    } catch (err) {
      console.error("파일 이동 실패", err);
      showToast("파일 이동 중 오류가 발생했습니다.", "error");
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const filteredFiles = driveFiles.filter(f =>
    f.folderId === currentFolderId &&
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayFolders = driveFolders.map(f => ({
    ...f,
    items: driveFiles.filter(file => file.folderId === f.id).length,
  }));

  const activeFolderName = currentFolderId 
    ? driveFolders.find(f => f.id === currentFolderId)?.name
    : null;

  return (
    <div
      className="py-6 select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 전체 페이지 드래그 업로드 오버레이 */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#11B886]/10 backdrop-blur-sm border-4 border-dashed border-[#11B886] rounded-3xl pointer-events-none"
          >
            <CloudUpload className="w-20 h-20 text-[#11B886] mb-4 animate-bounce" />
            <p className="text-[24px] font-black text-[#11B886]">파일을 여기에 놓으세요</p>
            <p className="text-[14px] font-bold text-[#11B886]/60 mt-2">KT Cloud에 즉시 업로드됩니다</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 업로드 성공 토스트 */}
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[400] flex items-center gap-3 px-5 py-4 bg-[#11B886] text-white rounded-2xl shadow-2xl"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-black text-[14px]">작업 완료!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 독립 페이지 헤더 */}
      {!propProjectId && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
          <section className="bg-white dark:bg-[#12182B] rounded-[32px] p-8 mb-8 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                  <HardDrive className="w-7 h-7 text-purple-500" />
                </div>
                <div>
                  <h1 className="text-[22px] font-black text-[#1A2340] dark:text-white tracking-tight">공유 자료실</h1>
                  <p className="text-[12px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest mt-0.5">KT Cloud Object Storage</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleCreateFolder} className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 rounded-2xl text-[13px] font-black hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95">
                  <Plus className="w-4 h-4" />
                  폴더 만들기
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 bg-[#11B886] text-white rounded-2xl text-[13px] font-black hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(17,184,134,0.35)]">
                  <Upload className="w-4 h-4" />
                  파일 업로드
                </button>
              </div>
            </div>
          </section>
        </>
      )}
      {/* 이미지 시안과 100% 동일한 헤더 영역 */}
      {propProjectId && (
        currentFolderId !== null ? (
          // 폴더 진입 시 헤더 디자인 (뒤로가기 버튼, 자료실 > 폴더명, 파일 개수)
          <div className="flex items-start justify-between gap-6 mb-8 mt-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentFolderId(null)}
                className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-[20px] font-bold text-gray-900 dark:text-white">
                  <span className="text-gray-400 font-medium">자료실</span>
                  <span className="text-gray-300 font-light">&gt;</span>
                  <span>{activeFolderName}</span>
                </div>
                <p className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">
                  파일 {filteredFiles.length}개
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#11B886] text-white rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_2px_8px_rgba(17,184,134,0.2)]">
                <Upload className="w-4 h-4 text-white" />
                파일 업로드
              </button>
            </div>
          </div>
        ) : (
          // 자료실 루트 화면 헤더 디자인 (폴더 만들기, 파일 업로드 버튼)
          <div className="flex items-start justify-between gap-6 mb-8 mt-2">
            <div>
              <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">자료실</h1>
              <p className="text-[12px] text-gray-400 dark:text-white/30 mt-1">
                폴더를 클릭하거나 파일을 끌어 정리해보세요
              </p>
            </div>
            
            <div className="flex items-center gap-2.5">
              <button onClick={handleCreateFolder} className="flex items-center gap-1.5 px-4.5 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 rounded-xl text-[13px] font-bold hover:bg-gray-55 transition-all active:scale-95">
                <Folder className="w-4 h-4 text-gray-400" />
                폴더 만들기
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#11B886] text-white rounded-xl text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_2px_8px_rgba(17,184,134,0.2)]">
                <Upload className="w-4 h-4 text-white" />
                파일 업로드
              </button>
            </div>
          </div>
        )
      )}

      <div className="space-y-6">
        {/* 폴더 내부인 경우 상단에 '미분류로 이동' 점선 박스 노출 */}
        {currentFolderId !== null && (
          <div 
            onDragOver={(e) => {
              if (draggingFileId) {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverBreadcrumb(true);
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragOverBreadcrumb(false);
            }}
            onDrop={async (e) => {
              if (draggingFileId) {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOverBreadcrumb(false);
                await handleMoveFile(draggingFileId, null);
              }
            }}
            className={`border border-dashed py-3.5 rounded-2xl flex items-center justify-center text-[12px] transition-all duration-200 ${
              isDragOverBreadcrumb
                ? "border-amber-500 bg-amber-500/10 text-amber-600 font-bold scale-[1.01]"
                : draggingFileId
                ? "border-amber-500/40 bg-amber-500/5 text-amber-500/70 animate-pulse"
                : "border-gray-200 dark:border-white/10 text-gray-400"
            }`}
          >
            <span>← 파일을 여기에 놓으면 미분류로 이동</span>
          </div>
        )}

        {/* 1. 폴더 목록 (루트에서만 노출) */}
        {currentFolderId === null && displayFolders.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayFolders.map(folder => {
              const isOver = dragOverFolderId === folder.id;
              const isAutoCreated = folder.name.includes('[자동 생성]');
              const Icon = isOver ? FolderOpen : Folder;
              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggingFileId) setDragOverFolderId(folder.id);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverFolderId(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverFolderId(null);
                    if (e.dataTransfer.files.length > 0) {
                      await uploadFiles(e.dataTransfer.files, folder.id);
                    } else if (draggingFileId) {
                      await handleMoveFile(draggingFileId, folder.id);
                    }
                  }}
                  className={`bg-white dark:bg-[#12182B] rounded-2xl p-6 cursor-pointer border transition-all duration-300 relative group flex flex-col justify-between min-h-[140px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] ${
                    isOver
                      ? "border-[#11B886] shadow-[0_8px_30px_rgba(17,184,134,0.15)] scale-102"
                      : draggingFileId
                      ? "border-dashed border-[#11B886] bg-[#11B886]/5 animate-pulse"
                      : "border-gray-100 dark:border-white/5 hover:shadow-md hover:border-gray-200 dark:hover:border-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isAutoCreated 
                        ? 'bg-purple-50 dark:bg-purple-500/10' 
                        : 'bg-[#E8F8F4] dark:bg-[#11B886]/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${isAutoCreated ? 'text-purple-500' : 'text-[#11B886]'}`} />
                    </div>
                    {isAutoCreated && (
                      <span className="text-[9px] font-black text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">자동</span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="bg-[#1A2340] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      {folder.items}개
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-[15px] font-bold text-gray-900 dark:text-white truncate">{folder.name}</h3>
                    <p className="text-[12px] text-gray-400 mt-0.5 font-medium">클릭해서 열기</p>
                  </div>

                  {/* 드래그 호버 문구 피드백 */}
                  {draggingFileId && (
                    <div className="absolute inset-0 bg-[#11B886]/90 rounded-2xl flex flex-col items-center justify-center text-white font-black text-[13px] backdrop-blur-sm transition-all duration-200">
                      <Move className="w-5 h-5 mb-1 animate-bounce" />
                      여기에 놓기
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 2. 파일 목록 영역 */}
        <div className="space-y-4">
          {/* 루트 경로인 경우에만 '미분류 파일' 섹션 헤더 노출 */}
          {currentFolderId === null && (
            <div className="flex items-center gap-2 mt-4">
              <h2 className="text-[16px] font-bold text-[#1A2340] dark:text-white">
                미분류 파일
              </h2>
              <span className="bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 text-[12px] font-bold px-2 py-0.5 rounded-md">
                {filteredFiles.length}개
              </span>
            </div>
          )}
          {filteredFiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map(file => {
                const Icon = getFileIcon(file.type, file.originalName);
                const theme = getFileTheme(file.type, file.originalName);
                const colors = themeColorMap[theme] || themeColorMap.blue;
                const isCurrentFileDragging = draggingFileId === file.id;

                return (
                  <motion.div
                    key={file.id}
                    layout
                    draggable={true}
                    onDragStart={((e: DragEvent<HTMLDivElement>) => {
                      setDraggingFileId(file.id);
                      if (e.dataTransfer) {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", file.id.toString());
                      }
                    }) as any}
                    onDragEnd={(() => {
                      setDraggingFileId(null);
                    }) as any}
                    onClick={() => setPreviewFile(file)}
                    className={`bg-white dark:bg-[#12182B] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all group flex flex-col justify-between min-h-[140px] relative ${
                      isCurrentFileDragging 
                        ? "opacity-35 scale-95 border-dashed border-[#11B886] bg-[#11B886]/5" 
                        : "hover:border-gray-200 dark:hover:border-white/10 hover:shadow-md"
                    } cursor-pointer`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* 파일 아이콘 */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                          <Icon className={`w-6 h-6 ${colors.icon}`} />
                        </div>
                        
                        {/* 마우스 호버 그립 표시 */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-gray-400 mt-4">
                          <GripVertical className="w-3.5 h-3.5 cursor-grab" />
                        </div>
                      </div>

                      {/* 우측 상단 다운로드 및 삭제 버튼 */}
                      <div className="flex items-center gap-1">
                        <a
                          href={file.url}
                          download={file.originalName}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full bg-gray-50 hover:bg-[#11B886] dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-200"
                          title="다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {user?.email === file.uploaderEmail && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file);
                            }}
                            className="w-8 h-8 rounded-full bg-gray-50 hover:bg-red-500 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-200"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 min-w-0">
                      <h3 className="text-[14px] font-bold text-gray-900 dark:text-white truncate leading-tight group-hover:text-[#11B886] transition-colors" title={file.originalName}>
                        {file.originalName}
                      </h3>
                    </div>

                    {/* 하단 세부 사항 (시안과 일치: 좌측 용량/날짜, 우측 업로더) */}
                    <div className="flex items-end justify-between mt-3">
                      <div className="text-[12px] text-gray-400 dark:text-white/30 space-y-0.5 font-medium">
                        <div>{formatBytes(file.size)}</div>
                        <div>{new Date(file.createdAt).toLocaleDateString("ko-KR").replace(/\s/g, "")}</div>
                      </div>
                      
                      <span className="text-[12px] font-bold text-gray-500 dark:text-white/50 truncate max-w-[80px]">
                        {file.uploader?.name || file.uploaderEmail.split("@")[0]}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            (() => {
              const currentFolder = driveFolders.find(f => f.id === currentFolderId);
              const isAutoCreated = currentFolder?.name.includes('[자동 생성]');
              return (
                <div
                  className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl transition-all bg-gray-50/50 dark:bg-white/5"
                  onClick={isAutoCreated ? undefined : () => fileInputRef.current?.click()}
                  onDragOver={(e) => !isAutoCreated && e.preventDefault()}
                  onDrop={async (e) => {
                    if (isAutoCreated) return;
                    e.preventDefault();
                    if (e.dataTransfer.files.length > 0) {
                      await uploadFiles(e.dataTransfer.files);
                    }
                  }}
                  style={{ cursor: isAutoCreated ? 'default' : 'pointer' }}
                >
                  {isAutoCreated ? (
                    <>
                      <Folder className="w-14 h-14 text-purple-200 dark:text-purple-500/20 mb-4" />
                      <p className="text-[15px] font-black text-gray-400 dark:text-white/30">승인된 산출물이 없습니다</p>
                      <p className="text-[12px] text-gray-400 dark:text-white/20 mt-1">승인이 완료된 과제 산출물이 자동으로 등록됩니다</p>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-14 h-14 text-gray-200 dark:text-white/10 mb-4" />
                      <p className="text-[15px] font-black text-gray-400 dark:text-white/30">파일이 없습니다</p>
                      <p className="text-[12px] text-gray-400 dark:text-white/20 mt-1">클릭하거나 파일을 드래그하여 업로드하세요</p>
                    </>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
