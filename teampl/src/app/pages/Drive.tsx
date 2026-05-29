import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { useNavigate } from "react-router";
import {
  Folder, FolderOpen, FileText, FileImage, FileCode2, FileType2, FileSpreadsheet,
  Search, Plus, Upload, Download,
  ChevronRight, HardDrive, ChevronLeft,
  Loader2, Trash2, CloudUpload, CheckCircle2, GripVertical, Move, AlertCircle, X,
  LayoutGrid, List, ChevronDown, Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { driveApi, DriveFolder, DriveFile } from "../api/driveApi";
import FilePreviewModal from "../components/FilePreviewModal";
import { socket, joinProjectChannel } from "../socket";

interface DriveProps {
  projectId?: number;
  isReadOnly?: boolean;
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

function getFileTypeDescription(type: string, name: string = "") {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls' || type.includes('spreadsheet') || type.includes('excel')) return "Excel 파일";
  if (ext === 'docx' || ext === 'doc' || type.includes('word') || type.includes('officedocument.wordprocessingml')) return "Word 문서";
  if (ext === 'pptx' || ext === 'ppt' || type.includes('presentation') || type.includes('powerpoint')) return "PowerPoint 발표";
  if (ext === 'pdf' || type === "application/pdf") return "PDF 문서";
  if (ext === 'png') return "PNG 이미지";
  if (ext === 'jpg' || ext === 'jpeg') return "JPG 이미지";
  if (ext === 'gif') return "GIF 이미지";
  if (ext === 'csv') return "CSV 파일";
  if (ext === 'zip' || ext === 'rar' || ext === '7z' || type.includes('zip') || type.includes('compressed')) return "압축 파일";
  if (ext === 'txt') return "텍스트 파일";
  if (ext === 'hwp') return "한글 문서";
  if (type.includes("image/")) return "이미지 파일";
  if (type.includes("text") || type.includes("code")) return "소스 코드";
  return ext ? `${ext.toUpperCase()} 파일` : "파일";
}

interface GroupedFiles {
  label: string;
  files: DriveFile[];
}

function groupFilesByDate(files: DriveFile[]): GroupedFiles[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const currentDay = today.getDay(); // 0: Sunday, 1: Monday, ...
  const startOfThisWeek = new Date(today);
  const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
  startOfThisWeek.setDate(startOfThisWeek.getDate() - daysToSubtract);
  
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  
  const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const groups: Record<string, DriveFile[]> = {
    "오늘": [],
    "어제": [],
    "이번주": [],
    "지난주": [],
    "이번달": [],
    "이전": []
  };
  
  // Sort descending by createdAt
  const sortedFiles = [...files].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  sortedFiles.forEach(file => {
    const fileDate = new Date(file.createdAt);
    const fileDay = new Date(fileDate.getFullYear(), fileDate.getMonth(), fileDate.getDate());
    
    if (fileDay.getTime() === today.getTime()) {
      groups["오늘"].push(file);
    } else if (fileDay.getTime() === yesterday.getTime()) {
      groups["어제"].push(file);
    } else if (fileDay.getTime() >= startOfThisWeek.getTime()) {
      groups["이번주"].push(file);
    } else if (fileDay.getTime() >= startOfLastWeek.getTime()) {
      groups["지난주"].push(file);
    } else if (fileDay.getTime() >= startOfThisMonth.getTime()) {
      groups["이번달"].push(file);
    } else {
      groups["이전"].push(file);
    }
  });
  
  const labelMapping: Record<string, string> = {
    "오늘": "오늘",
    "어제": "어제",
    "이번주": "이번 주 초",
    "지난주": "지난 주",
    "이번달": "이번 달 초",
    "이전": "오래된 파일"
  };
  
  return Object.entries(groups)
    .map(([key, list]) => ({
      label: labelMapping[key],
      files: list
    }))
    .filter(group => group.files.length > 0);
}

export default function Drive({ projectId: propProjectId, isReadOnly }: DriveProps = {}) {
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
  const [folderToDelete, setFolderToDelete] = useState<any | null>(null);
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // 탐색 및 드래그앤드롭 상태
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [draggingFileId, setDraggingFileId] = useState<number | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<number | null>(null);
  const [isDragOverBreadcrumb, setIsDragOverBreadcrumb] = useState(false);

  const [viewMode, setViewMode] = useState<"card" | "list">(() => {
    return (localStorage.getItem("driveViewMode") as "card" | "list") || "card";
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isDeleteBatchModalOpen, setIsDeleteBatchModalOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [tempFolderName, setTempFolderName] = useState("새 폴더");
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editFolderName, setEditFolderName] = useState("");

  const toggleViewMode = (mode: "card" | "list") => {
    setViewMode(mode);
    localStorage.setItem("driveViewMode", mode);
  };

  const toggleGroupCollapse = (label: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const getDeletableSelectedFileIds = () => {
    return selectedFileIds.filter(id => {
      const file = driveFiles.find(f => f.id === id);
      return file && !isReadOnly && user?.email === file.uploaderEmail;
    });
  };

  const handleBatchDeleteClick = () => {
    if (!propProjectId) return;
    
    // 선택된 모든 파일 정보 확인
    const selectedFiles = selectedFileIds
      .map(id => driveFiles.find(f => f.id === id))
      .filter(Boolean) as DriveFile[];
      
    // 내가 업로드하지 않은 타인의 파일이 섞여 있는지 검사
    const hasOthersFile = selectedFiles.some(file => file.uploaderEmail !== user?.email);
    if (hasOthersFile) {
      showToast("본인이 업로드한 파일만 삭제할 수 있습니다. 타인의 파일 선택을 해제해주세요.", "error");
      return;
    }

    const deletableIds = getDeletableSelectedFileIds();
    if (deletableIds.length === 0) {
      showToast("삭제할 파일이 선택되지 않았습니다.", "error");
      return;
    }
    setIsDeleteBatchModalOpen(true);
  };

  const confirmBatchDelete = async () => {
    if (!propProjectId) return;
    const deletableIds = getDeletableSelectedFileIds();
    setIsDeleteBatchModalOpen(false);
    setIsBatchDeleting(true);
    showToast("선택한 파일 삭제 중...", "info");
    try {
      await Promise.all(deletableIds.map(id => driveApi.deleteFile(propProjectId, id)));
      showToast("선택한 파일이 삭제되었습니다.", "success");
      setSelectedFileIds(prev => prev.filter(id => !deletableIds.includes(id)));
      await loadDocuments();
    } catch (e) {
      console.error("일괄 파일 삭제 실패", e);
      showToast("일부 파일 삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  useEffect(() => {
    setSelectedFileIds([]);
  }, [currentFolderId]);

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
    if (propProjectId) {
      loadDocuments();
      joinProjectChannel(propProjectId);

      const onDriveUpdated = () => {
      loadDocuments();
      };

      socket.on('driveUpdated', onDriveUpdated);

      return () => {
        socket.off('driveUpdated', onDriveUpdated);
      };
    }
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

  const handleCreateFolder = () => {
    setIsCreatingFolder(true);
    setTempFolderName("새 폴더");
  };

  const handleCreateFolderSubmitInline = async (name: string) => {
    const trimmedName = name.trim();
    if (!propProjectId || !trimmedName) {
      setIsCreatingFolder(false);
      return;
    }
    setIsCreatingFolder(false);
    try {
      setIsLoading(true);
      await driveApi.createFolder(propProjectId, trimmedName, currentFolderId);
      showToast("폴더가 생성되었습니다.", "success");
      await loadDocuments();
    } catch (e) {
      console.error("폴더 생성 실패", e);
      showToast("폴더 생성 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameFolderSubmitInline = async (folderId: number, name: string) => {
    const trimmedName = name.trim();
    setEditingFolderId(null);
    if (!propProjectId || !trimmedName) return;
    try {
      setIsLoading(true);
      await driveApi.updateFolder(propProjectId, folderId, trimmedName);
      showToast("폴더 이름이 수정되었습니다.", "success");
      await loadDocuments();
    } catch (e) {
      console.error("폴더 이름 수정 실패", e);
      showToast("폴더 이름 수정 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!propProjectId || !fileToDelete) return;
    const file = fileToDelete;
    setFileToDelete(null);
    try {
      await driveApi.deleteFile(propProjectId, file.id);
      showToast("파일이 삭제되었습니다.", "success");
      await loadDocuments();
    } catch (e) {
      console.error("파일 삭제 실패", e);
      showToast("파일 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  const confirmDeleteFolder = async () => {
    if (!propProjectId || !folderToDelete) return;
    const folder = folderToDelete;
    setFolderToDelete(null);
    try {
      setIsLoading(true);
      await driveApi.deleteFolder(propProjectId, folder.id);
      showToast("폴더가 삭제되었습니다.", "success");
      await loadDocuments();
    } catch (e) {
      console.error("폴더 삭제 실패", e);
      showToast("폴더 삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
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
    if (isReadOnly) return;
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
    if (isReadOnly) return;
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleSelectAllToggle = () => {
    const isAllSelected = filteredFiles.length > 0 && filteredFiles.every(f => selectedFileIds.includes(f.id));
    if (isAllSelected) {
      const filteredIds = filteredFiles.map(f => f.id);
      setSelectedFileIds(selectedFileIds.filter(id => !filteredIds.includes(id)));
    } else {
      const newIds = filteredFiles.map(f => f.id).filter(id => !selectedFileIds.includes(id));
      setSelectedFileIds([...selectedFileIds, ...newIds]);
    }
  };

  const handleDownloadZip = async (fileIdsToDownload: number[], archiveName: string = "archive.zip") => {
    if (!propProjectId || fileIdsToDownload.length === 0) return;
    setIsDownloadingZip(true);
    try {
      showToast("ZIP 압축 파일 생성 중...", "info");
      const blob = await driveApi.downloadZip(propProjectId, fileIdsToDownload);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', archiveName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("다운로드가 완료되었습니다.", "success");
    } catch (e: any) {
      console.error("ZIP 다운로드 실패", e);
      showToast("압축 다운로드 중 오류가 발생했습니다.", "error");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleSingleDownload = async (fileId: number, originalName: string) => {
    if (!propProjectId) return;
    try {
      showToast("파일 다운로드 중...", "info");
      const blob = await driveApi.downloadFile(propProjectId, fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("다운로드가 완료되었습니다.", "success");
    } catch (e: any) {
      console.error("파일 다운로드 실패", e);
      showToast("파일 다운로드 중 오류가 발생했습니다.", "error");
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

  const currentLevelFolders = displayFolders.filter(f => f.parentFolderId === currentFolderId);

  const activeFolderName = currentFolderId 
    ? driveFolders.find(f => f.id === currentFolderId)?.name
    : null;

  const getBreadcrumbs = useCallback(() => {
    const crumbs: { id: number | null; name: string }[] = [{ id: null, name: "자료실" }];
    if (currentFolderId === null) return crumbs;

    const path: { id: number; name: string }[] = [];
    let tempId: number | null = currentFolderId;
    let safetyCounter = 0;

    while (tempId && safetyCounter < 100) {
      const folder = driveFolders.find(f => f.id === tempId);
      if (!folder) break;
      path.unshift({ id: folder.id, name: folder.name });
      tempId = folder.parentFolderId ?? null;
      safetyCounter++;
    }

    return [...crumbs, ...path];
  }, [currentFolderId, driveFolders]);

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
                {/* 뷰 모드 토글 버튼 */}
                <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
                  <button
                    onClick={() => toggleViewMode("card")}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === "card"
                        ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm font-bold"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-white/80"
                    }`}
                    title="카드형 보기"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleViewMode("list")}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === "list"
                        ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm font-bold"
                        : "text-gray-400 hover:text-gray-600 dark:hover:text-white/80"
                    }`}
                    title="목록형 보기"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {!isReadOnly && (
                  <>
                    <button onClick={handleCreateFolder} className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 rounded-2xl text-[13px] font-black hover:bg-gray-100 dark:hover:bg-white/10 transition-all active:scale-95">
                      <Plus className="w-4 h-4" />
                      폴더 만들기
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple disabled={isReadOnly} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isReadOnly} className="flex items-center gap-2 px-5 py-3 bg-[#11B886] text-white rounded-2xl text-[13px] font-black hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(17,184,134,0.35)] disabled:opacity-50">
                      <Upload className="w-4 h-4" />
                      파일 업로드
                    </button>
                  </>
                )}
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
                onClick={() => {
                  const currentFolder = driveFolders.find(f => f.id === currentFolderId);
                  setCurrentFolderId(currentFolder?.parentFolderId ?? null);
                }}
                className="w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-[20px] font-bold text-gray-900 dark:text-white flex-wrap">
                  {getBreadcrumbs().map((crumb, idx) => (
                    <span key={crumb.id ?? "root"} className="flex items-center gap-2">
                      {idx > 0 && <span className="text-gray-300 font-light">&gt;</span>}
                      {idx === getBreadcrumbs().length - 1 ? (
                        <span>{crumb.name}</span>
                      ) : (
                        <button
                          onClick={() => setCurrentFolderId(crumb.id)}
                          className="text-gray-400 font-medium hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          {crumb.name}
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <p className="text-[12px] text-gray-400 dark:text-white/30 mt-0.5">
                  파일 {filteredFiles.length}개
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* 뷰 모드 토글 버튼 */}
              <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <button
                  onClick={() => toggleViewMode("card")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "card"
                      ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm font-bold"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-white/85"
                  }`}
                  title="카드형 보기"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm font-bold"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-white/85"
                  }`}
                  title="목록형 보기"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-2 flex-nowrap">
                  <button onClick={handleCreateFolder} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 rounded-xl text-[12px] sm:text-[13px] font-bold hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap">
                    <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    폴더 만들기
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple disabled={isReadOnly} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isReadOnly} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#11B886] text-white rounded-xl text-[12px] sm:text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_2px_8px_rgba(17,184,134,0.2)] disabled:opacity-50 whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5 text-white shrink-0" />
                    파일 업로드
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // 자료실 루트 화면 헤더 디자인 (폴더 만들기, 파일 업로드 버튼)
          <div className="flex items-start justify-between gap-6 mb-8 mt-2">
            <div>
              <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight">자료실</h1>
              <p className="text-[12px] text-gray-400 dark:text-white/30 mt-1 hidden sm:block">
                폴더를 클릭하거나 파일을 끌어 정리해보세요
              </p>
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* 뷰 모드 토글 버튼 */}
              <div className="flex items-center bg-gray-50 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <button
                  onClick={() => toggleViewMode("card")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "card"
                      ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm font-bold"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-white/85"
                  }`}
                  title="카드형 보기"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm font-bold"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-white/85"
                  }`}
                  title="목록형 보기"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isReadOnly && (
                <div className="flex items-center gap-2 flex-nowrap">
                  <button onClick={handleCreateFolder} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/80 rounded-xl text-[12px] sm:text-[13px] font-bold hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap">
                    <Folder className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    폴더 만들기
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple disabled={isReadOnly} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isReadOnly} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#11B886] text-white rounded-xl text-[12px] sm:text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all shadow-[0_2px_8px_rgba(17,184,134,0.2)] disabled:opacity-50 whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5 text-white shrink-0" />
                    파일 업로드
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}

      <div className="space-y-6">
        {/* 폴더 내부인 경우 상단에 '미분류로 이동' 점선 박스 노출 */}
        {!isReadOnly && currentFolderId !== null && (
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

        {viewMode === "card" ? (
          <>
            {/* 1. 폴더 목록 */}
            {(currentLevelFolders.length > 0 || isCreatingFolder) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 인라인 폴더 생성 카드 */}
                {isCreatingFolder && (
                  <div className="bg-white dark:bg-[#12182B] rounded-2xl p-6 border border-[#11B886] shadow-[0_8px_30px_rgba(17,184,134,0.15)] flex flex-col justify-between min-h-[140px]">
                    <div className="w-12 h-12 rounded-xl bg-[#E8F8F4] dark:bg-[#11B886]/10 flex items-center justify-center">
                      <Folder className="w-6 h-6 text-[#11B886]" />
                    </div>
                    <div className="mt-4">
                      <input
                        type="text"
                        autoFocus
                        value={tempFolderName}
                        onChange={e => setTempFolderName(e.target.value)}
                        onBlur={(e) => handleCreateFolderSubmitInline(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCreateFolderSubmitInline(tempFolderName);
                          } else if (e.key === "Escape") {
                            setIsCreatingFolder(false);
                          }
                        }}
                        ref={input => {
                          if (input) {
                            setTimeout(() => {
                              input.select();
                            }, 50);
                          }
                        }}
                        className="w-full px-2 py-1 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[14px] font-bold outline-none focus:border-[#11B886]"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Enter 키: 생성 / Esc 키: 취소</p>
                    </div>
                  </div>
                )}

                {/* 기존 폴더 목록 */}
                {currentLevelFolders.map(folder => {
                  const isOver = dragOverFolderId === folder.id;
                  const isAutoCreated = folder.name.includes('[자동 생성]');
                  const Icon = isOver ? FolderOpen : Folder;
                  const isEditing = editingFolderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => !isEditing && setCurrentFolderId(folder.id)}
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
                        {isAutoCreated ? (
                          <span className="text-[9px] font-black text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest">자동</span>
                        ) : (
                          !isReadOnly && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* 수정 버튼: 본인이 만든 폴더만 가능 */}
                              {(!folder.creatorEmail || folder.creatorEmail === user?.email) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingFolderId(folder.id);
                                    setEditFolderName(folder.name);
                                  }}
                                  className="p-2 text-gray-300 dark:text-white/25 hover:text-[#11B886] hover:bg-[#11B886]/10 rounded-xl cursor-pointer"
                                  title="이름 변경"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {/* 삭제 버튼: 본인이 만든 폴더만 가능 */}
                              {(!folder.creatorEmail || folder.creatorEmail === user?.email) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFolderToDelete(folder);
                                  }}
                                  className="p-2 text-gray-300 dark:text-white/25 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl cursor-pointer"
                                  title="폴더 삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <span className="bg-[#1A2340] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          {folder.items}개
                        </span>
                        {!isAutoCreated && (folder.creator?.name || folder.creatorEmail) && (
                          <span className="text-[12px] font-bold text-gray-500 dark:text-white/50 truncate max-w-[100px]" title={`생성자: ${folder.creator?.name || folder.creatorEmail}`}>
                            {folder.creator?.name || folder.creatorEmail?.split("@")[0]}
                          </span>
                        )}
                      </div>
                      <div className="mt-4">
                        {isEditing ? (
                          <input
                            type="text"
                            autoFocus
                            value={editFolderName}
                            onChange={e => setEditFolderName(e.target.value)}
                            onBlur={() => handleRenameFolderSubmitInline(folder.id, editFolderName)}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                handleRenameFolderSubmitInline(folder.id, editFolderName);
                              } else if (e.key === "Escape") {
                                setEditingFolderId(null);
                              }
                            }}
                            ref={input => {
                              if (input) {
                                setTimeout(() => {
                                  input.select();
                                }, 50);
                              }
                            }}
                            className="w-full px-2 py-1 bg-gray-50 dark:bg-[#0d1526] border border-[#11B886] rounded-lg text-gray-900 dark:text-white text-[14px] font-bold outline-none"
                          />
                        ) : (
                          <>
                            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white truncate">{folder.name}</h3>
                            <p className="text-[12px] text-gray-400 mt-0.5 font-medium">클릭해서 열기</p>
                          </>
                        )}
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
              {filteredFiles.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 mb-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filteredFiles.length > 0 && filteredFiles.every(f => selectedFileIds.includes(f.id))}
                      onChange={handleSelectAllToggle}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#11B886] focus:ring-[#11B886] cursor-pointer accent-[#11B886]"
                      id="selectAllFiles"
                    />
                    <label htmlFor="selectAllFiles" className="text-[13px] font-bold text-gray-600 dark:text-white/70 cursor-pointer select-none">
                      전체 선택 ({filteredFiles.length}개 중 {filteredFiles.filter(f => selectedFileIds.includes(f.id)).length}개 선택됨)
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedFileIds.filter(id => filteredFiles.some(f => f.id === id)).length > 0 ? (
                      <>
                        <button
                          onClick={() => {
                            const currentViewSelectedIds = selectedFileIds.filter(id => filteredFiles.some(f => f.id === id));
                            handleDownloadZip(
                              currentViewSelectedIds,
                              `${activeFolderName || "자료실"}_선택_산출물.zip`
                            );
                          }}
                          disabled={isDownloadingZip}
                          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#11B886] hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-[0_2px_8px_rgba(17,184,134,0.2)] animate-fade-in"
                        >
                          {isDownloadingZip ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          선택 다운로드 ({selectedFileIds.filter(id => filteredFiles.some(f => f.id === id)).length})
                        </button>
                        <button
                          onClick={handleBatchDeleteClick}
                          disabled={isBatchDeleting}
                          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 dark:border-red-500/10 rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-sm"
                        >
                          {isBatchDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          선택 삭제
                        </button>
                        <button
                          onClick={() => {
                            const currentViewIds = filteredFiles.map(f => f.id);
                            setSelectedFileIds(selectedFileIds.filter(id => !currentViewIds.includes(id)));
                          }}
                          className="px-3.5 py-2.5 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-300 dark:hover:bg-white/20 rounded-xl text-[12px] font-bold transition-all active:scale-95"
                        >
                          선택 해제
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          const allIds = filteredFiles.map(f => f.id);
                          handleDownloadZip(allIds, `${activeFolderName || "자료실"}_일괄_산출물.zip`);
                        }}
                        disabled={isDownloadingZip}
                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
                      >
                        {isDownloadingZip ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        일괄 다운로드 (전체 {filteredFiles.length}개)
                      </button>
                    )}
                  </div>
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
                        draggable={!isReadOnly}
                        onDragStart={((e: DragEvent<HTMLDivElement>) => {
                          if (isReadOnly) return;
                          setDraggingFileId(file.id);
                          if (e.dataTransfer) {
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", file.id.toString());
                          }
                        }) as any}
                        onDragEnd={(() => {
                          if (isReadOnly) return;
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
                            {/* 선택 체크박스 */}
                            <input
                              type="checkbox"
                              checked={selectedFileIds.includes(file.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (selectedFileIds.includes(file.id)) {
                                  setSelectedFileIds(selectedFileIds.filter(id => id !== file.id));
                                } else {
                                  setSelectedFileIds([...selectedFileIds, file.id]);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#11B886] focus:ring-[#11B886] cursor-pointer mt-4 accent-[#11B886] flex-shrink-0"
                            />
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSingleDownload(file.id, file.originalName);
                              }}
                              className="w-8 h-8 rounded-full bg-gray-50 hover:bg-[#11B886] dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-200 cursor-pointer border-none"
                              title="다운로드"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {!isReadOnly && user?.email === file.uploaderEmail && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFileToDelete(file);
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
          </>
        ) : (
          /* 3. 목록형 보기 */
          <div className="space-y-6">
            {/* 폴더 목록 (목록형) */}
            {(currentLevelFolders.length > 0 || isCreatingFolder) && (
              <div className="bg-white dark:bg-[#12182B] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-wider select-none">
                  <div className="col-span-6 md:col-span-5 flex items-center">이름</div>
                  <div className="hidden md:block col-span-3">수정한 날짜</div>
                  <div className="hidden md:block col-span-2">유형</div>
                  <div className="col-span-3 md:col-span-1 text-right">크기</div>
                  <div className="col-span-3 md:col-span-1 text-right">작업</div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {/* 인라인 폴더 생성 행 */}
                  {isCreatingFolder && (
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 items-center border-b border-gray-100 dark:border-white/5">
                      <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#E8F8F4] dark:bg-[#11B886]/10 flex items-center justify-center flex-shrink-0">
                          <Folder className="w-5 h-5 text-[#11B886]" />
                        </div>
                        <div className="truncate min-w-0 flex-1">
                          <input
                            type="text"
                            autoFocus
                            value={tempFolderName}
                            onChange={e => setTempFolderName(e.target.value)}
                            onBlur={(e) => handleCreateFolderSubmitInline(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCreateFolderSubmitInline(tempFolderName);
                              } else if (e.key === "Escape") {
                                setIsCreatingFolder(false);
                              }
                            }}
                            ref={input => {
                              if (input) {
                                setTimeout(() => {
                                  input.select();
                                }, 50);
                              }
                            }}
                            className="w-full px-2 py-0.5 bg-gray-50 dark:bg-[#0d1526] border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-[13px] font-bold outline-none focus:border-[#11B886]"
                          />
                        </div>
                      </div>
                      <div className="hidden md:block col-span-3 text-[12px] text-gray-400">
                        -
                      </div>
                      <div className="hidden md:block col-span-2 text-[12px] text-gray-400">
                        폴더
                      </div>
                      <div className="col-span-3 md:col-span-1 text-right text-[12px] text-gray-400">
                        -
                      </div>
                      <div className="col-span-3 md:col-span-1 text-right text-[10px] text-gray-400">
                        Enter키: 생성
                      </div>
                    </div>
                  )}

                  {/* 기존 폴더 목록 */}
                  {currentLevelFolders.map(folder => {
                    const isOver = dragOverFolderId === folder.id;
                    const isAutoCreated = folder.name.includes('[자동 생성]');
                    const Icon = isOver ? FolderOpen : Folder;
                    const isEditing = editingFolderId === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => !isEditing && setCurrentFolderId(folder.id)}
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
                        className={`grid grid-cols-12 gap-4 px-6 py-3.5 items-center cursor-pointer transition-colors relative group ${
                          isOver 
                            ? "bg-[#11B886]/10" 
                            : "hover:bg-gray-50/50 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isAutoCreated 
                              ? 'bg-purple-50 dark:bg-purple-500/10' 
                              : 'bg-[#E8F8F4] dark:bg-[#11B886]/10'
                          }`}>
                            <Icon className={`w-5 h-5 ${isAutoCreated ? 'text-purple-500' : 'text-[#11B886]'}`} />
                          </div>
                          <div className="truncate min-w-0 flex-1">
                            {isEditing ? (
                              <input
                                type="text"
                                autoFocus
                                value={editFolderName}
                                onChange={e => setEditFolderName(e.target.value)}
                                onBlur={() => handleRenameFolderSubmitInline(folder.id, editFolderName)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") {
                                    handleRenameFolderSubmitInline(folder.id, editFolderName);
                                  } else if (e.key === "Escape") {
                                    setEditingFolderId(null);
                                  }
                                }}
                                ref={input => {
                                  if (input) {
                                    setTimeout(() => {
                                      input.select();
                                    }, 50);
                                  }
                                }}
                                className="w-full px-2 py-0.5 bg-gray-50 dark:bg-[#0d1526] border border-[#11B886] rounded-lg text-gray-900 dark:text-white text-[13px] font-bold outline-none"
                              />
                            ) : (
                              <>
                                <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate block">
                                  {folder.name}
                                </span>
                                {isAutoCreated && (
                                  <span className="inline-block text-[8px] font-black text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.2 rounded-full uppercase tracking-widest mt-0.5">자동</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="hidden md:block col-span-3 text-[12px] text-gray-500 dark:text-white/40">
                          {new Date(folder.createdAt).toLocaleDateString("ko-KR")}
                        </div>
                        
                        <div className="hidden md:block col-span-2 text-[12px] text-gray-500 dark:text-white/40">
                          폴더
                        </div>
                        
                        <div className="col-span-3 md:col-span-1 text-right text-[12px] text-gray-500 dark:text-white/40 font-medium">
                          {folder.items}개
                        </div>
                        
                        <div className="col-span-3 md:col-span-1 flex justify-end items-center gap-1">
                          {!isAutoCreated && !isReadOnly && (!folder.creatorEmail || folder.creatorEmail === user?.email) && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFolderId(folder.id);
                                  setEditFolderName(folder.name);
                                }}
                                className="p-1 text-gray-400 dark:text-white/20 hover:text-[#11B886] hover:bg-[#11B886]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="이름 변경"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFolderToDelete(folder);
                                }}
                                className="p-1 text-gray-400 dark:text-white/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="폴더 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 파일 목록 (목록형) */}
            {filteredFiles.length > 0 ? (
              <div className="space-y-4">
                {/* 다중 선택 제어 바 */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={filteredFiles.length > 0 && filteredFiles.every(f => selectedFileIds.includes(f.id))}
                      onChange={handleSelectAllToggle}
                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#11B886] focus:ring-[#11B886] cursor-pointer accent-[#11B886]"
                      id="selectAllFilesList"
                    />
                    <label htmlFor="selectAllFilesList" className="text-[13px] font-bold text-gray-600 dark:text-white/70 cursor-pointer select-none">
                      전체 선택 ({filteredFiles.length}개 중 {filteredFiles.filter(f => selectedFileIds.includes(f.id)).length}개 선택됨)
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedFileIds.filter(id => filteredFiles.some(f => f.id === id)).length > 0 ? (
                      <>
                        <button
                          onClick={() => {
                            const currentViewSelectedIds = selectedFileIds.filter(id => filteredFiles.some(f => f.id === id));
                            handleDownloadZip(
                              currentViewSelectedIds,
                              `${activeFolderName || "자료실"}_선택_산출물.zip`
                            );
                          }}
                          disabled={isDownloadingZip}
                          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-[#11B886] hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-[0_2px_8px_rgba(17,184,134,0.2)]"
                        >
                          {isDownloadingZip ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          선택 다운로드 ({selectedFileIds.filter(id => filteredFiles.some(f => f.id === id)).length})
                        </button>
                        <button
                          onClick={handleBatchDeleteClick}
                          disabled={isBatchDeleting}
                          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 dark:border-red-500/10 rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-sm"
                        >
                          {isBatchDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          선택 삭제
                        </button>
                        <button
                          onClick={() => {
                            const currentViewIds = filteredFiles.map(f => f.id);
                            setSelectedFileIds(selectedFileIds.filter(id => !currentViewIds.includes(id)));
                          }}
                          className="px-3.5 py-2.5 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-white/80 hover:bg-gray-300 dark:hover:bg-white/20 rounded-xl text-[12px] font-bold transition-all active:scale-95"
                        >
                          선택 해제
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          const allIds = filteredFiles.map(f => f.id);
                          handleDownloadZip(allIds, `${activeFolderName || "자료실"}_일괄_산출물.zip`);
                        }}
                        disabled={isDownloadingZip}
                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[12px] font-bold transition-all active:scale-95 shadow-[0_2px_8px_rgba(37,99,235,0.2)]"
                      >
                        {isDownloadingZip ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        일괄 다운로드 (전체 {filteredFiles.length}개)
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white dark:bg-[#12182B] rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 px-6 py-3.5 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-wider select-none">
                    <div className="col-span-6 md:col-span-5 flex items-center pl-7">이름</div>
                    <div className="hidden md:block col-span-3">수정한 날짜</div>
                    <div className="hidden md:block col-span-2">유형</div>
                    <div className="col-span-3 md:col-span-1 text-right">크기</div>
                    <div className="col-span-3 md:col-span-1 text-right">작업</div>
                  </div>

                  {/* 날짜별 그룹 */}
                  {groupFilesByDate(filteredFiles).map(group => {
                    const isCollapsed = !!collapsedGroups[group.label];
                    return (
                      <div key={group.label} className="border-b border-gray-100 dark:border-white/5 last:border-b-0">
                        {/* Group Header */}
                        <div 
                          onClick={() => toggleGroupCollapse(group.label)}
                          className="flex items-center gap-2 px-6 py-2.5 bg-gray-50/30 dark:bg-white/1 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-white/3 select-none border-b border-gray-100/50 dark:border-white/5"
                        >
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                          <span className="text-[12px] font-black text-gray-600 dark:text-white/50">{group.label}</span>
                          <span className="text-[10px] bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/35 px-2 py-0.5 rounded-md font-bold">
                            {group.files.length}
                          </span>
                        </div>

                        {/* Group Files */}
                        {!isCollapsed && (
                          <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {group.files.map(file => {
                              const Icon = getFileIcon(file.type, file.originalName);
                              const theme = getFileTheme(file.type, file.originalName);
                              const colors = themeColorMap[theme] || themeColorMap.blue;
                              const isCurrentFileDragging = draggingFileId === file.id;
                              const isSelected = selectedFileIds.includes(file.id);

                              return (
                                <div
                                  key={file.id}
                                  draggable={!isReadOnly}
                                  onDragStart={((e: DragEvent<HTMLDivElement>) => {
                                    if (isReadOnly) return;
                                    setDraggingFileId(file.id);
                                    if (e.dataTransfer) {
                                      e.dataTransfer.effectAllowed = "move";
                                      e.dataTransfer.setData("text/plain", file.id.toString());
                                    }
                                  }) as any}
                                  onDragEnd={(() => {
                                    if (isReadOnly) return;
                                    setDraggingFileId(null);
                                  }) as any}
                                  onClick={() => setPreviewFile(file)}
                                  className={`grid grid-cols-12 gap-4 px-6 py-3 items-center cursor-pointer transition-colors relative group ${
                                    isCurrentFileDragging 
                                      ? "opacity-35 bg-[#11B886]/5" 
                                      : isSelected
                                      ? "bg-[#11B886]/5 dark:bg-[#11B886]/10 hover:bg-[#11B886]/10"
                                      : "hover:bg-gray-50/50 dark:hover:bg-white/5"
                                  }`}
                                >
                                  {/* Checkbox + Icon + Name */}
                                  <div className="col-span-6 md:col-span-5 flex items-center gap-3 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        if (selectedFileIds.includes(file.id)) {
                                          setSelectedFileIds(selectedFileIds.filter(id => id !== file.id));
                                        } else {
                                          setSelectedFileIds([...selectedFileIds, file.id]);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4 rounded border-gray-300 dark:border-white/20 text-[#11B886] focus:ring-[#11B886] cursor-pointer accent-[#11B886] flex-shrink-0"
                                    />
                                    
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                                    </div>
                                    
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-gray-400">
                                      <GripVertical className="w-3.5 h-3.5 cursor-grab" />
                                    </div>
                                    
                                    <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate block group-hover:text-[#11B886] transition-colors" title={file.originalName}>
                                      {file.originalName}
                                    </span>
                                  </div>
                                  
                                  {/* Date */}
                                  <div className="hidden md:block col-span-3 text-[12px] text-gray-500 dark:text-white/40">
                                    {new Date(file.createdAt).toLocaleDateString("ko-KR") + " " + new Date(file.createdAt).toLocaleTimeString("ko-KR", {hour: '2-digit', minute:'2-digit'})}
                                  </div>
                                  
                                  {/* Type */}
                                  <div className="hidden md:block col-span-2 text-[12px] text-gray-500 dark:text-white/40 truncate">
                                    {getFileTypeDescription(file.type, file.originalName)}
                                  </div>
                                  
                                  {/* Size */}
                                  <div className="col-span-3 md:col-span-1 text-right text-[12px] text-gray-500 dark:text-white/40 font-medium">
                                    {formatBytes(file.size)}
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="col-span-3 md:col-span-1 flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSingleDownload(file.id, file.originalName);
                                      }}
                                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-[#11B886] dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-200 cursor-pointer"
                                      title="다운로드"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    {!isReadOnly && user?.email === file.uploaderEmail && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFileToDelete(file);
                                        }}
                                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-red-500 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-200"
                                        title="삭제"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* 폴더 내 파일이 없는 경우 */
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
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileInput} multiple />

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* -- Folder Delete Confirmation Modal -- */}
      {folderToDelete && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-[400px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] !p-8 border border-red-500/20 dark:bg-[#132038]">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-[20px] flex items-center justify-center text-red-500 mb-6 shadow-inner mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-[20px] font-black text-center text-[#1A2340] dark:text-white tracking-tight leading-tight mb-3">정말 삭제하시겠습니까?</h2>
            <p className="text-[13px] font-bold text-center text-[#7D879C]/80 dark:text-white/40 mb-6 break-keep leading-relaxed">
              <span className="text-[#1A2340] dark:text-white">'{folderToDelete.name}'</span> 폴더를 삭제하면 폴더 내부의 <span className="text-red-500 font-black">모든 파일과 데이터도 함께 즉시 영구 삭제</span>됩니다. 그래도 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setFolderToDelete(null)}
                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-[#7D879C] dark:text-white/60 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95 border-none cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteFolder}
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:opacity-90 transition-all active:scale-95 border-none cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- File Delete Confirmation Modal -- */}
      {fileToDelete && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-[400px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] !p-8 border border-red-500/20 dark:bg-[#132038]">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-[20px] flex items-center justify-center text-red-500 mb-6 shadow-inner mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-[20px] font-black text-center text-[#1A2340] dark:text-white tracking-tight leading-tight mb-3">정말 삭제하시겠습니까?</h2>
            <p className="text-[13px] font-bold text-center text-[#7D879C]/80 dark:text-white/40 mb-6 break-keep leading-relaxed">
              <span className="text-[#1A2340] dark:text-white">'{fileToDelete.originalName}'</span> 파일을 삭제하시겠습니까? 삭제된 파일 정보는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setFileToDelete(null)}
                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-[#7D879C] dark:text-white/60 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95 border-none cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteFile}
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:opacity-90 transition-all active:scale-95 border-none cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Batch File Delete Confirmation Modal -- */}
      {isDeleteBatchModalOpen && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-w-[400px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] !p-8 border border-red-500/20 dark:bg-[#132038]">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-[20px] flex items-center justify-center text-red-500 mb-6 shadow-inner mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-[20px] font-black text-center text-[#1A2340] dark:text-white tracking-tight leading-tight mb-3">선택한 파일을 삭제하시겠습니까?</h2>
            <p className="text-[13px] font-bold text-center text-[#7D879C]/80 dark:text-white/40 mb-6 break-keep leading-relaxed">
              선택한 <span className="text-red-500 font-black">{selectedFileIds.length}개</span>의 파일을 정말로 삭제하시겠습니까? 
              <br />
              <span className="text-[11px] text-[#7D879C]/60 dark:text-white/30 block mt-2">
                (삭제된 파일은 복구할 수 없습니다. 본인이 올린 파일만 삭제할 수 있습니다.)
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteBatchModalOpen(false)}
                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-[#7D879C] dark:text-white/60 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95 border-none cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={confirmBatchDelete}
                className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:opacity-90 transition-all active:scale-95 border-none cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- Create Folder Modal -- */}
    </div>
  );
}
