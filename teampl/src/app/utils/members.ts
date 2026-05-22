export const getMemberName = (email: string, members?: any[]) => {
  if (!members || !Array.isArray(members)) return email.split("@")[0];
  const m = members.find((m) => m.email === email);
  return m?.name || email.split("@")[0];
};

export const getMemberAvatar = (email: string, members?: any[]) => {
  if (!members || !Array.isArray(members)) return null;
  const m = members.find((m) => m.email === email);
  return m?.avatarUrl || null;
};
