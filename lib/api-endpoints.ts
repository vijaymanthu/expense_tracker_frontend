export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export const API_URLS = {
  AUTH_LOGIN: "/api/users/login/",
  AUTH_REGISTER: "/api/users/register/",
  AUTH_REFRESH: "/api/users/token/refresh/",
  PROFILE: "/api/users/profile/",
  CHANGE_PASSWORD: "/api/users/change-password/",
  USERS: "api/users/admin/users/",
  USERS_ACTIVATE: "api/users/admin/users/{id}/activate/",
  USERS_BLOCK: "api/users/admin/users/{id}/block/",
  EXPENSES: "/api/expenses/",
  EXPENSE_CATEGORIES: "/api/expenses/get-expense-categories",
  REGULAR_EXPENSE_TYPES: "/api/expenses/get-regular-expenses-types",
  SUBSCRIPTION_EXPENSE_TYPES: "/api/expenses/get-subscription-expenses-types",
  EMIS: "/api/emis/",
  DASHBOARD : "/api/dashboard/get_total_spents",
  DASHBOARD_INVESTMENTS : "/api/dashboard/get_investments",
  DASHBOARD_EMIS : "/api/dashboard/get_emis",
  EMI_TYPES : "/api/emis/get/emi-types",
  EMI_INSTALLMENTS : "/api/emis/installments/{emi_record_id}" , // patch request
  EMI_INSTALLMENT_PAID : "/api/emis/installments/mark_as_paid/{installment_record_id}"
} as const;
