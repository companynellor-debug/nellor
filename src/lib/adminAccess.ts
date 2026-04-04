const ADMIN_ACCESS_KEY = "nellor_admin_access";
const ADMIN_TOKEN_KEY = "nellor_admin_token";

type AdminTokenPayload = {
  exp?: number;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(`${normalized}${padding}`);
};

const getTokenPayload = (token: string): AdminTokenPayload | null => {
  try {
    const [payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as AdminTokenPayload;
  } catch {
    return null;
  }
};

export const clearAdminAccess = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_ACCESS_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
};

export const storeAdminAccess = (adminToken: string) => {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADMIN_ACCESS_KEY, "true");
  sessionStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
};

export const getAdminToken = () => {
  if (typeof window === "undefined") return null;

  const hasAccess = sessionStorage.getItem(ADMIN_ACCESS_KEY) === "true";
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);

  if (!hasAccess || !token) {
    return null;
  }

  const payload = getTokenPayload(token);
  if (!payload?.exp || payload.exp <= Date.now()) {
    clearAdminAccess();
    return null;
  }

  return token;
};

export const hasStoredAdminAccess = () => Boolean(getAdminToken());
