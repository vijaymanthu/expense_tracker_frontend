"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { validateRegisterValues } from "@/lib/validations";
import { getApiErrorMessage, register } from "@/services/authService";

type RegisterState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterState>({ first_name: "", last_name: "", email: "", password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const passwordsMatch = form.password === form.confirmPassword;
  const showPasswordMismatch = !passwordsMatch && form.confirmPassword.length > 0;

  const isFormComplete = useMemo(
    () => form.first_name.trim() && form.last_name.trim() && form.email.trim() && form.password && form.confirmPassword,
    [form],
  );

  const updateField = (field: keyof RegisterState, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateRegisterValues(form);
    if (validationError) return setError(validationError);

    setIsSubmitting(true);
    setError("");
    setMessage("");
    try {
      await register({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim(), password: form.password });
      setMessage("Registration successful. You can now sign in.");
      setForm({ first_name: "", last_name: "", email: "", password: "", confirmPassword: "" });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Something went wrong while creating your account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell d-flex align-items-center justify-content-center px-3 py-5">
      <div className="auth-layout auth-layout-wide w-100">
        <section className="auth-visual d-none d-lg-flex">
          <div>
            <span className="brand-mark mb-4">ET</span>
            <p className="auth-eyebrow mb-2">Expense Tracker</p>
            <h1 className="auth-title mb-3">Start with cleaner money habits.</h1>
            <p className="auth-copy mb-4">Create a workspace for daily spending, recurring costs, and long-term payments.</p>
            <div className="auth-check-list">
              <span><i className="bi bi-check2"></i> Category-wise spends</span>
              <span><i className="bi bi-check2"></i> EMI reminders</span>
              <span><i className="bi bi-check2"></i> Role-based access</span>
            </div>
          </div>
        </section>
        <section className="auth-card auth-card-wide w-100">
        <div className="card-body p-4 p-md-5">
          <p className="page-kicker mb-1">Get started</p>
          <h1 className="h2 fw-semibold mb-2">Create account</h1>
          <p className="text-secondary mb-4">Join in and start building better money habits.</p>

          <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-12 col-sm-6"><label className="form-label fw-semibold">First Name</label><input type="text" value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} className="form-control" required minLength={2} /></div>
              <div className="col-12 col-sm-6"><label className="form-label fw-semibold">Last Name</label><input type="text" value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} className="form-control" required minLength={2} /></div>
              <div className="col-12"><label className="form-label fw-semibold">Email</label><input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="form-control" required /></div>
              <div className="col-12 col-sm-6"><label className="form-label fw-semibold">Password</label><input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} className="form-control" required minLength={6} /></div>
              <div className="col-12 col-sm-6"><label className="form-label fw-semibold">Confirm Password</label><input type="password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} className="form-control" required minLength={6} /></div>
            </div>

            {showPasswordMismatch && <p className="alert alert-danger py-2 mb-0">Passwords do not match.</p>}
            {error && <p className="alert alert-danger py-2 mb-0">{error}</p>}
            {message && <p className="alert alert-success py-2 mb-0">{message}</p>}

            <button type="submit" disabled={isSubmitting || !isFormComplete} className="btn btn-primary btn-lg w-100">{isSubmitting ? "Creating account..." : "Create account"}</button>
          </form>

          <p className="mt-4 mb-0">Already have an account? <Link href="/login">Sign in</Link></p>
        </div>
      </section>
      </div>
    </main>
  );
}
