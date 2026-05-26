import { useState } from "react";
import { X, CreditCard, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { cardApi } from "../api/cardApi";
import { useAuth } from "../context/AuthContext";

interface CardRegisterModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CARD_COMPANIES: Record<string, { name: string; gradient: string }> = {
  "4": { name: "VISA", gradient: "from-blue-600 to-blue-800" },
  "5": { name: "Mastercard", gradient: "from-red-500 to-orange-500" },
  "2": { name: "Mastercard", gradient: "from-red-500 to-orange-500" },
  "3": { name: "AMEX", gradient: "from-green-600 to-teal-700" },
  "9": { name: "국민카드", gradient: "from-yellow-500 to-amber-600" },
  "6": { name: "신한카드", gradient: "from-blue-500 to-cyan-600" },
  "7": { name: "현대카드", gradient: "from-slate-700 to-gray-900" },
  "8": { name: "우리카드", gradient: "from-emerald-500 to-green-700" },
};

function getCardInfo(num: string) {
  const first = num.replace(/\s/g, "")[0] || "";
  return CARD_COMPANIES[first] || { name: "카드", gradient: "from-[#11B886] to-[#0EA271]" };
}

function formatCardNumber(value: string) {
  const clean = value.replace(/\D/g, "").slice(0, 16);
  return clean.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) return clean.slice(0, 2) + "/" + clean.slice(2);
  return clean;
}

