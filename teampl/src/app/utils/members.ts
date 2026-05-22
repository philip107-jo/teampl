import { User } from "../types";

export const getMemberName = (email: string, members: any[]) => {
  const m = members.find((m) => m.email === email);
  return m?.name || email.split("@")[0];
};

export const getMemberAvatar = (email: string, members: any[]) => {
  const m = members.find((m) => m.email === email);
  return m?.avatarUrl || null;
};
