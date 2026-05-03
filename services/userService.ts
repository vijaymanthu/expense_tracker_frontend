import api from "@/lib/api";
import { API_URLS } from "@/lib/api-endpoints";
import { AppRole, AuthUser } from "@/lib/auth-storage";

type ApiUser = Record<string, unknown>;

export type UserFormPayload = {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role: AppRole;
};

const normalizeRole = (input: ApiUser): AppRole => {
  const role = input.role;
  if (
    role === "superadmin" ||
    role === "super_admin" ||
    role === "admin" ||
    Boolean(input.is_superuser) ||
    Boolean(input.is_staff)
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
    role: normalizeRole(input),
    isActive: Boolean(input.is_active ?? true),
  };
};

export const getUsers = async (): Promise<AuthUser[]> => {
  const response = await api.get<ApiUser[] | { results: ApiUser[] }>(API_URLS.USERS);
  const data = Array.isArray(response.data) ? response.data : response.data.results ?? [];
  return data.map(normalizeUser);
};

export const createUser = async (payload: UserFormPayload): Promise<AuthUser> => {
  const response = await api.post<ApiUser>(API_URLS.USERS, {
    first_name: payload.first_name,
    last_name: payload.last_name,    
    email: payload.email,
    password: payload.password,
    role: payload.role,
    is_staff: payload.role === "superadmin",
    is_superuser: payload.role === "superadmin",
  });
  return normalizeUser(response.data);
};

export const updateUser = async (
  userId: string | number,
  payload: UserFormPayload,
): Promise<AuthUser> => {
  const response = await api.put<ApiUser>(`${API_URLS.USERS}${userId}/`, {
    first_name: payload.first_name,
    last_name: payload.last_name, 
    role: payload.role,
    is_staff: payload.role === "superadmin",
    is_superuser: payload.role === "superadmin",
  });
  return normalizeUser(response.data);
};

export const deleteUser = async (userId: string | number): Promise<void> => {
  await api.delete(`${API_URLS.USERS}${userId}/`);
};

export const updateProfile = async (payload: {
  first_name: string;
  last_name : string;
  email: string;
}): Promise<AuthUser> => {
  const response = await api.patch<ApiUser>(API_URLS.PROFILE, payload);
  return normalizeUser(response.data);
};

const replacePathId = (template: string, userId: string | number) =>
  template.replace("{id}", String(userId));

export const blockUser = async (userId: string | number): Promise<void> => {
  try {
    await api.post(replacePathId(API_URLS.USERS_BLOCK, userId));
    return;
  } catch {
    await api.patch(`${API_URLS.USERS}${userId}/`, { is_active: false });
  }
};

export const activateUser = async (userId: string | number): Promise<void> => {
  try {
    await api.post(replacePathId(API_URLS.USERS_ACTIVATE, userId));
    return;
  } catch {
    await api.patch(`${API_URLS.USERS}${userId}/`, { is_active: true });
  }
};
