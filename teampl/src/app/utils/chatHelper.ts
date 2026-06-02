export const formatMessagePreview = (content: string): string => {
  if (!content) return "";
  if (content.startsWith("[GROUP_CALL_START]:")) {
    const type = content.replace("[GROUP_CALL_START]:", "");
    return type === "video" ? "📹 그룹 영상 통화 시작" : "📞 그룹 음성 통화 시작";
  }
  if (content.startsWith("[GROUP_CALL_END]:")) {
    const parts = content.replace("[GROUP_CALL_END]:", "").split(":");
    const type = parts[0];
    const seconds = parseInt(parts[1] || "0", 10);
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return type === "video" ? `📹 그룹 영상 통화 종료 (${m}:${s})` : `📞 그룹 음성 통화 종료 (${m}:${s})`;
  }
  if (content.startsWith("[CALL_START]:")) {
    const type = content.replace("[CALL_START]:", "");
    return type === "video" ? "📹 영상 통화 시작" : "📞 음성 통화 시작";
  }
  if (content.startsWith("[CALL_END]:")) {
    const parts = content.replace("[CALL_END]:", "").split(":");
    const type = parts[0];
    const seconds = parseInt(parts[1] || "0", 10);
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return type === "video" ? `📹 영상 통화 종료 (${m}:${s})` : `📞 음성 통화 종료 (${m}:${s})`;
  }
  if (content.startsWith("[CALL_MISSED]:")) {
    const type = content.replace("[CALL_MISSED]:", "");
    return type === "video" ? "📹 부재중 (영상 통화)" : "📞 부재중 (음성 통화)";
  }
  if (content.startsWith("[IMAGE]")) {
    return "🖼️ 사진";
  }
  if (content.startsWith("[FILE]")) {
    return "📎 파일";
  }
  if (content.startsWith("[VOTE_REF]:")) {
    return "📊 투표";
  }
  return content;
};
