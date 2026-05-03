export type LoginValues = {
  email: string;
  password: string;
};

export type RegisterValues = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ProfileValues = {
  first_name: string;
  last_name: string;
  email: string;
};

export type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type ExpenseCategory = "regular" | "subscription" | "travel";
export type RecurringType = "daily" | "weekly" | "monthly" | "yearly";

export type RegularExpenseItemValues = {
  regular_expense_type: string;
  amount: string;
  regular_expense_type_other_name: string;
};

export type SubscriptionExpenseItemValues = {
  subscription_type: string;
  name: string;
  started_on: string;
  ends_on: string;
  description: string;
  amount: string;
  subscription_type_other_name: string;
};

export type ExpenseFormValues = {
  expense_title: string;
  expense_category: ExpenseCategory | "";
  expense_made_on: string;
  total_amount: string;
  notes: string;
  is_recurring_expense: boolean;
  recurring_type: RecurringType;
  recurrence_date: string;
  regular_expenses: RegularExpenseItemValues[];
  subscription_expenses: SubscriptionExpenseItemValues[];
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateLoginValues = (values: LoginValues): string | null => {
  if (!isValidEmail(values.email.trim())) {
    return "Please enter a valid email address.";
  }
  if (values.password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
};

export const validateRegisterValues = (values: RegisterValues): string | null => {
  if (values.first_name.trim().length < 2) {
    return "First name must be at least 2 characters.";
  }
  if (values.last_name.trim().length < 2) {
    return "First name must be at least 2 characters.";
  }
  if (!isValidEmail(values.email.trim())) {
    return "Please enter a valid email address.";
  }
  if (values.password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  if (values.password !== values.confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
};

export const validateProfileValues = (values: ProfileValues): string | null => {
  if (values.first_name.trim().length < 2) {
    return "Name must be at least 2 characters.";
  } if (values.last_name.trim().length < 2) {
    return "Name must be at least 2 characters.";
  }
  if (!isValidEmail(values.email.trim())) {
    return "Please enter a valid email address.";
  }
  return null;
};

export const validateChangePasswordValues = (
  values: ChangePasswordValues,
): string | null => {
  if (values.currentPassword.length < 6) {
    return "Current password must be at least 6 characters.";
  }
  if (values.newPassword.length < 6) {
    return "New password must be at least 6 characters.";
  }
  if (values.newPassword !== values.confirmPassword) {
    return "New passwords do not match.";
  }
  return null;
};

const isPositiveAmount = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
};

const sumPositiveAmounts = (items: Array<{ amount: string }>) =>
  items.reduce((sum, item) => {
    const amount = Number(item.amount);
    return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
  }, 0);

const amountsMatch = (totalAmount: string, expectedAmount: number) => {
  const total = Number(totalAmount);
  if (!Number.isFinite(total)) {
    return false;
  }
  return Math.abs(total - expectedAmount) < 0.005;
};

export const validateExpenseFormValues = (values: ExpenseFormValues): string | null => {
  if (!values.expense_category) {
    return "Please select an expense category.";
  }

  if (values.expense_title.trim().length < 2) {
    return "Expense title must be at least 2 characters.";
  }
  if (!values.expense_made_on) {
    return "Please select expense made date.";
  }
  if (!isPositiveAmount(values.total_amount)) {
    return "Total amount must be a positive number.";
  }
  if (values.notes.trim().length === 0) {
    return "Notes are required.";
  }

  if (values.expense_category === "regular") {
    if (values.is_recurring_expense) {
      if (!values.recurring_type) {
        return "Please select recurring type.";
      }
      if (!values.recurrence_date) {
        return "Please select recurrence date.";
      }
    }
    if (values.regular_expenses.length === 0) {
      return "Add at least one regular expense item.";
    }
    const invalidRegular = values.regular_expenses.find(
      (item) =>
        item.regular_expense_type.trim().length === 0 || !isPositiveAmount(item.amount),
    );
    if (invalidRegular) {
      return "Each regular expense must include type and valid amount.";
    }
    if (!amountsMatch(values.total_amount, sumPositiveAmounts(values.regular_expenses))) {
      return "Total amount must match sum of regular_expenses amounts.";
    }
  }

  if (values.expense_category === "subscription") {
    
    if (values.subscription_expenses.length === 0) {
      return "Add at least one subscription item.";
    }
    const invalidSubscription = values.subscription_expenses.find(
      (item) =>
        item.subscription_type.trim().length === 0 ||
        (item.subscription_type === "others" &&
          item.subscription_type_other_name.trim().length === 0) ||
        item.name.trim().length === 0 ||
        item.started_on.length === 0 ||
        item.ends_on.length === 0 ||
        !isPositiveAmount(item.amount),
    );
    if (invalidSubscription) {
      return "Each subscription item must include required fields and valid amount.";
    }
    if (
      !amountsMatch(
        values.total_amount,
        sumPositiveAmounts(values.subscription_expenses),
      )
    ) {
      return "Total amount must match sum of subscription_expenses amounts.";
    }
  }

  return null;
};
