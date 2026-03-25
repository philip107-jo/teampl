import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import {
  Folder, FileText, FileImage, FileBarChart, FileCode2,
  Search, Filter, MoreVertical, Plus, Upload, Download,
  ChevronRight, ChevronLeft, HardDrive, Trash2, FolderOpen, ExternalLink, Link2
} from "lucide-react";

export default function Drive() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTestUser = user?.isTestUser;

  const [currentPath, setCurrentPath] = useState([{ name: "전체 스페이스", id: "root" }]);
  const [activeTab, setActiveTab] = useState("전체");

  const folders = isTestUser ? [
    { id: "f1", name: "데이터베이스 설계", items: 5, color: "text-blue-500", bg: "bg-blue-50" },
    { id: "f2", name: "UI/UX 디자인 리소스", items: 8, color: "text-pink-500", bg: "bg-pink-50" },
    { id: "f3", name: "기획안 및 회의록", items: 12, color: "text-orange-500", bg: "bg-orange-50" },
    { id: "f4", name: "프론트엔드 에셋", items: 3, color: "text-indigo-500", bg: "bg-indigo-50" },
  ] : [];

  const files = isTestUser ? [
    { id: "1", name: "요구사항_명세서_최종 (공동문서).docx", type: "word", creator: "나 (팀장)", date: "방금 전", size: "-", isWeb: true, icon: FileText, color: "text-[#2B579A]", bg: "bg-[#E2ECFF]" },
    { id: "6", name: "발표용_배경에셋.zip", type: "zip", creator: "김철수", date: "1시간 전", size: "14.5MB", isWeb: false, icon: FileCode2, color: "text-gray-600", bg: "bg-gray-100" },
    { id: "4", name: "주간회의록_0310 (공동문서).docx", type: "word", creator: "이영희", date: "1일 전", size: "-", isWeb: true, icon: FileText, color: "text-[#2B579A]", bg: "bg-[#E2ECFF]" },
    { id: "7", name: "로고_최종본_수정본.png", type: "image", creator: "이영희", date: "2일 전", size: "1.2MB", isWeb: false, icon: FileImage, color: "text-blue-500", bg: "bg-blue-50" },
  ] : [];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#f8faff] min-h-screen pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 mt-1 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="space-y-1">
            <p className="text-gray-400 text-[14px] font-bold">팀 공유 문서 및 정적 파일 저장소</p>
            <h1 className="text-[28px] font-black text-gray-900 tracking-tight flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-indigo-500" />
              웹 공유 통합 문서함
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-all shadow-sm">
            <Plus className="w-5 h-5" />
            새 폴더
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[14px] font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
            <Upload className="w-5 h-5" />
            파일 업로드
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">

          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide w-full sm:w-auto text-[15px] font-bold">
              {currentPath.map((path, idx) => (
                <div key={path.id} className="flex items-center gap-1 group whitespace-nowrap">
                  <button className={`hover:text-indigo-600 transition-colors ${idx === currentPath.length - 1 ? 'text-gray-900' : 'text-gray-400'}`}>
                    {path.name}
                  </button>
                  {idx < currentPath.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="공유 문서 및 파일 검색..."
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                />
              </div>
              <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors shadow-sm">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Folders Section */}
          <div className="space-y-4">
            <h2 className="text-[16px] font-extrabold text-gray-900">분류 폴더</h2>
            {folders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {folders.map((folder) => (
                  <div key={folder.id} className="bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-[16px] ${folder.bg} flex items-center justify-center`}>
                        <Folder className={`w-6 h-6 ${folder.color}`} fill="currentColor" fillOpacity={0.2} />
                      </div>
                      <button className="p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-900 mb-1 truncate">{folder.name}</h3>
                    <div className="text-[12px] font-bold text-gray-400">
                      <span>{folder.items}개 항목 연결됨</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[24px] p-8 text-center border border-gray-50 shadow-sm text-gray-400 font-bold text-[14px]">생성된 분류 폴더가 없습니다.</div>
            )}
          </div>

          {/* Docs & Files Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold text-gray-900">통합 목록</h2>
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-[200px] sm:max-w-none">
                {["전체", "일반파일", "MS오피스"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-gray-50 text-[12px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <div className="col-span-5 pl-2">문서 및 파일명</div>
                <div className="col-span-2">크기</div>
                <div className="col-span-2">소유자 (생성)</div>
                <div className="col-span-3 text-right pr-6 md:pr-10">최근 수정 / 내보내기</div>
              </div>
              <div className="divide-y divide-gray-50">
                {files.length > 0 ? files.map((file) => (
                  <div key={file.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors items-center group cursor-pointer">
                    <div className="col-span-12 sm:col-span-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${file.bg} flex items-center justify-center flex-shrink-0`}>
                        <file.icon className={`w-5 h-5 ${file.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{file.name}</p>
                        <p className="text-[12px] font-medium text-gray-400 sm:hidden mt-0.5">{file.creator} • {file.date}</p>
                      </div>
                    </div>
                    <div className="hidden sm:block col-span-2 text-[13px] font-medium text-gray-500">
                      {file.size}
                    </div>
                    <div className="hidden sm:flex col-span-2 items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 flex-shrink-0">
                        {file.creator[0]}
                      </div>
                      <span className="text-[13px] font-medium text-gray-500 truncate">{file.creator}</span>
                    </div>
                    <div className="hidden sm:flex col-span-3 items-center justify-end gap-2 pr-2">
                      <span className="text-[13px] font-medium text-gray-500">{file.date}</span>
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity ml-2 w-[80px]">
                        {file.isWeb ? (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-[10px] shadow-sm">
                            <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-[10px] transition-colors text-[12px] font-bold whitespace-nowrap" title="웹에서 열기">
                              <ExternalLink className="w-3.5 h-3.5" />
                              웹 열기
                            </button>
                          </div>
                        ) : (
                          <div className="bg-white border border-gray-100 rounded-[10px] shadow-sm">
                            <button className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-[10px] transition-colors text-[12px] font-bold whitespace-nowrap" title="파일 다운로드">
                              <Download className="w-3.5 h-3.5" />
                              다운로드
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-[16px] font-bold text-gray-500">이곳에 파일을 업로드 해 보세요</p>
                    <p className="text-[13px] font-medium text-gray-400 mt-1">업로드된 파일 및 문서는 여기서 확인할 수 있습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-3 space-y-6">

          {/* Quick Upload Dropzone - Restored below Title / Above Widgets */}
          <div className="bg-indigo-50/50 rounded-[28px] p-6 border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center text-center text-indigo-900/60 hover:bg-indigo-50 hover:border-indigo-400 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-[14px] font-bold text-indigo-900 mb-1">여기로 파일을 드래그</p>
            <p className="text-[11px] font-medium text-indigo-500/80">또는 클릭하여 브라우저 열기 (ZIP, MP4, PDF 등)</p>
          </div>

          {/* MS Office Integration Widget */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[24px] p-6 border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute -top-4 -right-4 p-3 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
              <FolderOpen className="w-32 h-32 text-blue-900" />
            </div>

            <div className="relative z-10 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm">무료연동</span>
                  <h3 className="text-[16px] font-black text-blue-900 tracking-tight">대학생 오피스 생성</h3>
                </div>
                <p className="text-[12px] text-blue-800/70 font-bold">학교 계정으로 팀 공유 문서를 바로 만드세요.</p>
              </div>

              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white border border-transparent hover:border-blue-200 transition-all group/btn shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#E2ECFF] flex items-center justify-center group-hover/btn:bg-[#2B579A] transition-colors">
                    <FileText className="w-4 h-4 text-[#2B579A] group-hover/btn:text-white transition-colors" />
                  </div>
                  <div className="text-left flex-1 text-[13px] font-bold text-[#2B579A]">Word 문서 만들기</div>
                  <Plus className="w-4 h-4 text-blue-300 group-hover/btn:text-[#2B579A]" />
                </button>

                <button className="w-full flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white border border-transparent hover:border-green-200 transition-all group/btn shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#E6F4EA] flex items-center justify-center group-hover/btn:bg-[#217346] transition-colors">
                    <FileBarChart className="w-4 h-4 text-[#217346] group-hover/btn:text-white transition-colors" />
                  </div>
                  <div className="text-left flex-1 text-[13px] font-bold text-[#217346]">Excel 시트 만들기</div>
                  <Plus className="w-4 h-4 text-green-300 group-hover/btn:text-[#217346]" />
                </button>

                <button className="w-full flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl hover:bg-white border border-transparent hover:border-orange-200 transition-all group/btn shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-[#FDECE4] flex items-center justify-center group-hover/btn:bg-[#B7472A] transition-colors">
                    <FileImage className="w-4 h-4 text-[#B7472A] group-hover/btn:text-white transition-colors" />
                  </div>
                  <div className="text-left flex-1 text-[13px] font-bold text-[#B7472A]">PowerPoint 만들기</div>
                  <Plus className="w-4 h-4 text-orange-300 group-hover/btn:text-[#B7472A]" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
