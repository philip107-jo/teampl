import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { userApi } from '../api/userApi';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import CardRegisterModal from './CardRegisterModal';

interface SubscriptionPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  message?: string;
}

export function SubscriptionPaywallModal({ isOpen, onClose, onSuccess, message }: SubscriptionPaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { updateUser } = useAuth();
  const [showCardRegister, setShowCardRegister] = useState(false);

  // if (!isOpen) return null; 대신 AnimatePresence 안에서 조건부 렌더링

  const handleUpgrade = async () => {
    setShowCardRegister(true);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white dark:bg-[#1A2340] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative pt-12 pb-8 px-8 text-center overflow-hidden bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-6 relative">
              <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-400 animate-pulse" />
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
              팀플의 새로운 차원, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">PRO 요금제</span>
            </h2>
            <p className="text-gray-500 dark:text-white/60">
              {message || "AI 기반의 강력한 프로젝트 관리와 평가 시스템을 무제한으로 사용해보세요."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white/80 bg-white/50 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Free Plan */}
              <div className="p-5 rounded-2xl border-2 border-gray-100 dark:border-white/5 opacity-70">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">FREE 플랜</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-gray-600 dark:text-white/60">
                    <Check className="w-5 h-5 shrink-0 text-[#11B886]" />
                    <span>기본 과제 및 일정 관리</span>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-600 dark:text-white/60">
                    <Check className="w-5 h-5 shrink-0 text-[#11B886]" />
                    <span>AI 자동 기획 1회 한정</span>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-400 dark:text-white/30">
                    <X className="w-5 h-5 shrink-0" />
                    <span>무제한 AI 자동 기획</span>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-400 dark:text-white/30">
                    <X className="w-5 h-5 shrink-0" />
                    <span>AI 최종 산출물 평가</span>
                  </li>
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="p-5 rounded-2xl border-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Recommended
                </div>
                <h3 className="font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center justify-between">
                  PRO 플랜
                  <span className="text-sm font-normal text-gray-500 dark:text-white/50">첫 달 무료 (이후 ₩4,900/월)</span>
                </h3>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-gray-900 dark:text-white">
                    <Check className="w-5 h-5 shrink-0 text-indigo-500" />
                    <span className="font-medium">기본 플랜의 모든 기능</span>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-900 dark:text-white">
                    <Check className="w-5 h-5 shrink-0 text-indigo-500" />
                    <span className="font-medium">무제한 AI 자동 기획</span>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-900 dark:text-white">
                    <Check className="w-5 h-5 shrink-0 text-indigo-500" />
                    <span className="font-medium">AI 프로젝트 최종 리포트 평가</span>
                  </li>
                  <li className="flex gap-3 text-sm text-gray-900 dark:text-white">
                    <Check className="w-5 h-5 shrink-0 text-indigo-500" />
                    <span className="font-medium">우선순위 고객 지원</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 p-4 rounded-xl flex gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold mb-1">PRO 요금제 구독 안내</p>
                <p className="opacity-90 leading-relaxed text-xs">안전한 서비스 이용을 위해 결제 카드를 등록해주세요. (졸업작품 시연 모드에서는 실제 결제가 발생하지 않습니다.)</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-0 mt-auto flex justify-end">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  결제 처리 중...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  카드 등록하고 첫 달 무료로 PRO 시작하기
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
        )}
      </AnimatePresence>
      
      {showCardRegister && (
        <CardRegisterModal
          onClose={() => setShowCardRegister(false)}
          onSuccess={() => {
            onSuccess?.();
            onClose();
          }}
        />
      )}
    </>
  );
}
