import api from "@/lib/api";
import { API_URLS } from "@/lib/api-endpoints";
import { ExpenseCategory, RecurringType } from "@/lib/validations";

export type ExpenseItem = {
  record_id: string;
  id: number | string;
  expense_title: string;
  expense_category: string;
  total_amount: number;
  expense_made_on?: string;
  notes?: string;
  expenses?: [];
};

export type PaginatedExpenses = {
  items: ExpenseItem[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
};

export type ExpenseCategoryOption = {
  key: ExpenseCategory;
  label: string;
};

export type ExpenseTypeOption = {
  key: string;
  label: string;
};

export type EmiItem = {
  id?: number | string;
  record_id: string;
  emi_type: string;
  emi_recursion: string;
  name: string;
  amount: number;
  installment_amount:number;
  started_date: string;
  end_date?: string;
  number_of_emis?: number;
  description?: string;
};

export type PaginatedEmis = {
  items: EmiItem[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
};

export type CreateEmiPayload = {
  emi_recursion: string;
  emi_type: string;
  name: string;
  started_date: string;
  number_of_emis?: number;
  end_date?: string;
  amount: number;
  installment_amount: number;
  description?: string;
};

export type EmiInstallmentItem = {
  record_id: string;
  start_date: string;
  due_date: string;
  is_paid: boolean;
  paid_on?: string | null;
  status: boolean;
  emi: number | string;
};

export type PaginatedEmiInstallments = {
  items: EmiInstallmentItem[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
};

export type DashboardSpendItem = {
  expense_category: ExpenseCategory;
  total: number;
};

export type DashboardDateFilter = {
  date?: string;
  month?: string;
  year?: string;
};

export type DashboardInvestmentItem = {
  record_id: string;
  name: string;
  emi_type: string;
  invested_amount: number;
  amount_paid: number;
  remaining_amount: number;
  total_amount: number;
  installment_amount: number;
  paid_installments: number;
  active_installments: number;
  number_of_emis?: number;
  started_date: string;
  end_date?: string;
  current_due_date?: string | null;
  status: string;
};

export type DashboardEmiItem = {
  record_id: string;
  name: string;
  emi_type: string;
  emi_recursion: string;
  paid_amount: number;
  remaining_amount: number;
  total_amount: number;
  installment_amount: number;
  paid_installments: number;
  remaining_installments: number;
  active_emis: number;
  active_emi_amount: number;
  total_installments: number;
  number_of_emis?: number;
  started_date: string;
  end_date?: string;
  current_due_date?: string | null;
  status: string;
};

export type CreateRegularExpensePayload = {
  expense_title: string;
  expense_category: "regular";
  expense_made_on: string;
  total_amount: number;
  notes: string;
  is_recurring_expense: boolean;
  recurring_type?: RecurringType;
  recurrence_date?: string;
  regular_expenses: Array<{
    regular_expense_type: string;
    amount: number;
    regular_expense_type_other_name?: string;
  }>;
};

export type CreateSubscriptionExpensePayload = {
  expense_title: string;
  expense_category: "subscription";
  expense_made_on: string;
  total_amount: number;
  notes: string;
  subscription_expenses: Array<{
    subscription_type: string;
    subscription_type_other_name?: string;
    name: string;
    started_on: string;
    ends_on: string;
    description?: string;
    amount: number;
  }>;
};

export type CreateTravelExpensePayload = {
  expense_title: string;
  expense_category: "travel";
  expense_made_on: string;
  total_amount: number;
  notes: string;
  is_recurring_expense: boolean;
};

export type CreateExpensePayload =
  | CreateRegularExpensePayload
  | CreateSubscriptionExpensePayload
  | CreateTravelExpensePayload;

const normalizeExpense = (input: Record<string, unknown>): ExpenseItem => ({
  record_id: (input.record_id as string | undefined) ?? "",
  id: (input.id as number | string | undefined) ?? "",
  expense_title:
    (input.expense_title as string | undefined) ??
    (input.title as string | undefined) ??
    "Expense",
  expense_category:
    (input.expense_category as string | undefined) ??
    (input.category as string | undefined) ??
    "-",
  total_amount: Number(
    (input.total_amount as number | string | undefined) ??
      (input.amount as number | string | undefined) ??
      0,
  ),
  expense_made_on:
    (input.expense_made_on as string | undefined) ??
    (input.date as string | undefined) ??
    "",
  notes: (input.notes as string | undefined) ?? "",
  expenses: (input.expenses as [] | undefined) ?? [],
});

const normalizeEmi = (input: Record<string, unknown>): EmiItem => ({
  id: (input.id as number | string | undefined) ?? undefined,
  record_id: (input.record_id as string | undefined) ?? "",
  emi_type: (input.emi_type as string | undefined) ?? "",
  amount: Number((input.amount as number | string | undefined) ?? 0),
  installment_amount: Number((input.installment_amount as number | string | undefined) ?? 0),
  started_date: (input.started_date as string | undefined) ?? "",
  number_of_emis:
    (input.number_of_emis as number | undefined) ??
    Number((input.number_of_emis as string | undefined) ?? 0) ??
    undefined,
  end_date: (input.end_date as string | undefined) ?? "",
  description: (input.description as string | undefined) ?? "",
  name: (input.name as string | undefined) ?? "",
  emi_recursion: (input.emi_recursion as string | undefined) ?? "",
});

const normalizeDashboardSpend = (
  input: Record<string, unknown>,
): DashboardSpendItem | null => {
  const expenseCategory = (input.expense_category as string | undefined) ?? "";
  if (
    expenseCategory !== "regular" &&
    expenseCategory !== "subscription" &&
    expenseCategory !== "travel"
  ) {
    return null;
  }

  return {
    expense_category: expenseCategory,
    total: Number((input.total as number | string | undefined) ?? 0),
  };
};

const normalizeEmiInstallment = (input: Record<string, unknown>): EmiInstallmentItem => ({
  record_id: (input.record_id as string | undefined) ?? "",
  start_date: (input.start_date as string | undefined) ?? "",
  due_date: (input.due_date as string | undefined) ?? "",
  is_paid: Boolean(input.is_paid),
  paid_on: (input.paid_on as string | null | undefined) ?? null,
  status: Boolean(input.status),
  emi:
    (input.emi as number | string | undefined) ??
    (input.emi_id as number | string | undefined) ??
    "",
});

const normalizeDashboardInvestment = (
  input: Record<string, unknown>,
): DashboardInvestmentItem => ({
  record_id: (input.record_id as string | undefined) ?? "",
  name: (input.name as string | undefined) ?? "Investment",
  emi_type: (input.emi_type as string | undefined) ?? "investment",
  invested_amount: Number((input.invested_amount as number | string | undefined) ?? 0),
  amount_paid: Number((input.amount_paid as number | string | undefined) ?? 0),
  remaining_amount: Number((input.remaining_amount as number | string | undefined) ?? 0),
  total_amount: Number((input.total_amount as number | string | undefined) ?? 0),
  installment_amount: Number((input.installment_amount as number | string | undefined) ?? 0),
  paid_installments: Number((input.paid_installments as number | string | undefined) ?? 0),
  active_installments: Number((input.active_installments as number | string | undefined) ?? 0),
  number_of_emis:
    (input.number_of_emis as number | undefined) ??
    Number((input.number_of_emis as string | undefined) ?? 0) ??
    undefined,
  started_date: (input.started_date as string | undefined) ?? "",
  end_date: (input.end_date as string | undefined) ?? "",
  current_due_date: (input.current_due_date as string | null | undefined) ?? null,
  status: (input.status as string | undefined) ?? "",
});

const normalizeDashboardEmi = (input: Record<string, unknown>): DashboardEmiItem => ({
  record_id: (input.record_id as string | undefined) ?? "",
  name: (input.name as string | undefined) ?? "EMI",
  emi_type: (input.emi_type as string | undefined) ?? "",
  emi_recursion: (input.emi_recursion as string | undefined) ?? "",
  paid_amount: Number((input.paid_amount as number | string | undefined) ?? 0),
  remaining_amount: Number((input.remaining_amount as number | string | undefined) ?? 0),
  total_amount: Number((input.total_amount as number | string | undefined) ?? 0),
  installment_amount: Number((input.installment_amount as number | string | undefined) ?? 0),
  paid_installments: Number((input.paid_installments as number | string | undefined) ?? 0),
  remaining_installments: Number((input.remaining_installments as number | string | undefined) ?? 0),
  active_emis: Number((input.active_emis as number | string | undefined) ?? 0),
  active_emi_amount: Number((input.active_emi_amount as number | string | undefined) ?? 0),
  total_installments: Number((input.total_installments as number | string | undefined) ?? 0),
  number_of_emis:
    (input.number_of_emis as number | undefined) ??
    Number((input.number_of_emis as string | undefined) ?? 0) ??
    undefined,
  started_date: (input.started_date as string | undefined) ?? "",
  end_date: (input.end_date as string | undefined) ?? "",
  current_due_date: (input.current_due_date as string | null | undefined) ?? null,
  status: (input.status as string | undefined) ?? "",
});

const extractList = <T>(input: T[] | { results?: T[] }) =>
  Array.isArray(input) ? input : input.results ?? [];

const mapKeyValueOptions = (
  payload: Record<string, string> | Array<{ key: string; value: string }>,
): ExpenseTypeOption[] => {
  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      key: item.key,
      label: item.value,
    }));
  }

  return Object.entries(payload).map(([key, value]) => ({
    key,
    label: value,
  }));
};

