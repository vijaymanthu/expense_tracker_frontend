"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { sanitizeDecimalInput, sanitizeIntegerInput } from "@/lib/numberInput";
import { getApiErrorMessage } from "@/services/authService";
import {
  CreateEmiPayload,
  EmiItem,
  EmiInstallmentItem,
  createEmi,
  deleteEmi,
  ExpenseTypeOption,
  getEmiTypes,
  getEmiInstallmentsPaginated,
  getEmisPaginated,
  markEmiInstallmentPaid,
  updateEmi,
} from "@/services/expenseService";
import { EditIcon, SaveIcon, TrashIcon, XIcon } from "@/components/icons";

type EmiFormValues = {
  emi_recursion: string;
  emi_type: string;
  name: string;
  started_date: string;
  number_of_emis: string;
  end_date: string;
  amount: string;
  installment_amount: string;
  description: string;
};

const initialFormValues: EmiFormValues = {
  emi_recursion: "monthly",
  emi_type: "",
  name: "",
  started_date: "",
  number_of_emis: "",
  end_date: "",
  amount: "",
  description: "",
  installment_amount: ""
};

const PAGE_SIZE = 10;
const INSTALLMENT_PAGE_SIZE = 10;

const validateForm = (values: EmiFormValues): string | null => {
  if (!values.emi_recursion.trim()) return "Please select EMI recursion.";
  if (!values.emi_type.trim()) return "EMI type is required.";
  if (!values.name.trim()) return "Name is required.";
  if (!values.started_date) return "Started date is required.";
  const amount = Number(values.amount);
  const installmentAmount = Number(values.installment_amount);
  if (!values.amount || !Number.isFinite(amount) || amount <= 0) return "Amount must be greater than 0.";
  if (!values.installment_amount || !Number.isFinite(installmentAmount) || installmentAmount <= 0) return "Installment Amount must be greater than 0.";
  if (installmentAmount > amount) return "Installment amount should not be greater than total amount."
  if (!values.number_of_emis.trim() && !values.end_date) {
    return "Either number of EMIs or end date is mandatory.";
  }
  if (values.number_of_emis.trim() && Number(values.number_of_emis) <= 0) {
    return "Number of EMIs must be greater than 0.";
  }
  return null;
};

const buildPayload = (values: EmiFormValues): CreateEmiPayload => ({
  emi_recursion: values.emi_recursion.trim(),
  emi_type: values.emi_type.trim(),
  name: values.name.trim(),
  started_date: values.started_date,
  number_of_emis: values.number_of_emis.trim() ? Number(values.number_of_emis) : undefined,
  end_date: values.end_date || undefined,
  amount: Number(values.amount),
  installment_amount: Number(values.installment_amount),
  description: values.description.trim() || undefined,
});

