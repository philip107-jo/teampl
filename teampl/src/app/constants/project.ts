import { Rocket, Target, Zap, Component, Lightbulb, Trophy, Star, Crown } from "lucide-react";

export const PROJECT_THEMES = [
  { id: "emerald", bg: "bg-emerald-500", text: "text-emerald-500", lightBg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200 dark:border-emerald-500/20" },
  { id: "blue", bg: "bg-blue-500", text: "text-blue-500", lightBg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200 dark:border-blue-500/20" },
  { id: "violet", bg: "bg-violet-500", text: "text-violet-500", lightBg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200 dark:border-violet-500/20" },
  { id: "amber", bg: "bg-amber-500", text: "text-amber-500", lightBg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200 dark:border-amber-500/20" },
  { id: "rose", bg: "bg-rose-500", text: "text-rose-500", lightBg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200 dark:border-rose-500/20" },
  { id: "cyan", bg: "bg-cyan-500", text: "text-cyan-500", lightBg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200 dark:border-cyan-500/20" },
];

export const PROJECT_ICONS: Record<string, any> = {
  Rocket, Target, Zap, Component, Lightbulb, Trophy, Star, Crown
};

// Returns a deterministic theme based on project ID
export const getProjectTheme = (id: number | string) => {
  const index = parseInt(String(id), 10) % PROJECT_THEMES.length;
  return PROJECT_THEMES[index || 0];
};

// Returns a deterministic icon based on project subject
export const getProjectIcon = (subject: string | undefined) => {
  if (!subject) return Rocket;
  const hash = subject.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const keys = Object.keys(PROJECT_ICONS);
  return PROJECT_ICONS[keys[hash % keys.length]];
};