export const getExpenseCategories = async (): Promise<ExpenseCategoryOption[]> => {
  const response = await api.get<Record<string, string> | Array<{ key: string; value: string }>>(
    API_URLS.EXPENSE_CATEGORIES,
  );
  const payload = response.data;
  if (Array.isArray(payload)) {
    return payload.map((item) => ({
      key: item.key as ExpenseCategory,
      label: item.value,
    }));
  }

  return Object.entries(payload).map(([key, value]) => ({
    key: key as ExpenseCategory,
    label: value,
  }));
};

export const getRegularExpenseTypes = async (): Promise<ExpenseTypeOption[]> => {
  const response = await api.get<Record<string, string> | Array<{ key: string; value: string }>>(
    API_URLS.REGULAR_EXPENSE_TYPES,
  );
  return mapKeyValueOptions(response.data);
};

export const getSubscriptionExpenseTypes = async (): Promise<ExpenseTypeOption[]> => {
  const response = await api.get<Record<string, string> | Array<{ key: string; value: string }>>(
    API_URLS.SUBSCRIPTION_EXPENSE_TYPES,
  );
  return mapKeyValueOptions(response.data);
};

export const getEmiTypes = async (): Promise<ExpenseTypeOption[]> => {
  const response = await api.get<Record<string, string> | Array<{ key: string; value: string }>>(
    API_URLS.EMI_TYPES,
  );
  return mapKeyValueOptions(response.data);
};

