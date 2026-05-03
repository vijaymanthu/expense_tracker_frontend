"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/services/authService";
import { sanitizeDecimalInput } from "@/lib/numberInput";
import {
  CreateExpensePayload,
  ExpenseCategoryOption,
  ExpenseItem,
  ExpenseTypeOption,
  createExpense,
  deleteExpense,
  getExpenseCategories,
  getExpensesPaginated,
  getRegularExpenseTypes,
  getSubscriptionExpenseTypes,
} from "@/services/expenseService";
import {
  ExpenseCategory,
  ExpenseFormValues,
  RegularExpenseItemValues,
  RecurringType,
  SubscriptionExpenseItemValues,
  validateExpenseFormValues,
} from "@/lib/validations";
import ListRegularExpenses from "./ListRegularExpenses";
import ListSubscriptionExpenses from "./ListSubscriptionExpenses";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import {
  EyeIcon,
  PlusIcon,
  SaveIcon,
  TrashIcon,
  XIcon,
} from "@/components/icons";

const initialRegularItem: RegularExpenseItemValues = {
  regular_expense_type: "",
  amount: "",
  regular_expense_type_other_name: "",
};

const initialSubscriptionItem: SubscriptionExpenseItemValues = {
  subscription_type: "",
  name: "",
  started_on: "",
  ends_on: "",
  description: "",
  amount: "",
  subscription_type_other_name: "",
};

const initialFormValues: ExpenseFormValues = {
  expense_title: "",
  expense_category: "",
  expense_made_on: "",
  total_amount: "",
  notes: "",
  is_recurring_expense: false,
  recurring_type: "monthly",
  recurrence_date: "",
  regular_expenses: [],
  subscription_expenses: [],
};

const getAmountValue = (value: string) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const getRegularExpensesTotal = (items: RegularExpenseItemValues[]) =>
  items.reduce((sum, item) => sum + getAmountValue(item.amount), 0);

const getSubscriptionExpensesTotal = (items: SubscriptionExpenseItemValues[]) =>
  items.reduce((sum, item) => sum + getAmountValue(item.amount), 0);

const expenseListTabs: Array<{ key: ExpenseCategory; label: string }> = [
  { key: "regular", label: "Regular" },
  { key: "subscription", label: "Subscription" },
  { key: "travel", label: "Travel" },
];

