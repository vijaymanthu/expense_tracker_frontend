"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { validateLoginValues } from "@/lib/validations";
import { getApiErrorMessage } from "@/services/authService";

type LoginState = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState<LoginState>({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field: keyof LoginState, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateLoginValues(form);
    if (validationError) return setError(validationError);

    setIsSubmitting(true);
    setError("");
    try {
      await login({ email: form.email.trim(), password: form.password });
      router.push("/dashboard");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Something went wrong while signing in."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-shell d-flex align-items-center justify-content-center px-3 py-5">
      <div className="auth-layout w-100">
        <section className="auth-visual d-none d-lg-flex">
          <div>
            <span className="brand-mark mb-4">ET</span>
            <p className="auth-eyebrow mb-2">Expense Tracker</p>
            <h1 className="auth-title mb-3">Know where every rupee goes.</h1>
            <p className="auth-copy mb-4">Track expenses, subscriptions, and EMIs from one focused workspace.</p>
            <div className="auth-stat-grid">
              <div className="auth-stat"><span>Total spend</span><strong>INR 42,860</strong></div>
              <div className="auth-stat"><span>Active EMIs</span><strong>06</strong></div>
              <div className="auth-stat auth-stat-wide"><span>Monthly trend</span><div className="auth-bars"><i></i><i></i><i></i><i></i><i></i></div></div>
            </div>
          </div>
        </section>
        <section className="auth-card w-100">
        <div className="card-body p-4 p-md-5">
          <p className="page-kicker mb-1">Welcome back</p>
          <h1 className="h2 fw-semibold mb-2">Sign in</h1>
          <p className="text-secondary mb-4">Sign in and keep your spending insights up to date.</p>

          <form className="d-flex flex-column gap-3" onSubmit={handleSubmit}>
            <div><label className="form-label fw-semibold">Email</label><input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} autoComplete="email" className="form-control form-control-lg" placeholder="you@example.com" required /></div>
            <div><label className="form-label fw-semibold">Password</label><input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} autoComplete="current-password" className="form-control form-control-lg" placeholder="Minimum 6 characters" required minLength={6} /></div>
            {error && <p className="alert alert-danger py-2 mb-0">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-100">{isSubmitting ? "Signing in..." : "Sign in"}</button>
          </form>

          <p className="mt-4 mb-0">New here? <Link href="/register">Create an account</Link></p>
        </div>
      </section>
      </div>
    </main>
  );
}