export const getExpenses = async (): Promise<ExpenseItem[]> => {
  const response = await api.get<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(
    API_URLS.EXPENSES,
  );
  return extractList(response.data).map(normalizeExpense);
};

export const getExpensesPaginated = async (
  page = 1,
  pageSize = 10,
  expenseCategory?: ExpenseCategory,
): Promise<PaginatedExpenses> => {
  const response = await api.get<
    | Record<string, unknown>[]
    | {
        count?: number;
        results?: Record<string, unknown>[];
      }
  >(API_URLS.EXPENSES, {
    params: {
      page,
      page_size: pageSize,
      ...(expenseCategory ? { expense_category: expenseCategory } : {}),
    },
  });

  if (Array.isArray(response.data)) {
    const items = response.data.map(normalizeExpense);
    return {
      items,
      totalItems: items.length,
      currentPage: page,
      pageSize,
    };
  }

  const rows = response.data.results ?? [];
  return {
    items: rows.map(normalizeExpense),
    totalItems:
      typeof response.data.count === "number" ? response.data.count : rows.length,
    currentPage: page,
    pageSize,
  };
};

export const createExpense = async (payload: CreateExpensePayload): Promise<ExpenseItem> => {
  const response = await api.post<Record<string, unknown>>(API_URLS.EXPENSES, payload);
  return normalizeExpense(response.data);
};

export const deleteExpense = async (expenseId: number | string): Promise<void> => {
  await api.delete(`${API_URLS.EXPENSES}delete/${expenseId}/`);
};

export const getEmis = async (): Promise<EmiItem[]> => {
  const response = await api.get<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(
    API_URLS.EMIS,
  );
  return extractList(response.data).map(normalizeEmi);
};

