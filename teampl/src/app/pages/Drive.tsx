import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { useNavigate } from "react-router";
import {
  Folder, FileText, FileImage, FileCode2, FileType2,
  Search, MoreVertical, Plus, Upload, Download,
  ChevronRight, HardDrive, ChevronLeft,
  Loader2, Trash2, CloudUpload, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { driveApi, DriveFolder, DriveFile } from "../api/driveApi";
import FilePreviewModal from "../components/FilePreviewModal";

interface DriveProps {
  projectId?: number;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return FileImage;
  if (type === "application/pdf") return FileType2;
  if (type.includes("text") || type.includes("code")) return FileCode2;
  return FileText;
}

function getFileTheme(type: string) {
  if (type.startsWith("image/")) return "green";
  if (type === "application/pdf") return "red";
  return "purple";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function Drive({ projectId: propProjectId }: DriveProps = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentPath] = useState([{ name: propProjectId ? "자료실" : "전체 스페이스", id: "root" }]);
  const [searchQuery, setSearchQuery] = useState("");
  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>([]);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);

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

  const uploadFiles = async (files: FileList | File[]) => {
    if (!propProjectId) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const names = fileArray.map(f => f.name);
    setUploadingFiles(names);

    try {
      for (const file of fileArray) {
        await driveApi.uploadFile(propProjectId, file, selectedFolder?.id);
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
      await loadDocuments();
    } catch (e: any) {
      alert(e?.response?.data?.message || "업로드 중 오류가 발생했습니다.");
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
      await loadDocuments();
    } catch (e) {
      console.error("파일 삭제 실패", e);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
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

  const displayFolders = driveFolders.map(f => ({
    ...f,
    items: driveFiles.filter(file => file.folderId === f.id).length,
  }));

  // 현재 선택된 폴더 기준으로 파일 필터
  const filesInView = selectedFolder
    ? driveFiles.filter(f => f.folderId === selectedFolder.id)
    : driveFiles.filter(f => f.folderId === null || f.folderId === undefined);

  const filteredFiles = filesInView.filter(f =>
    f.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="py-6 lg:max-w-7xl lg:mx-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 전체 페이지 드래그 오버레이 */}
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
            <p className="text-[14px] font-bold text-[#11B886]/60 mt-2">KT Cloud에 업로드됩니다</p>
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
            <span className="font-black text-[14px]">업로드 완료!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 헤더 (독립 페이지) */}
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
                <button onClick={handleCreateFolder} className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 rounded-2xl text-[13px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95">
                  <Plus className="w-4 h-4" />
                  새 폴더
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-3 bg-[#11B886] text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(17,184,134,0.35)]">
                  <Upload className="w-4 h-4" />
                  업로드
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 메인 컨텐츠 */}
        <div className="lg:col-span-9 space-y-8">

          {/* 컨트롤 바 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[13px] font-black uppercase tracking-widest">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`transition-colors ${selectedFolder ? 'text-gray-400 dark:text-white/30 hover:text-[#11B886]' : 'text-[#1A2340] dark:text-white'}`}
              >
                {propProjectId ? '자료실' : '전체 스페이스'}
              </button>
              {selectedFolder && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
                  <span className="text-[#1A2340] dark:text-white">{selectedFolder.name}</span>
                </>
              )}
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#11B886] ml-2" />}
            </div>

            {/* 프로젝트 탭에서도 버튼 표시 */}
            {propProjectId && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={handleCreateFolder} className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95">
                  <Plus className="w-3.5 h-3.5" />
                  새 폴더
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-4 py-2.5 bg-[#11B886] text-white rounded-xl text-[12px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_12px_rgba(17,184,134,0.3)]">
                  <Upload className="w-3.5 h-3.5" />
                  파일 업로드
                </button>
              </div>
            )}

            {/* 검색 */}
            <div className="relative w-full sm:w-60 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#11B886] transition-colors" />
              <input
                type="text"
                placeholder="파일 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#12182B] border border-gray-200 dark:border-white/10 rounded-xl text-[13px] font-bold text-[#1A2340] dark:text-white focus:outline-none focus:border-[#11B886] transition-all"
              />
            </div>
          </div>

          {/* 업로드 중 표시 */}
          <AnimatePresence>
            {uploadingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#11B886]/5 border border-[#11B886]/20 rounded-2xl p-4 space-y-2"
              >
                <p className="text-[12px] font-black text-[#11B886] uppercase tracking-widest mb-3">업로드 중...</p>
                {uploadingFiles.map((name, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-[#11B886] animate-spin flex-shrink-0" />
                    <span className="text-[13px] font-bold text-[#1A2340] dark:text-white truncate">{name}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 폴더 - 루트에서만 표시 */}
          {!selectedFolder && displayFolders.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">폴더</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {displayFolders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder)}
                    className="bg-white dark:bg-[#12182B] rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all group border border-gray-100 dark:border-white/5"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        folder.name.includes('[자동 생성]') 
                          ? 'bg-purple-50 dark:bg-purple-500/10' 
                          : 'bg-amber-50 dark:bg-amber-500/10'
                      }`}>
                        <Folder className={`w-6 h-6 ${
                          folder.name.includes('[자동 생성]') ? 'text-purple-500' : 'text-amber-500'
                        }`} />
                      </div>
                      {folder.name.includes('[자동 생성]') && (
                        <span className="text-[9px] font-black text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">자동</span>
                      )}
                    </div>
                    <h3 className="text-[14px] font-black text-[#1A2340] dark:text-white truncate mb-1">{folder.name}</h3>
                    <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">{folder.items}개 파일</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 파일 목록 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
                {selectedFolder ? `${selectedFolder.name} 내 파일` : '전체 파일'} · {filteredFiles.length}개
              </h2>
            </div>

            {filteredFiles.length > 0 ? (
              <div className="space-y-2">
                {/* 테이블 헤더 */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
                  <div className="col-span-5">파일명</div>
                  <div className="col-span-2">크기</div>
                  <div className="col-span-2">업로더</div>
                  <div className="col-span-3 text-right">날짜 / 액션</div>
                </div>

                {filteredFiles.map(file => {
                  const Icon = getFileIcon(file.type);
                  const theme = getFileTheme(file.type);
                  const iconBgMap: Record<string, string> = {
                    green: "bg-green-50 dark:bg-green-500/10 text-green-500",
                    red: "bg-red-50 dark:bg-red-500/10 text-red-500",
                    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-500",
                  };

                  return (
                    <motion.div
                      key={file.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setPreviewFile(file)}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white dark:bg-[#12182B] rounded-2xl border border-gray-100 dark:border-white/5 hover:shadow-sm transition-all group items-center cursor-pointer"
                    >
                      {/* 파일 아이콘 + 이름 */}
                      <div className="col-span-5 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgMap[theme]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-[#1A2340] dark:text-white truncate leading-tight">{file.originalName}</p>
                          <p className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">{file.type.split("/")[1] || file.type}</p>
                        </div>
                      </div>

                      {/* 크기 */}
                      <div className="hidden md:block col-span-2">
                        <span className="text-[12px] font-bold text-gray-500 dark:text-white/50">{formatBytes(file.size)}</span>
                      </div>

                      {/* 업로더 */}
                      <div className="hidden md:flex col-span-2 items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-[#11B886]/10 flex items-center justify-center text-[11px] font-black text-[#11B886]">
                          {(file.uploader?.name || file.uploaderEmail)[0].toUpperCase()}
                        </div>
                        <span className="text-[12px] font-bold text-gray-500 dark:text-white/50 truncate">
                          {file.uploader?.name || file.uploaderEmail.split("@")[0]}
                        </span>
                      </div>

                      {/* 날짜 + 액션 */}
                      <div className="hidden md:flex col-span-3 items-center justify-end gap-2">
                        <span className="text-[11px] font-bold text-gray-400 dark:text-white/30">
                          {new Date(file.createdAt).toLocaleDateString("ko-KR")}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <a
                            href={file.url}
                            download={file.originalName}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-gray-400 hover:text-[#11B886] hover:bg-[#11B886]/10 rounded-xl transition-all"
                            title="다운로드"
                            onClick={e => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {user?.email === file.uploaderEmail && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(file); }}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 모바일 하단 버튼 */}
                      <div className="md:hidden flex items-center justify-between col-span-1">
                        <span className="text-[11px] text-gray-400">{formatBytes(file.size)} · {new Date(file.createdAt).toLocaleDateString()}</span>
                        <a href={file.url} download={file.originalName} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#11B886]/10 text-[#11B886] rounded-lg text-[11px] font-black">
                          <Download className="w-3.5 h-3.5" /> 다운로드
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl transition-all"
                onClick={selectedFolder ? undefined : () => fileInputRef.current?.click()}
                style={{ cursor: selectedFolder ? 'default' : 'pointer' }}
              >
                {selectedFolder?.name.includes('[자동 생성]') ? (
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
            )}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 드래그 앤 드롭 영역 */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files); }}
            className={`bg-white dark:bg-[#12182B] rounded-2xl p-8 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all group min-h-[180px] ${
              isDragOver
                ? "border-[#11B886] bg-[#11B886]/5"
                : "border-gray-200 dark:border-white/10 hover:border-[#11B886]/50"
            }`}
          >
            <CloudUpload className={`w-12 h-12 mb-3 transition-all ${isDragOver ? "text-[#11B886] scale-110" : "text-gray-300 dark:text-white/15 group-hover:text-[#11B886]/50"}`} />
            <p className={`text-[13px] font-black uppercase tracking-widest mb-1 transition-colors ${isDragOver ? "text-[#11B886]" : "text-gray-500 dark:text-white/40"}`}>
              드래그 앤 드롭
            </p>
            <p className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isDragOver ? "text-[#11B886]/70" : "text-gray-400 dark:text-white/20"}`}>
              또는 클릭하여 선택
            </p>
            <p className="text-[10px] text-gray-300 dark:text-white/15 mt-2">PDF, ZIP, MP4, 이미지 등</p>
          </div>

          {/* 스토리지 정보 */}
          <div className="bg-white dark:bg-[#12182B] rounded-2xl p-5 border border-gray-100 dark:border-white/5 space-y-3">
            <h3 className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">스토리지 정보</h3>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-[13px] font-black text-[#1A2340] dark:text-white">KT Cloud</p>
                <p className="text-[10px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">Object Storage</p>
              </div>
            </div>
            <div className="pt-1 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-white/40">
                <span>총 파일 수</span>
                <span className="text-[#1A2340] dark:text-white font-black">{driveFiles.length}개</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-white/40">
                <span>폴더 수</span>
                <span className="text-[#1A2340] dark:text-white font-black">{driveFolders.length}개</span>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-white/40">
                <span>총 용량</span>
                <span className="text-[#1A2340] dark:text-white font-black">
                  {formatBytes(driveFiles.reduce((sum, f) => sum + f.size, 0))}
                </span>
              </div>
            </div>
          </div>
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
