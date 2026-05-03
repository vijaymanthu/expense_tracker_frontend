"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AppRole, AuthUser } from "@/lib/auth-storage";
import { getApiErrorMessage } from "@/services/authService";
import { activateUser, blockUser, createUser, deleteUser, getUsers, updateUser } from "@/services/userService";
import Modal from "@/components/Modal";
import { BanIcon, CheckIcon, EditIcon, PlusIcon, SaveIcon, TrashIcon, XIcon } from "@/components/icons";

type FormState = { first_name: string; last_name: string; email: string; password: string; role: AppRole };
const initialForm: FormState = { first_name: "", last_name: "", email: "", password: "", role: "user" };

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isSuperAdmin = user?.role === "superadmin";
  const title = useMemo(() => (editingUser ? "Edit User" : "Create User"), [editingUser]);

  const loadUsers = async () => {
    try { setUsers(await getUsers()); } catch (loadError) { setError(getApiErrorMessage(loadError, "Unable to load users.")); }
  };

  useEffect(() => { if (isSuperAdmin) { const timer = window.setTimeout(() => void loadUsers(), 0); return () => window.clearTimeout(timer); } }, [isSuperAdmin]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage(""); setIsSaving(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { first_name: form.first_name, last_name: form.last_name, email: form.email, role: form.role });
        setMessage("User updated successfully.");
      } else {
        await createUser({ first_name: form.first_name, last_name: form.last_name, email: form.email, password: form.password, role: form.role });
        setMessage("User created successfully.");
      }
      setForm(initialForm); setEditingUser(null); setShowUserModal(false); await loadUsers();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to save user."));
    } finally { setIsSaving(false); }
  };

  const openCreateModal = () => {
    setError("");
    setMessage("");
    setEditingUser(null);
    setForm(initialForm);
    setShowUserModal(true);
  };

  const startEdit = (targetUser: AuthUser) => {
    setError("");
    setMessage("");
    setForm({
      first_name: targetUser.first_name,
      last_name: targetUser.last_name,
      email: targetUser.email,
      password: "",
      role: targetUser.role,
    });
    setEditingUser(targetUser);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setForm(initialForm);
  };

  const removeUser = async (userId: string | number) => { setError(""); setMessage(""); try { await deleteUser(userId); setMessage("User deleted successfully."); await loadUsers(); } catch (e) { setError(getApiErrorMessage(e, "Unable to delete user.")); } };
  const toggleUserStatus = async (targetUser: AuthUser) => {
    setError("");
    setMessage("");
    try {
      if (targetUser.isActive) {
        await blockUser(targetUser.id);
        setMessage("User blocked successfully.");
      } else {
        await activateUser(targetUser.id);
        setMessage("User activated successfully.");
      }
      await loadUsers();
    } catch (e) {
      setError(getApiErrorMessage(e, "Unable to update user status."));
    }
  };

  if (!isSuperAdmin) return <section className="app-card p-4"><h1 className="h4">Admin Panel</h1><p className="mb-0">You do not have permission to access this page.</p></section>;

  return (
    <section className="section-stack">
      <div className="page-heading">
        <div>
          <p className="page-kicker mb-1">Administration</p>
          <h1 className="h3 mb-0">Admin Panel</h1>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
        >
          <PlusIcon /> <span>Create User</span>
        </button>
      </div>

      <Modal isOpen={showUserModal} onClose={closeUserModal} title={title}>
        <form className="p-1" onSubmit={onSubmit}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">First Name</label>
              <input type="text" placeholder="First Name" value={form.first_name} onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))} className="form-control" required />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Last Name</label>
              <input type="text" placeholder="Last Name" value={form.last_name} onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))} className="form-control" required />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Email</label>
              <input type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="form-control" required />
            </div>
            {!editingUser && (
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Password</label>
                <input type="password" placeholder="Password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} className="form-control" required />
              </div>
            )}
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Role</label>
              <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as AppRole }))} className="form-select">
                <option value="user">Normal User</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" onClick={closeUserModal} className="btn btn-outline-secondary" aria-label="Cancel" title="Cancel"><XIcon /></button>
            <button type="submit" disabled={isSaving} className="btn btn-primary" aria-label={editingUser ? "Update User" : "Create User"} title={editingUser ? "Update User" : "Create User"}><SaveIcon /></button>
          </div>
        </form>
      </Modal>

      <div className="app-card">
        <div className="card-header border-bottom">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
            <h5 className="mb-0">User List</h5>
            <span className="badge text-bg-light">{users.length} users</span>
          </div>
        </div>
        <div className="table-shell border-0 shadow-none rounded-0">
          <table className="table table-sm table-hover mb-0 align-middle">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td className="fw-semibold">{item.first_name}</td>
                  <td>{item.last_name}</td>
                  <td>{item.email}</td>
                  <td><span className="status-pill bg-info-subtle text-info-emphasis">{item.role}</span></td>
                  <td><span className={`status-pill ${item.isActive ? "bg-success-subtle text-success-emphasis" : "bg-danger-subtle text-danger-emphasis"}`}>{item.isActive ? "Active" : "Blocked"}</span></td>
                  <td>
                    <div className="d-flex justify-content-center gap-1">
                      <button type="button" onClick={() => startEdit(item)} className="btn btn-outline-secondary btn-sm" aria-label="Edit user" title="Edit user"><EditIcon /></button>
                      <button type="button" onClick={() => void toggleUserStatus(item)} className={`btn btn-sm ${item.isActive ? "btn-outline-warning" : "btn-outline-success"}`} aria-label={item.isActive ? "Block user" : "Activate user"} title={item.isActive ? "Block user" : "Activate user"}>{item.isActive ? <BanIcon /> : <CheckIcon />}</button>
                      <button type="button" onClick={() => void removeUser(item.id)} className="btn btn-outline-danger btn-sm" aria-label="Delete user" title="Delete user"><TrashIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td className="text-muted text-center py-4" colSpan={6}>No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p className="alert alert-danger py-2 mb-0">{error}</p>}
      {message && <p className="alert alert-success py-2 mb-0">{message}</p>}
    </section>
  );
}