export default function EmisPage() {
  const [items, setItems] = useState<EmiItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emiError, setEmiError] = useState("");
  const [emiMessage, setEmiMessage] = useState("");
  const [modalError, setModalError] = useState("");
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [editingEmi, setEditingEmi] = useState<EmiItem | null>(null);
  const [form, setForm] = useState<EmiFormValues>(initialFormValues);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [emiTypeOptions, setEmiTypeOptions] = useState<ExpenseTypeOption[]>([]);
  const [activeEmiTypeFilter, setActiveEmiTypeFilter] = useState("");
  const [activeRecursionFilter, setActiveRecursionFilter] = useState("");
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [selectedEmiForInstallments, setSelectedEmiForInstallments] = useState<EmiItem | null>(null);
  const [installments, setInstallments] = useState<EmiInstallmentItem[]>([]);
  const [installmentCurrentPage, setInstallmentCurrentPage] = useState(1);
  const [installmentTotalItems, setInstallmentTotalItems] = useState(0);
  const [isInstallmentsLoading, setIsInstallmentsLoading] = useState(false);
  const [installmentsError, setInstallmentsError] = useState("");
  const [installmentsMessage, setInstallmentsMessage] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState<string>("");

  const load = useCallback(async (page = 1, emiTypeFilter = "", recursionFilter = "") => {
    setIsPageLoading(true);
    setEmiError("");

    try {
      const response = await getEmisPaginated(page, PAGE_SIZE, {
        emi_type: emiTypeFilter || undefined,
        emi_recursion: recursionFilter || undefined,
      });
      if (response.items.length === 0 && response.totalItems > 0 && page > 1) {
        const previousPage = page - 1;
        const previousPageResponse = await getEmisPaginated(previousPage, PAGE_SIZE, {
          emi_type: emiTypeFilter || undefined,
          emi_recursion: recursionFilter || undefined,
        });
        setItems(previousPageResponse.items);
        setTotalItems(previousPageResponse.totalItems);
        setCurrentPage(previousPage);
        return;
      }
      setItems(response.items);
      setTotalItems(response.totalItems);
      setCurrentPage(page);
    } catch (loadError) {
      setEmiError(getApiErrorMessage(loadError, "Unable to fetch EMI records."));
    } finally {
      setIsPageLoading(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(1, activeEmiTypeFilter, activeRecursionFilter);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load, activeEmiTypeFilter, activeRecursionFilter]);

  useEffect(() => {
    const loadEmiTypeOptions = async () => {
      try {
        const options = await getEmiTypes();
        setEmiTypeOptions(options);
      } catch {
        setEmiTypeOptions([]);
      }
    };
    void loadEmiTypeOptions();
  }, []);

  const openCreateModal = () => {
    setModalError("");
    setEditingEmi(null);
    setForm(initialFormValues);
    setShowEmiModal(true);
  };

  const openEditModal = (item: EmiItem) => {
    setModalError("");
    setEditingEmi(item);
    setForm({
      emi_recursion: item.emi_recursion || "monthly",
      emi_type: item.emi_type || "",
      name: item.name || "",
      started_date: item.started_date || "",
      number_of_emis:
        typeof item.number_of_emis === "number" && item.number_of_emis > 0
          ? String(item.number_of_emis)
          : "",
      end_date: item.end_date || "",
      amount: item.amount ? String(item.amount) : "",
      installment_amount: item.installment_amount ? String(item.installment_amount) : "",
      description: item.description || "",
    });
    setShowEmiModal(true);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError("");
    setEmiError("");
    setEmiMessage("");

    const validationError = validateForm(form);
    if (validationError) {
      setModalError(validationError);
      return;
    }

    const payload = buildPayload(form);

    setIsSubmitting(true);
    try {
      if (editingEmi) {
        const targetId = editingEmi.id ?? editingEmi.record_id;
        await updateEmi(targetId, payload);
        setEmiMessage("EMI updated successfully.");
      } else {
        await createEmi(payload);
        setEmiMessage("EMI added successfully.");
      }

      setShowEmiModal(false);
      setEditingEmi(null);
      setForm(initialFormValues);
      await load(editingEmi ? currentPage : 1, activeEmiTypeFilter, activeRecursionFilter);
    } catch (submitError) {
      setModalError(
        getApiErrorMessage(
          submitError,
          editingEmi ? "Unable to update EMI." : "Unable to create EMI.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (item: EmiItem) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this EMI?");
    if (!shouldDelete) return;

    setEmiError("");
    setEmiMessage("");
    try {
      const targetId = item.id ?? item.record_id;
      await deleteEmi(targetId);
      setEmiMessage("EMI deleted successfully.");
      await load(currentPage, activeEmiTypeFilter, activeRecursionFilter);
    } catch (deleteError) {
      setEmiError(getApiErrorMessage(deleteError, "Unable to delete EMI."));
    }
  };

  const loadInstallments = useCallback(async (emi: EmiItem, page = 1) => {
    const emiId = emi.id ?? emi.record_id;
    setIsInstallmentsLoading(true);
    setInstallmentsError("");
    setInstallmentsMessage("");
    try {
      const response = await getEmiInstallmentsPaginated(emiId, page, INSTALLMENT_PAGE_SIZE);
      setInstallments(response.items);
      setInstallmentCurrentPage(page);
      setInstallmentTotalItems(response.totalItems);
    } catch (loadError) {
      setInstallmentsError(
        getApiErrorMessage(loadError, "Unable to fetch EMI installments."),
      );
    } finally {
      setIsInstallmentsLoading(false);
    }
  }, []);

  const openInstallmentsModal = (item: EmiItem) => {
    setSelectedEmiForInstallments(item);
    setInstallments([]);
    setInstallmentCurrentPage(1);
    setInstallmentTotalItems(0);
    setInstallmentsError("");
    setInstallmentsMessage("");
    setShowInstallmentsModal(true);
    void loadInstallments(item, 1);
  };

  const todayDate = new Date().toISOString().slice(0, 10);

  const onMarkInstallmentPaid = async (installment: EmiInstallmentItem) => {
    if (!selectedEmiForInstallments) return;
    setInstallmentsError("");
    setInstallmentsMessage("");
    setMarkingPaidId(installment.record_id);
    try {
      await markEmiInstallmentPaid(installment.record_id);
      await loadInstallments(selectedEmiForInstallments, installmentCurrentPage);
      setInstallmentsMessage("Installment marked as paid.");
    } catch (markError) {
      setInstallmentsError(getApiErrorMessage(markError, "Unable to mark installment as paid."));
    } finally {
      setMarkingPaidId("");
    }
  };

  return (
    <section className="section-stack">
      <div className="page-heading">
        <div>
          <p className="page-kicker mb-1">Payments</p>
          <h1 className="h3 mb-0">EMIs</h1>
        </div>
        <button
          onClick={openCreateModal}
          className="btn btn-primary btn-sm"
        >
          + Add EMI
        </button>
      </div>


      {/* ALERTS */}
      {emiError && (
        <div className="alert alert-danger py-2">{emiError}</div>
      )}
      {emiMessage && (
        <div className="alert alert-success py-2">{emiMessage}</div>
      )}

      {/* FILTERS */}
      {/* TABLE */}

      <div className="app-card">

        {/* Header */}
        <div className="card-header border-bottom">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div></div>
            <div className="d-flex flex-wrap gap-2 justify-content-end">
              <select
                value={activeEmiTypeFilter}
                onChange={(e) => {
                  setActiveEmiTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-select form-select-sm w-auto"
              >
                <option value="">All EMI Types</option>
                {emiTypeOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={activeRecursionFilter}
                onChange={(e) => {
                  setActiveRecursionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-select form-select-sm w-auto"
              >
                <option value="">All Recurrence</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

          </div>


        </div>
        {isLoading || isPageLoading ? (
          <p className="p-3">Loading EMIs...</p>
        ) : (
          <div className="table-shell border-0 shadow-none rounded-0">
            <table
              className="table table-hover table-striped mb-0"
              style={{ minWidth: "1200px" }}
            >
              <thead className="table-light">
                <tr>
                  <th className="text-nowrap">Name</th>
                  <th className="text-nowrap">Type</th>
                  <th className="text-nowrap">Recurrence</th>
                  <th className="text-nowrap">Amount</th>
                  <th className="text-nowrap">Installment</th>
                  <th className="text-nowrap">Start Date</th>
                  <th className="text-nowrap">EMIs</th>
                  <th className="text-nowrap">End Date</th>
                  <th className="text-nowrap">Description</th>
                  <th className="text-nowrap text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id ?? item.record_id}>
                    <td className="text-nowrap">{item.name}</td>
                    <td>{item.emi_type}</td>
                    <td>{item.emi_recursion}</td>
                    <td>INR {item.amount.toFixed(2)}</td>
                    <td>INR {item.installment_amount.toFixed(2)}</td>
                    <td>{item.started_date}</td>
                    <td>{item.number_of_emis || "-"}</td>
                    <td>{item.end_date || "-"}</td>
                    <td className="text-truncate" style={{ maxWidth: "200px" }}>
                      {item.description || "-"}
                    </td>

                    <td className="text-nowrap text-center">
                      <button
                        onClick={() => openInstallmentsModal(item)}
                        className="btn btn-link btn-sm p-0 me-2"
                      >
                        View
                      </button>

                      <button
                        onClick={() => openEditModal(item)}
                        className="btn btn-outline-warning btn-sm me-2"
                      >
                        <EditIcon />
                      </button>

                      <button
                        onClick={() => void onDelete(item)}
                        className="btn btn-outline-danger btn-sm"
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      No EMI records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* PAGINATION */}
      <div className="mt-3">
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={(page) => {
            if (page === currentPage) return;
            void load(page, activeEmiTypeFilter, activeRecursionFilter);
          }}
        />
      </div>
      <Modal
        isOpen={showInstallmentsModal}
        onClose={() => {
          setShowInstallmentsModal(false);
          setSelectedEmiForInstallments(null);
          setInstallmentsError("");
          setInstallmentsMessage("");
        }}
        title={`Installments${selectedEmiForInstallments?.name ? ` - ${selectedEmiForInstallments.name}` : ""}`}
      >
        <div className="d-flex flex-column gap-3">

          {/* Error Message */}
          {installmentsError && (
            <div className="alert alert-danger py-2 mb-0">
              {installmentsError}
            </div>
          )}

          {/* Success Message */}
          {installmentsMessage && (
            <div className="alert alert-success py-2 mb-0">
              {installmentsMessage}
            </div>
          )}

          {/* Loading */}
          {isInstallmentsLoading ? (
            <div className="text-muted py-3 small">
              Loading installments...
            </div>
          ) : (
            <div className="table-shell">

              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-uppercase small">Sl.No</th>
                    <th className="text-uppercase small">Start Date</th>
                    <th className="text-uppercase small">Due Date</th>
                    <th className="text-uppercase small">Paid</th>
                    <th className="text-uppercase small">Paid On</th>
                    <th className="text-uppercase small">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {installments.map((installment,index) => {
                    const isStarted = installment.start_date < todayDate;
                    const canMarkPaid = isStarted && !installment.is_paid;

                    return (
                      <tr
                        key={installment.record_id}
                        className={isStarted && !installment.is_paid ? "table-danger" : ""}
                      >
                        <td>{index+1}</td>
                        <td>{installment.start_date || "-"}</td>
                        <td>{installment.due_date || "-"}</td>
                        <td>{installment.is_paid ? "Yes" : "No"}</td>
                        <td>{installment.paid_on || "-"}</td>
                        <td>
                          <button
                            type="button"
                            disabled={!canMarkPaid || markingPaidId === installment.record_id}
                            onClick={() => void onMarkInstallmentPaid(installment)}
                            className="btn btn-sm btn-success"
                            title={installment.is_paid ? "Already paid" : "Mark as Paid"}
                          >
                            {installment.is_paid ? "Paid" : "Mark as Paid"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {installments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No installments found.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={installmentCurrentPage}
            totalItems={installmentTotalItems}
            pageSize={INSTALLMENT_PAGE_SIZE}
            onPageChange={(page) => {
              if (!selectedEmiForInstallments || page === installmentCurrentPage) return;
              void loadInstallments(selectedEmiForInstallments, page);
            }}
          />

        </div>
      </Modal>
      <Modal
        isOpen={showEmiModal}
        onClose={() => {
          setShowEmiModal(false);
          setEditingEmi(null);
          setModalError("");
        }}
        title={editingEmi ? "Update EMI" : "Add EMI"}
      >
        <form onSubmit={onSubmit} className="app-card p-4">
          <div className="row g-3">

            <div className="col-md-6">
              <label className="form-label">EMI Recursion</label>
              <select
                value={form.emi_recursion}
                onChange={(e) => setForm(prev => ({ ...prev, emi_recursion: e.target.value }))}
                className="form-select"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">EMI Type</label>
              <select
                value={form.emi_type}
                onChange={(e) => setForm(prev => ({ ...prev, emi_type: e.target.value }))}
                className="form-select"
              >
                <option value="">Select EMI type</option>
                {emiTypeOptions.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="form-control"
                placeholder="Health"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Started Date</label>
              <input
                type="date"
                value={form.started_date}
                onChange={(e) => setForm(prev => ({ ...prev, started_date: e.target.value }))}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Number of EMIs</label>
              <input
                type="text"
                inputMode="numeric"
                min="1"
                value={form.number_of_emis}
                onChange={(e) =>
                  setForm(prev => ({
                    ...prev,
                    number_of_emis: sanitizeIntegerInput(e.target.value),
                  }))
                }
                className="form-control"
                placeholder="12"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Amount</label>
              <input
                type="text"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm(prev => ({
                    ...prev,
                    amount: sanitizeDecimalInput(e.target.value),
                  }))
                }
                className="form-control"
                placeholder="800"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Installment Amount</label>
              <input
                type="text"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={form.installment_amount}
                onChange={(e) =>
                  setForm(prev => ({
                    ...prev,
                    installment_amount: sanitizeDecimalInput(e.target.value),
                  }))
                }
                className="form-control"
                placeholder="800"
              />
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="form-control"
                placeholder="optional"
              />
            </div>

          </div>

          {modalError && (
            <div className="alert alert-danger mt-3 mb-0">
              {modalError}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowEmiModal(false);
                setEditingEmi(null);
                setModalError("");
              }}
              className="btn btn-outline-secondary"
            >
              <XIcon />
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              <SaveIcon />
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
