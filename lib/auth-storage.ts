export type AppRole = "user" | "superadmin";

export type AuthUser = {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  role: AppRole;
  isActive?: boolean;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};

const ACCESS_TOKEN_KEY = "et_access_token";
const REFRESH_TOKEN_KEY = "et_refresh_token";
const USER_KEY = "et_user";
const ROLE_KEY = "et_role";

const isBrowser = () => typeof window !== "undefined";

const setCookie = (key: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 7) => {
  if (!isBrowser()) {
    return;
  }

  const securePart = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${key}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Strict${securePart}`;
};

const clearCookie = (key: string) => {
  if (!isBrowser()) {
    return;
  }
  document.cookie = `${key}=; Path=/; Max-Age=0; SameSite=Strict`;
};

export const getStoredUser = (): AuthUser | null => {
  if (!isBrowser()) {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
};

export const getAccessToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const setAuthSession = (session: AuthSession) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  window.localStorage.setItem(ROLE_KEY, session.user.role);
  setCookie(ACCESS_TOKEN_KEY, session.accessToken);
  setCookie(ROLE_KEY, session.user.role);

  if (session.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    setCookie(REFRESH_TOKEN_KEY, session.refreshToken);
  }
};

export const updateAccessToken = (accessToken: string) => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  setCookie(ACCESS_TOKEN_KEY, accessToken);
};

export const updateRefreshToken = (refreshToken: string) => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  setCookie(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuthSession = () => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  clearCookie(ACCESS_TOKEN_KEY);
  clearCookie(REFRESH_TOKEN_KEY);
  clearCookie(ROLE_KEY);
};