export default function CardRegisterModal({ onClose, onSuccess }: CardRegisterModalProps) {
  const { refreshUser } = useAuth();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [flipped, setFlipped] = useState(false);

  const cardInfo = getCardInfo(cardNumber);
  const maskedDisplay = cardNumber
    ? cardNumber.padEnd(19, " ").replace(/[0-9]/g, (c, i) => i < 9 ? "•" : c)
    : "•••• •••• •••• ••••";

  const handleSubmit = async () => {
    setError("");
    const clean = cardNumber.replace(/\s/g, "");
    if (clean.length < 16) return setError("카드 번호 16자리를 입력해주세요.");
    if (expiry.length < 5) return setError("유효기간을 MM/YY 형식으로 입력해주세요.");
    if (cvc.length < 3) return setError("CVC 3자리를 입력해주세요.");
    if (!cardHolder.trim()) return setError("카드 소유자명을 입력해주세요.");

    const [expiryMonth, expiryYear] = expiry.split("/");

    setLoading(true);
    try {
      await cardApi.registerCard({ cardNumber, expiryMonth, expiryYear: expiryYear, cardHolder });
      await refreshUser();
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch (e: any) {
      setError(e.response?.data?.message || "카드 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl">
      <div className="bg-white dark:bg-[#132038] rounded-[32px] shadow-2xl border border-gray-100 dark:border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#11B886]/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#11B886]" />
            </div>
            <div>
              <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white">카드 등록</h2>
              <p className="text-[11px] font-bold text-gray-400 dark:text-white/40">PRO 플랜 1달 무료 체험을 시작합니다</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {done ? (
          /* 완료 화면 */
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-20 h-20 rounded-full bg-[#11B886]/10 flex items-center justify-center mb-4 animate-in zoom-in duration-500">
              <CheckCircle2 className="w-10 h-10 text-[#11B886]" />
            </div>
            <h3 className="text-xl font-black text-[#1A2340] dark:text-white mb-2">등록 완료!</h3>
            <p className="text-sm text-gray-500 dark:text-white/50 text-center">PRO 1달 무료 체험이 시작되었습니다.<br/>AI 기능을 무제한으로 사용할 수 있습니다. 🎉</p>
          </div>
        ) : (
          <div className="px-8 pb-8 space-y-6">
            {/* 카드 프리뷰 */}
            <div
              className={`relative w-full h-48 rounded-2xl bg-gradient-to-br ${cardInfo.gradient} p-6 shadow-xl cursor-pointer select-none transition-all duration-500`}
              onClick={() => setFlipped(!flipped)}
              style={{ perspective: "1000px" }}
            >
              {!flipped ? (
                <div className="h-full flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-8 rounded-md bg-yellow-300/80 flex items-center justify-center">
                      <div className="w-6 h-4 border-2 border-yellow-600/40 rounded-sm" />
                    </div>
                    <span className="text-white/80 font-black text-sm tracking-widest">{cardInfo.name}</span>
                  </div>
                  <div>
                    <p className="text-white font-mono text-xl tracking-[0.25em] font-bold mb-3">
                      {maskedDisplay}
                    </p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-0.5">Card Holder</p>
                        <p className="text-white font-black text-sm tracking-wide">{cardHolder || "HONG GIL DONG"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50 text-[9px] font-black uppercase tracking-widest mb-0.5">Expires</p>
                        <p className="text-white font-black text-sm">{expiry || "MM/YY"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col justify-center">
                  <div className="w-full h-10 bg-black/40 -mx-6 px-6 flex items-center mb-6" style={{ width: "calc(100% + 48px)" }} />
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex-1 h-8 bg-white/20 rounded" />
                    <div className="bg-white rounded px-3 py-1.5 min-w-[60px] text-center">
                      <p className="text-gray-800 font-mono font-bold text-sm">{cvc || "•••"}</p>
                    </div>
                  </div>
                  <p className="text-white/40 text-[10px] text-right mt-2">뒷면을 클릭해 앞면으로</p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-white/30 text-center -mt-2">카드를 클릭하면 앞/뒷면을 확인할 수 있습니다</p>

            {/* 입력 폼 */}
            <div className="space-y-4">
              {/* 카드 번호 */}
              <div>
                <label className="text-[11px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest block mb-2">카드 번호</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-2xl text-[15px] font-mono font-bold text-[#1A2340] dark:text-white outline-none focus:border-[#11B886] transition-all placeholder-gray-300 dark:placeholder-white/20 tracking-widest"
                />
              </div>

              {/* 유효기간 + CVC */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest block mb-2">유효기간</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiry}
                    onChange={e => setExpiry(formatExpiry(e.target.value))}
                    placeholder="MM / YY"
                    maxLength={5}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-2xl text-[15px] font-mono font-bold text-[#1A2340] dark:text-white outline-none focus:border-[#11B886] transition-all placeholder-gray-300 dark:placeholder-white/20 tracking-widest"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest block mb-2">CVC</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cvc}
                    onChange={e => { setCvc(e.target.value.replace(/\D/g, "").slice(0, 3)); setFlipped(e.target.value.length > 0); }}
                    placeholder="• • •"
                    maxLength={3}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-2xl text-[15px] font-mono font-bold text-[#1A2340] dark:text-white outline-none focus:border-[#11B886] transition-all placeholder-gray-300 dark:placeholder-white/20 tracking-widest"
                  />
                </div>
              </div>

              {/* 카드 소유자명 */}
              <div>
                <label className="text-[11px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest block mb-2">카드 소유자명</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={e => setCardHolder(e.target.value.toUpperCase())}
                  placeholder="HONG GIL DONG"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-2xl text-[15px] font-bold text-[#1A2340] dark:text-white outline-none focus:border-[#11B886] transition-all placeholder-gray-300 dark:placeholder-white/20 tracking-widest uppercase"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 font-bold text-center bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-xl border border-red-100 dark:border-red-500/20">
                {error}
              </p>
            )}

            {/* 안내 문구 */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-white/30 font-bold bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              카드 정보는 안전하게 암호화되어 처리됩니다. 실제 결제는 발생하지 않습니다.
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 text-[14px] font-black text-gray-500 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-[#11B886] text-white text-[14px] font-black hover:bg-[#0EA271] active:scale-95 transition-all shadow-[0_4px_20px_rgba(17,184,134,0.35)] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> 처리 중...</> : "카드 등록하기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
