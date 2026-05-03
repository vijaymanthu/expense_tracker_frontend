import axios from "axios";
import api from "@/lib/api";
import { API_URLS } from "@/lib/api-endpoints";
import {
  AppRole,
  AuthSession,
  AuthUser,
  clearAuthSession,
  setAuthSession,
} from "@/lib/auth-storage";

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  first_name: string;
  last_name :string;
  email: string;
  password: string;
};

type ApiUser = Record<string, unknown>;

const mapRole = (input: ApiUser): AppRole => {
  const roleValue = input.role;
  const isSuperUser = Boolean(input.is_superuser);
  const isStaff = Boolean(input.is_staff);

  if (
    roleValue === "superadmin" ||
    roleValue === "super_admin" ||
    roleValue === "admin" ||
    isSuperUser ||
    isStaff
  ) {
    return "superadmin";
  }
  return "user";
};

const normalizeUser = (input: ApiUser): AuthUser => {
  return {
    id: (input.id as string | number | undefined) ?? "",
    first_name : (input.first_name as string | undefined)?? "",
    last_name : (input.last_name as string | undefined)?? "",
    email: (input.email as string | undefined) ?? "",
    role: mapRole(input),
    isActive: Boolean(input.is_active ?? true),
  };
};

const extractSessionFromResponse = (data: Record<string, unknown>): AuthSession | null => {
  const accessToken =
    (data.access as string | undefined) ??
    (data.token as string | undefined) ??
    (data.access_token as string | undefined);
  const refreshToken =
    (data.refresh as string | undefined) ??
    (data.refresh_token as string | undefined);

  if (!accessToken) {
    return null;
  }

  const user = (data.user as ApiUser | undefined) ?? {};
  return {
    accessToken,
    refreshToken,
    user: normalizeUser(user),
  };
};

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage;
  }

  const payload = error.response?.data as { detail?: unknown; message?: unknown } | undefined;
  if (typeof payload?.detail === "string" && payload.detail.length > 0) {
    return payload.detail;
  }
  if (typeof payload?.message === "string" && payload.message.length > 0) {
    return payload.message;
  }
  return fallbackMessage;
};

export const login = async (payload: LoginPayload): Promise<AuthSession> => {
  const response = await api.post<Record<string, unknown>>(API_URLS.AUTH_LOGIN, payload);
  const initialSession = extractSessionFromResponse(response.data);

  if (!initialSession) {
    throw new Error("Login response is missing token information.");
  }

  if (!initialSession.user.email) {
    setAuthSession({ ...initialSession, user: { ...initialSession.user, email: payload.email } });
    const me = await getCurrentUser();
    const completeSession = { ...initialSession, user: me };
    setAuthSession(completeSession);
    return completeSession;
  }

  setAuthSession(initialSession);
  return initialSession;
};

export const register = async (payload: RegisterPayload) => {
  const response = await api.post(API_URLS.AUTH_REGISTER, payload);
  return response.data;
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await api.get<ApiUser>(API_URLS.PROFILE);
  return normalizeUser(response.data);
};

export const changePassword = async (payload: {
  current_password: string;
  new_password: string;
}) => {
  const response = await api.post(API_URLS.CHANGE_PASSWORD, payload);
  return response.data;
};

export const logout = () => {
  clearAuthSession();
};
