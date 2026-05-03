"use client";

import { useEffect, useState } from "react";
import { sanitizeIntegerInput } from "@/lib/numberInput";
import { getApiErrorMessage } from "@/services/authService";
import {
  DashboardEmiItem,
  DashboardInvestmentItem,
  getDashboardEmis,
  getDashboardInvestments,
  getDashboardTotalSpends,
  getEmis,
  getExpenses,
} from "@/services/expenseService";
import { ExpenseCategory } from "@/lib/validations";

type Summary = {
  expensesCount: number;
  emisCount: number;
  totalExpenseAmount: number;
};

type SpendByCategory = Record<ExpenseCategory, number>;
type FilterMode = "all" | "month" | "year";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const totalSpendsCards: Array<{ key: ExpenseCategory; label: string }> = [
  { key: "regular", label: "Regular" },
  { key: "subscription", label: "Subscription" },
  { key: "travel", label: "Travel" },
];

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatLabel = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary>({ expensesCount: 0, emisCount: 0, totalExpenseAmount: 0 });
  const [spendByCategory, setSpendByCategory] = useState<SpendByCategory>({ regular: 0, subscription: 0, travel: 0 });
  const [investments, setInvestments] = useState<DashboardInvestmentItem[]>([]);
  const [dashboardEmis, setDashboardEmis] = useState<DashboardEmiItem[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [isTotalSpendsLoading, setIsTotalSpendsLoading] = useState(true);
  const [isDashboardCardsLoading, setIsDashboardCardsLoading] = useState(true);
  const [totalSpendsError, setTotalSpendsError] = useState("");
  const [dashboardCardsError, setDashboardCardsError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTopSummary = async () => {
      setError("");
      try {
        const [expenses, emis] = await Promise.all([getExpenses(), getEmis()]);
        setSummary({
          expensesCount: expenses.length,
          emisCount: emis.length,
          totalExpenseAmount: expenses.reduce((acc, item) => acc + item.total_amount, 0),
        });
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Unable to load dashboard data."));
      }
    };
    void loadTopSummary();
  }, []);

  useEffect(() => {
    const loadDashboardCards = async () => {
      setDashboardCardsError("");
      setIsDashboardCardsLoading(true);
      try {
        const [investmentRows, emiRows] = await Promise.all([
          getDashboardInvestments(),
          getDashboardEmis(),
        ]);
        setInvestments(investmentRows);
        setDashboardEmis(emiRows);
      } catch (loadError) {
        setDashboardCardsError(getApiErrorMessage(loadError, "Unable to load dashboard EMI details."));
        setInvestments([]);
        setDashboardEmis([]);
      } finally {
        setIsDashboardCardsLoading(false);
      }
    };
    void loadDashboardCards();
  }, []);

  useEffect(() => {
    const loadFilteredDashboardSections = async () => {
      setTotalSpendsError("");
      setIsTotalSpendsLoading(true);
      try {
        const normalizedMonth = Number(selectedMonth);
        const normalizedYear = Number(selectedYear);
        const filters =
          filterMode === "month" && Number.isInteger(normalizedMonth) && normalizedMonth >= 1 && normalizedMonth <= 12
            ? { month: String(normalizedMonth) }
            : filterMode === "year" && Number.isInteger(normalizedYear) && normalizedYear >= 1900 && normalizedYear <= 2100
              ? { year: String(normalizedYear) }
              : undefined;

        const dashboardTotalSpends = await getDashboardTotalSpends(filters);
        const normalizedSpends = dashboardTotalSpends.reduce<SpendByCategory>(
          (acc, item) => ({ ...acc, [item.expense_category]: item.total }),
          { regular: 0, subscription: 0, travel: 0 },
        );
        setSpendByCategory(normalizedSpends);
      } catch (loadError) {
        setTotalSpendsError(getApiErrorMessage(loadError, "Unable to load total spends by category."));
        setSpendByCategory({ regular: 0, subscription: 0, travel: 0 });
      } finally {
        setIsTotalSpendsLoading(false);
      }
    };
    void loadFilteredDashboardSections();
  }, [filterMode, selectedMonth, selectedYear]);

  return (
    <section className="section-stack">
      <div className="page-heading">
        <div>
          <p className="page-kicker mb-1">Overview</p>
          <h1 className="h3 mb-0">Dashboard</h1>
        </div>
      </div>

      <div className="row g-3">
        <article className="col-12 col-md-6 col-lg-4 stagger-item"><div className="app-card metric-card h-100"><div className="card-body p-4"><div className="d-flex align-items-center justify-content-between gap-3"><div><p className="text-muted mb-1">Total Expenses</p><p className="display-6 fw-semibold mb-0">{summary.expensesCount}</p></div><span className="metric-icon"><i className="bi bi-receipt"></i></span></div></div></div></article>
        <article className="col-12 col-md-6 col-lg-4 stagger-item"><div className="app-card metric-card h-100"><div className="card-body p-4"><div className="d-flex align-items-center justify-content-between gap-3"><div><p className="text-muted mb-1">Active EMIs</p><p className="display-6 fw-semibold mb-0">{summary.emisCount}</p></div><span className="metric-icon"><i className="bi bi-credit-card"></i></span></div></div></div></article>
        <article className="col-12 col-lg-4 stagger-item"><div className="app-card metric-card h-100"><div className="card-body p-4"><div className="d-flex align-items-center justify-content-between gap-3"><div><p className="text-muted mb-1">Expense Amount</p><p className="h2 fw-semibold mb-0">{currencyFormatter.format(summary.totalExpenseAmount)}</p></div><span className="metric-icon"><i className="bi bi-currency-rupee"></i></span></div></div></div></article>
      </div>

      <div className="app-card"><div className="card-body p-3 p-md-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-3"><label className="form-label fw-semibold mb-0">Global Filter</label></div>
          <div className="col-12 col-md-9 d-flex flex-wrap gap-2">
            <select value={filterMode} onChange={(event) => setFilterMode(event.target.value as FilterMode)} className="form-select" style={{ maxWidth: "220px" }}>
              <option value="all">All Time</option><option value="month">Monthly</option><option value="year">Yearly</option>
            </select>
            {filterMode === "month" && <input type="text" inputMode="numeric" min="1" max="12" value={selectedMonth} placeholder="Month (1-12)" onChange={(event) => setSelectedMonth(sanitizeIntegerInput(event.target.value).slice(0, 2))} className="form-control" style={{ maxWidth: "220px" }} />}
            {filterMode === "year" && <input type="text" inputMode="numeric" min="1900" max="2100" value={selectedYear} placeholder="Year" onChange={(event) => setSelectedYear(sanitizeIntegerInput(event.target.value).slice(0, 4))} className="form-control" style={{ maxWidth: "220px" }} />}
            <button type="button" onClick={() => { setFilterMode("all"); setSelectedMonth(""); setSelectedYear(""); }} className="btn btn-ghost">Clear</button>
          </div>
        </div>
      </div></div>

      <h2 className="h5 mb-0">Total Spends</h2>
      {isTotalSpendsLoading ? <p className="text-secondary mb-0">Loading total spends...</p> : (
        <div className="row g-3">{totalSpendsCards.map((card) => (<article key={card.key} className="col-12 col-md-6 col-lg-4"><div className="app-card h-100"><div className="card-body p-4"><p className="text-muted mb-1">{card.label}</p><p className="h4 fw-semibold mb-0">{currencyFormatter.format(spendByCategory[card.key] ?? 0)}</p></div></div></article>))}</div>
      )}

      <div className="d-flex align-items-center justify-content-between gap-3">
        <h2 className="h5 mb-0">Investments</h2>
        <span className="badge text-bg-light">{investments.length}</span>
      </div>
      {isDashboardCardsLoading ? <p className="text-secondary mb-0">Loading investments...</p> : investments.length ? (
        <div className="row g-3">
          {investments.map((item) => (
            <article key={item.record_id} className="col-12 col-md-6 col-xl-4">
              <div className="app-card h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <div>
                      <p className="text-muted mb-1">Investment</p>
                      <h3 className="h6 fw-semibold mb-0">{item.name}</h3>
                    </div>
                    <span className={`badge ${item.status === "Active" ? "text-bg-success" : "text-bg-secondary"} align-self-start`}>{item.status}</span>
                  </div>
                  <p className="h4 fw-semibold mb-3">{currencyFormatter.format(item.invested_amount)}</p>
                  <div className="row g-2 small text-secondary">
                    <div className="col-6">Total<br /><span className="fw-semibold text-body">{currencyFormatter.format(item.total_amount)}</span></div>
                    <div className="col-6">Remaining<br /><span className="fw-semibold text-body">{currencyFormatter.format(item.remaining_amount)}</span></div>
                    <div className="col-6">Paid EMIs<br /><span className="fw-semibold text-body">{item.paid_installments}</span></div>
                    <div className="col-6">Next Due<br /><span className="fw-semibold text-body">{formatDate(item.current_due_date)}</span></div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="text-secondary mb-0">No investments found.</p>}

      <div className="d-flex align-items-center justify-content-between gap-3">
        <h2 className="h5 mb-0">EMI</h2>
        <span className="badge text-bg-light">{dashboardEmis.length}</span>
      </div>
      {isDashboardCardsLoading ? <p className="text-secondary mb-0">Loading EMIs...</p> : dashboardEmis.length ? (
        <div className="row g-3">
          {dashboardEmis.map((item) => (
            <article key={item.record_id} className="col-12 col-md-6 col-xl-4">
              <div className="app-card h-100">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <div>
                      <p className="text-muted mb-1">{formatLabel(item.emi_type)} EMI</p>
                      <h3 className="h6 fw-semibold mb-0">{item.name}</h3>
                    </div>
                    <span className={`badge ${item.status === "Active" ? "text-bg-success" : "text-bg-secondary"} align-self-start`}>{item.status}</span>
                  </div>
                  <p className="h4 fw-semibold mb-3">{currencyFormatter.format(item.remaining_amount)}</p>
                  <div className="row g-2 small text-secondary">
                    <div className="col-6">Paid<br /><span className="fw-semibold text-body">{currencyFormatter.format(item.paid_amount)}</span></div>
                    <div className="col-6">Active Amount<br /><span className="fw-semibold text-body">{currencyFormatter.format(item.active_emi_amount)}</span></div>
                    <div className="col-6">Installments<br /><span className="fw-semibold text-body">{item.paid_installments}/{item.total_installments || item.number_of_emis || 0}</span></div>
                    <div className="col-6">Next Due<br /><span className="fw-semibold text-body">{formatDate(item.current_due_date)}</span></div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="text-secondary mb-0">No EMI records found.</p>}

      {totalSpendsError && <p className="alert alert-danger py-2 mb-0">{totalSpendsError}</p>}
      {dashboardCardsError && <p className="alert alert-danger py-2 mb-0">{dashboardCardsError}</p>}
      {error && <p className="alert alert-danger py-2 mb-0">{error}</p>}
    </section>
  );
}
