import { X, Download, Loader2 } from "lucide-react";
import { driveApi, DriveFile } from "../api/driveApi";
import { useEffect, useState } from "react";

interface FilePreviewModalProps {
  file: DriveFile;
  onClose: () => void;
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const blob = await driveApi.downloadFile(file.projectId, file.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("다운로드 에러:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#132038] w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{file.originalName}</h2>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0">
              {file.type.split('/')[1] || file.type}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-[#11B886] hover:bg-[#0EA271] disabled:opacity-50 text-white rounded-xl transition-all font-bold text-sm cursor-pointer border-none"
              title="다운로드"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? "다운로드 중..." : "다운로드"}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-black/40 flex items-center justify-center relative p-4">
          {isImage ? (
            <img 
              src={file.url} 
              alt={file.originalName} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm" 
            />
          ) : isPdf ? (
            <iframe 
              src={`${file.url}#toolbar=0`} 
              className="w-full h-full rounded-lg bg-white" 
              title={file.originalName} 
            />
          ) : (
            <div className="text-center bg-white dark:bg-[#1A2340] p-10 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
              <p className="text-gray-500 dark:text-white/40 mb-4 font-medium text-sm">
                이 파일 형식은 브라우저 미리보기를 지원하지 않습니다.
              </p>
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#11B886] text-white disabled:opacity-50 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity cursor-pointer border-none"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? "다운로드 중..." : "다운로드하여 확인하기"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