export default function ExpensesPage() {
  const PAGE_SIZE = 10;
  const [form, setForm] = useState<ExpenseFormValues>(initialFormValues);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState<ExpenseCategoryOption[]>([]);
  const [regularTypeOptions, setRegularTypeOptions] = useState<ExpenseTypeOption[]>([]);
  const [subscriptionTypeOptions, setSubscriptionTypeOptions] = useState<
    ExpenseTypeOption[]
  >([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showRegularModal, setShowRegularModal] = useState(false);
  const [showAddExpenseModal, setshowAddExpenseModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [regularDraft, setRegularDraft] = useState<RegularExpenseItemValues>(initialRegularItem);
  const [subscriptionDraft, setSubscriptionDraft] =
    useState<SubscriptionExpenseItemValues>(initialSubscriptionItem);
  const [modalError, setModalError] = useState("");
  const [showListRegularExpensesModal, setShowListRegularExpensesModal] = useState(false)
  const [showListSubscriptionExpensesModal, setShowListSubscriptionExpensesModal] = useState(false)
  const [regular_expenses, setRegularExpenses] = useState([])
  const [subscription_expenses, setSubscriptionExpenses] = useState([])
  const [activeListCategory, setActiveListCategory] = useState<ExpenseCategory>("regular");
  const isAutoCalculatedTotal =
    form.expense_category === "regular" || form.expense_category === "subscription";

  const loadData = async (page = 1, category: ExpenseCategory = activeListCategory) => {
    setIsPageLoading(true);
    setError("");

    try {
      const [expenseList, categoryList, regularTypes, subscriptionTypes] =
        await Promise.all([
          getExpensesPaginated(page, PAGE_SIZE, category),
          getExpenseCategories(),
          getRegularExpenseTypes(),
          getSubscriptionExpenseTypes(),
        ]);

      if (expenseList.items.length === 0 && expenseList.totalItems > 0 && page > 1) {
        await loadData(page - 1, category);
        return;
      }

      setItems(expenseList.items);
      setTotalItems(expenseList.totalItems);
      setCurrentPage(page);
      setCategories(categoryList);
      setRegularTypeOptions(regularTypes);
      setSubscriptionTypeOptions(subscriptionTypes);
      setForm((prev) =>
        prev.expense_category || categoryList.length === 0
          ? prev
          : { ...prev, expense_category: categoryList[0].key },
      );
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load expenses data."));
    } finally {
      setIsPageLoading(false);
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData(1, activeListCategory);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeListCategory]);

  const setCategory = (nextCategory: ExpenseCategory) => {
    setForm((prev) => {
      const nextRegularExpenses = nextCategory === "regular" ? prev.regular_expenses : [];
      const nextSubscriptionExpenses =
        nextCategory === "subscription" ? prev.subscription_expenses : [];

      let nextTotalAmount = "";
      if (nextCategory === "regular") {
        nextTotalAmount = getRegularExpensesTotal(nextRegularExpenses).toFixed(2);
      } else if (nextCategory === "subscription") {
        nextTotalAmount = getSubscriptionExpensesTotal(nextSubscriptionExpenses).toFixed(2);
      }

      return {
        ...prev,
        expense_category: nextCategory,
        total_amount: nextTotalAmount,
        is_recurring_expense: false,
        recurring_type: "monthly",
        recurrence_date: "",
        regular_expenses: nextRegularExpenses,
        subscription_expenses: nextSubscriptionExpenses,
      };
    });
  };

  const addRegularExpenseDraft = () => {
    setModalError("");
    if (
      regularDraft.regular_expense_type.trim().length === 0 ||
      Number(regularDraft.amount) <= 0
    ) {
      setModalError("Enter valid regular expense type and amount.");
      return;
    }

    setForm((prev) => {
      const nextRegularExpenses = [...prev.regular_expenses, regularDraft];
      return {
        ...prev,
        regular_expenses: nextRegularExpenses,
        total_amount:
          prev.expense_category === "regular"
            ? getRegularExpensesTotal(nextRegularExpenses).toFixed(2)
            : prev.total_amount,
      };
    });
    setRegularDraft(initialRegularItem);
    setShowRegularModal(false);
  };

  const addSubscriptionExpenseDraft = () => {
    setModalError("");
    const hasInvalidValue =
      subscriptionDraft.subscription_type.trim().length === 0 ||
      (subscriptionDraft.subscription_type === "others" &&
        subscriptionDraft.subscription_type_other_name.trim().length === 0) ||
      subscriptionDraft.name.trim().length === 0 ||
      subscriptionDraft.started_on.length === 0 ||
      subscriptionDraft.ends_on.length === 0 ||
      Number(subscriptionDraft.amount) <= 0;

    if (hasInvalidValue) {
      setModalError("Fill all required subscription fields with valid values.");
      return;
    }

    setForm((prev) => {
      const nextSubscriptionExpenses = [...prev.subscription_expenses, subscriptionDraft];
      return {
        ...prev,
        subscription_expenses: nextSubscriptionExpenses,
        total_amount:
          prev.expense_category === "subscription"
            ? getSubscriptionExpensesTotal(nextSubscriptionExpenses).toFixed(2)
            : prev.total_amount,
      };
    });
    setSubscriptionDraft(initialSubscriptionItem);
    setShowSubscriptionModal(false);
  };

  const buildPayload = (values: ExpenseFormValues): CreateExpensePayload => {
    if (!values.expense_category) {
      throw new Error("Expense category is required.");
    }

    if (values.expense_category === "regular") {
      return {
        expense_title: values.expense_title.trim(),
        expense_category: "regular",
        expense_made_on: values.expense_made_on,
        total_amount: Number(values.total_amount),
        notes: values.notes.trim(),
        is_recurring_expense: values.is_recurring_expense,
        recurring_type: values.is_recurring_expense ? values.recurring_type : undefined,
        recurrence_date: values.is_recurring_expense ? values.recurrence_date : undefined,
        regular_expenses: values.regular_expenses.map((item) => ({
          regular_expense_type: item.regular_expense_type.trim(),
          amount: Number(item.amount),
          regular_expense_type_other_name: item?.regular_expense_type_other_name
        })),
      };
    }

    if (values.expense_category === "subscription") {
      return {
        expense_title: values.expense_title.trim(),
        expense_category: "subscription",
        expense_made_on: values.expense_made_on,
        total_amount: Number(values.total_amount),
        notes: values.notes.trim(),
        subscription_expenses: values.subscription_expenses.map((item) => ({
          subscription_type: item.subscription_type.trim(),
          subscription_type_other_name:
            item.subscription_type === "others"
              ? item.subscription_type_other_name.trim()
              : undefined,
          name: item.name.trim(),
          started_on: item.started_on,
          ends_on: item.ends_on,
          description: item.description.trim() || undefined,
          amount: Number(item.amount),
        })),
      };
    }

    if (values.expense_category === "travel") {
      return {
        expense_title: values.expense_title.trim(),
        expense_category: "travel",
        expense_made_on: values.expense_made_on,
        total_amount: Number(values.total_amount),
        notes: values.notes.trim(),
        is_recurring_expense: values.is_recurring_expense,
      };
    }

    throw new Error("Unsupported expense category received from API.");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const validationError = validateExpenseFormValues(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload(form);
      await createExpense(payload);
      setMessage("Expense added successfully.");
      setForm((prev) => ({
        ...initialFormValues,
        expense_category: prev.expense_category,
      }));
      await loadData(1, activeListCategory);
      setshowAddExpenseModal(false)
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to create expense."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDeleteExpense = async (expenseId: number | string) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this expense?");
    if (!shouldDelete) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await deleteExpense(expenseId);
      setMessage("Expense deleted successfully.");
      await loadData(currentPage, activeListCategory);
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Unable to delete expense."));
    }
  };

  const isCategoryOptionsLoading = isPageLoading && categories.length === 0;
  const isRegularTypesLoading =
    form.expense_category === "regular" && regularTypeOptions.length === 0;
  const isSubscriptionTypesLoading =
    form.expense_category === "subscription" && subscriptionTypeOptions.length === 0;

  return (
    <section className="section-stack">
      <div className="page-heading">
        <div>
          <p className="page-kicker mb-1">Transactions</p>
          <h1 className="h3 mb-0">Expenses</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setModalError("");
            setshowAddExpenseModal(true);
          }}
          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
        >
          <PlusIcon /> <span>Add Item</span>
        </button>
      </div>

      {
        <Modal
          isOpen={showAddExpenseModal}
          onClose={() => setshowAddExpenseModal(false)}
          title="Add Expense Details" >
          <>
            <form onSubmit={onSubmit} className="app-card p-4">

              <div className="row g-3">

                <div className="col-md-6">
                  <label className="form-label">Expense Title</label>
                  <input
                    type="text"
                    placeholder="Expense title"
                    value={form.expense_title}
                    onChange={(e) =>
                      setForm(prev => ({ ...prev, expense_title: e.target.value }))
                    }
                    className="form-control"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Expense Category</label>
                  <select
                    value={form.expense_category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="form-select"
                    disabled={isCategoryOptionsLoading}
                  >
                    <option value="">
                      {isCategoryOptionsLoading ? "Loading..." : "Select category"}
                    </option>
                    {categories.map((category) => (
                      <option key={category.key} value={category.key}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Expense Made On</label>
                  <input
                    type="date"
                    value={form.expense_made_on}
                    onChange={(e) =>
                      setForm(prev => ({ ...prev, expense_made_on: e.target.value }))
                    }
                    className="form-control"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Total Amount</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={form.total_amount}
                    onChange={(e) =>
                      !isAutoCalculatedTotal &&
                      setForm(prev => ({
                        ...prev,
                        total_amount: sanitizeDecimalInput(e.target.value),
                      }))
                    }
                    readOnly={isAutoCalculatedTotal}
                    className={`form-control ${isAutoCalculatedTotal ? "bg-light" : ""}`}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm(prev => ({ ...prev, notes: e.target.value }))
                    }
                    className="form-control"
                    rows={3}
                  />
                </div>

              </div>

              {/* Recurring Checkbox */}
              {(form.expense_category === "regular" ||
                form.expense_category === "travel") && (
                  <div className="form-check mt-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={form.is_recurring_expense}
                      onChange={(e) =>
                        setForm(prev => ({
                          ...prev,
                          is_recurring_expense: e.target.checked
                        }))
                      }
                    />
                    <label className="form-check-label">
                      Is recurring expense
                    </label>
                  </div>
                )}

              {/* Recurring Config */}
              {form.expense_category === "regular" &&
                form.is_recurring_expense && (
                  <div className="row g-3 mt-2">
                    <div className="col-md-6">
                      <select
                        value={form.recurring_type}
                        onChange={(e) =>
                          setForm(prev => ({
                            ...prev,
                            recurring_type: e.target.value as RecurringType
                          }))
                        }
                        className="form-select"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <input
                        type="date"
                        value={form.recurrence_date}
                        onChange={(e) =>
                          setForm(prev => ({
                            ...prev,
                            recurrence_date: e.target.value
                          }))
                        }
                        className="form-control"
                      />
                    </div>
                  </div>
                )}

              {/* Regular Expenses */}
              {form.expense_category === "regular" && (
                <div className="card mt-4 border-warning-subtle">
                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Regular Expenses</h6>
                      <button
                        type="button"
                        onClick={() => {
                          setModalError("");
                          setShowRegularModal(true);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        +
                      </button>
                    </div>

                    <ul className="list-group list-group-flush">
                      {form.regular_expenses.map((item, index) => (
                        <li
                          key={index}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span>
                            {item.regular_expense_type} - INR {Number(item.amount).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setForm(prev => {
                                const next = prev.regular_expenses.filter((_, i) => i !== index);
                                return {
                                  ...prev,
                                  regular_expenses: next,
                                  total_amount: getRegularExpensesTotal(next).toFixed(2)
                                };
                              })
                            }
                            className="btn btn-sm btn-outline-danger"
                          >
                            <TrashIcon />
                          </button>
                        </li>
                      ))}

                      {form.regular_expenses.length === 0 && (
                        <li className="list-group-item text-muted">
                          No items added
                        </li>
                      )}
                    </ul>

                  </div>
                </div>
              )}

              {/* Subscription Expenses */}
              {form.expense_category === "subscription" && (
                <div className="card mt-4 border-warning-subtle">
                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="mb-0">Subscription Expenses</h6>
                      <button
                        type="button"
                        onClick={() => {
                          setModalError("");
                          setShowSubscriptionModal(true);
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        +
                      </button>
                    </div>

                    <ul className="list-group list-group-flush">
                      {form.subscription_expenses.map((item, index) => (
                        <li
                          key={index}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span>
                            {item.subscription_type === "others"
                              ? item.subscription_type_other_name
                              : item.subscription_type} / {item.name} - INR {Number(item.amount).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setForm(prev => {
                                const next = prev.subscription_expenses.filter((_, i) => i !== index);
                                return {
                                  ...prev,
                                  subscription_expenses: next,
                                  total_amount: getSubscriptionExpensesTotal(next).toFixed(2)
                                };
                              })
                            }
                            className="btn btn-sm btn-outline-danger"
                          >
                            <TrashIcon />
                          </button>
                        </li>
                      ))}

                      {form.subscription_expenses.length === 0 && (
                        <li className="list-group-item text-muted">
                          No items added
                        </li>
                      )}
                    </ul>

                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setshowAddExpenseModal(false);
                    setModalError("");
                  }}
                  className="btn btn-outline-secondary"
                >
                  <XIcon />
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isCategoryOptionsLoading}
                  className="btn btn-primary"
                >
                  <SaveIcon />
                </button>
              </div>

            </form>
            {
              error && (
                <p className="alert alert-danger py-2 mb-0">
                  {error}
                </p>
              )
            }
            {
              message && (
                <p className="alert alert-success py-2 mb-0">
                  {message}
                </p>
              )
            }

            <Modal
              isOpen={showRegularModal}
              onClose={() => setShowRegularModal(false)}
              title="Add regular expense item" >

              <div className="d-flex flex-column gap-3">

                <select
                  value={regularDraft.regular_expense_type}
                  onChange={(e) =>
                    setRegularDraft(prev => ({
                      ...prev,
                      regular_expense_type: e.target.value
                    }))
                  }
                  className="form-select"
                  disabled={isRegularTypesLoading}
                >
                  <option value="">
                    {isRegularTypesLoading
                      ? "Loading..."
                      : "Select regular expense type"}
                  </option>

                  {regularTypeOptions.map(option => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {regularDraft.regular_expense_type === "others" && (
                  <input
                    type="text"
                    placeholder="Expense name"
                    value={regularDraft.regular_expense_type_other_name}
                    onChange={(e) =>
                      setRegularDraft(prev => ({
                        ...prev,
                        regular_expense_type_other_name: e.target.value
                      }))
                    }
                    className="form-control"
                  />
                )}

                <input
                  type="text"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="Amount"
                  value={regularDraft.amount}
                  onChange={(e) =>
                    setRegularDraft(prev => ({
                      ...prev,
                      amount: sanitizeDecimalInput(e.target.value)
                    }))
                  }
                  className="form-control"
                />

              </div>




              {modalError && (
                <p className="alert alert-danger py-2 mt-3 mb-0">
                  {modalError}
                </p>
              )}
              <div className="mt-4 d-flex gap-2">
                <button
                  type="button"
                  onClick={addRegularExpenseDraft}
                  className="btn btn-primary"
                  disabled={isRegularTypesLoading}
                  title="Add"
                  aria-label="Add"
                >
                  <PlusIcon />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegularModal(false);
                    setRegularDraft(initialRegularItem);
                    setModalError("");
                  }}
                  className="btn btn-outline-secondary"
                  title="Cancel"
                  aria-label="Cancel"
                >
                  <XIcon />
                </button>
              </div>
            </Modal >


            <Modal
              isOpen={showSubscriptionModal}
              onClose={() => setShowSubscriptionModal(false)}
              title="Add subscription item" >
              <>
                <div className="row g-3 mt-1">
                  <span className="col-12 col-md-6"><label className="form-label">Subscription Type</label>
                    <select
                      value={subscriptionDraft.subscription_type}
                      onChange={(event) =>
                        setSubscriptionDraft((prev) => ({
                          ...prev,
                          subscription_type: event.target.value,
                          subscription_type_other_name:
                            event.target.value === "others"
                              ? prev.subscription_type_other_name
                              : "",
                        }))
                      }
                      className="form-control"
                      disabled={isSubscriptionTypesLoading}
                    >
                      <option value="">
                        {isSubscriptionTypesLoading
                          ? "Loading subscription types..."
                          : "Select subscription type"}
                      </option>
                      {subscriptionTypeOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </span>
                  {subscriptionDraft.subscription_type === "others" && (
                    <span className="col-12 col-md-6">
                      <label className="form-label">Subscription Type Name</label>
                      <input
                        type="text"
                        placeholder="Enter subscription type name"
                        value={subscriptionDraft.subscription_type_other_name}
                        onChange={(event) =>
                          setSubscriptionDraft((prev) => ({
                            ...prev,
                            subscription_type_other_name: event.target.value,
                          }))
                        }
                        className="form-control"
                        required
                      />
                    </span>
                  )}
                  <span className="col-12 col-md-6">
                    <label className="form-label">Subscription Name</label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={subscriptionDraft.name}
                      onChange={(event) =>
                        setSubscriptionDraft((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="form-control"
                    />
                  </span>
                  <span className="col-12 col-md-6"><label className="form-label">Start Date</label>
                    <input
                      type="date"
                      value={subscriptionDraft.started_on}
                      onChange={(event) =>
                        setSubscriptionDraft((prev) => ({ ...prev, started_on: event.target.value }))
                      }
                      className="form-control"
                    />
                  </span>
                  <span className="col-12 col-md-6">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      value={subscriptionDraft.ends_on}
                      onChange={(event) =>
                        setSubscriptionDraft((prev) => ({ ...prev, ends_on: event.target.value }))
                      }
                      className="form-control"
                    />
                  </span>
                  <span className="col-12 col-md-6"><label className="form-label">Amount in INR</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="Amount"
                      value={subscriptionDraft.amount}
                      onChange={(event) =>
                        setSubscriptionDraft((prev) => ({
                          ...prev,
                          amount: sanitizeDecimalInput(event.target.value),
                        }))
                      }
                      className="form-control"
                    />
                  </span>

                  <span className="col-12 col-md-6">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      placeholder="Description (optional)"
                      value={subscriptionDraft.description}
                      onChange={(event) =>
                        setSubscriptionDraft((prev) => ({ ...prev, description: event.target.value }))
                      }
                      className="form-control"
                    />
                  </span>

                </div>
                {modalError && (
                  <p className="alert alert-danger py-2 mt-3 mb-0">
                    {modalError}
                  </p>
                )}
                <div className="mt-4 d-flex gap-2">
                  <button
                    type="button"
                    onClick={addSubscriptionExpenseDraft}
                    className="btn btn-primary"
                    disabled={isSubscriptionTypesLoading}
                    title="Add"
                    aria-label="Add"
                  >
                    <PlusIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubscriptionModal(false);
                      setSubscriptionDraft(initialSubscriptionItem);
                      setModalError("");
                    }}
                    className="btn btn-outline-secondary"
                    title="Cancel"
                    aria-label="Cancel"
                  >
                    <XIcon />
                  </button>
                </div>
              </>
            </Modal>


          </>

        </Modal >
      }

      <ListRegularExpenses
        expenses={regular_expenses}
        showModal={showListRegularExpensesModal}
        setShowModal={() => setShowListRegularExpensesModal(false)}
      />
      <ListSubscriptionExpenses
        expenses={subscription_expenses}
        showModal={showListSubscriptionExpensesModal}
        setShowModal={() => setShowListSubscriptionExpensesModal(false)}
      />
      <div className="app-card">

        {/* Header */}
        <div className="card-header border-bottom">
         
          {/* Tabs */}
          <div className="m-3 d-flex flex-wrap gap-2">
            {expenseListTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (tab.key === activeListCategory) return;
                  setActiveListCategory(tab.key);
                  setCurrentPage(1);
                }}
                className={`btn rounded-pill btn-sm ${activeListCategory === tab.key
                  ? "btn-primary"
                  : "btn-outline-secondary"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="card-body p-0">

          {isPageLoading ? (
            <div className="p-4 text-muted small">
              Loading expenses...
            </div>
          ) : (
            <div className="table-shell border-0 shadow-none rounded-0">

              <table className="table table-hover table-sm mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.expense_title}</td>
                      <td>{item.expense_category}</td>
                      <td className="fw-semibold">
                        INR {item.total_amount.toFixed(2)}
                      </td>
                      <td>{item.expense_made_on || "-"}</td>

                      <td>
                        <div className="d-flex align-items-center gap-2">

                          {(item.expense_category === "regular" ||
                            item.expense_category === "subscription") && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.expense_category === "regular") {
                                    setRegularExpenses(item.expenses || []);
                                    setShowListRegularExpensesModal(true);
                                    return;
                                  }

                                  setSubscriptionExpenses(item.expenses || []);
                                  setShowListSubscriptionExpensesModal(true);
                                }}
                                className="btn btn-sm btn-outline-primary"
                                title="View"
                              >
                                <EyeIcon />
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => void onDeleteExpense(item.record_id)}
                            className="btn btn-sm btn-outline-danger"
                            title="Delete"
                          >
                            <TrashIcon />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No expenses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

            </div>
          )}
        </div>
      </div>
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
        onPageChange={(page) => {
          if (page === currentPage) return;
          void loadData(page, activeListCategory);
        }}
      />


    </section >
  );
}