export const getEmisPaginated = async (
  page = 1,
  pageSize = 10,
  filters?: { emi_type?: string; emi_recursion?: string },
): Promise<PaginatedEmis> => {
  const response = await api.get<
    | Record<string, unknown>[]
    | {
        count?: number;
        results?: Record<string, unknown>[];
      }
  >(API_URLS.EMIS, {
    params: {
      page,
      page_size: pageSize,
      ...(filters?.emi_type ? { emi_type: filters.emi_type } : {}),
      ...(filters?.emi_recursion ? { emi_recursion: filters.emi_recursion } : {}),
    },
  });

  if (Array.isArray(response.data)) {
    const items = response.data.map(normalizeEmi);
    return {
      items,
      totalItems: items.length,
      currentPage: page,
      pageSize,
    };
  }

  const rows = response.data.results ?? [];
  return {
    items: rows.map(normalizeEmi),
    totalItems:
      typeof response.data.count === "number" ? response.data.count : rows.length,
    currentPage: page,
    pageSize,
  };
};

export const createEmi = async (payload: CreateEmiPayload): Promise<EmiItem> => {
  const response = await api.post<Record<string, unknown>>(API_URLS.EMIS, payload);
  return normalizeEmi(response.data);
};

export const updateEmi = async (
  emiId: number | string,
  payload: CreateEmiPayload,
): Promise<EmiItem> => {
  const response = await api.put<Record<string, unknown>>(`${API_URLS.EMIS}${emiId}/`, payload);
  return normalizeEmi(response.data);
};

export const deleteEmi = async (emiId: number | string): Promise<void> => {
  await api.delete(`${API_URLS.EMIS}${emiId}/`);
};

export const getEmiInstallmentsPaginated = async (
  emiRecordId: number | string,
  page = 1,
  pageSize = 10,
): Promise<PaginatedEmiInstallments> => {
  const url = API_URLS.EMI_INSTALLMENTS.replace("{emi_record_id}", String(emiRecordId));
  const response = await api.get<
    | Record<string, unknown>[]
    | {
        count?: number;
        results?: Record<string, unknown>[];
      }
  >(url, {
    params: {
      page,
      page_size: pageSize,
    },
  });

  if (Array.isArray(response.data)) {
    const items = response.data.map(normalizeEmiInstallment);
    return {
      items,
      totalItems: items.length,
      currentPage: page,
      pageSize,
    };
  }

  const rows = response.data.results ?? [];
  return {
    items: rows.map(normalizeEmiInstallment),
    totalItems: typeof response.data.count === "number" ? response.data.count : rows.length,
    currentPage: page,
    pageSize,
  };
};

export const markEmiInstallmentPaid = async (
  installmentRecordId: string,
): Promise<EmiInstallmentItem> => {
  const url = API_URLS.EMI_INSTALLMENT_PAID.replace(
    "{installment_record_id}",
    installmentRecordId,
  );
  const response = await api.patch<Record<string, unknown>>(url);
  return normalizeEmiInstallment(response.data);
};

export const getDashboardTotalSpends = async (
  filters?: DashboardDateFilter,
): Promise<DashboardSpendItem[]> => {
  const response = await api.get<
    Record<string, unknown>[] | { results?: Record<string, unknown>[] }
  >(API_URLS.DASHBOARD, {
    params: {
      ...(filters?.date ? { date: filters.date } : {}),
      ...(filters?.month ? { month: filters.month } : {}),
      ...(filters?.year ? { year: filters.year } : {}),
    },
  });

  return extractList(response.data)
    .map(normalizeDashboardSpend)
    .filter((item): item is DashboardSpendItem => item !== null);
};

export const getDashboardInvestments = async (): Promise<DashboardInvestmentItem[]> => {
  const response = await api.get<
    Record<string, unknown>[] | { results?: Record<string, unknown>[] }
  >(API_URLS.DASHBOARD_INVESTMENTS);

  return extractList(response.data).map(normalizeDashboardInvestment);
};

export const getDashboardEmis = async (): Promise<DashboardEmiItem[]> => {
  const response = await api.get<
    Record<string, unknown>[] | { results?: Record<string, unknown>[] }
  >(API_URLS.DASHBOARD_EMIS);

  return extractList(response.data).map(normalizeDashboardEmi);
};
