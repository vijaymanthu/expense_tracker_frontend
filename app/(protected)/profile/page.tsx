"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { validateChangePasswordValues, validateProfileValues } from "@/lib/validations";
import { changePassword, getApiErrorMessage } from "@/services/authService";
import { updateProfile } from "@/services/userService";
import { SaveIcon } from "@/components/icons";

type ProfileForm = {
  first_name: string;
  last_name : string;
  email: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [profileForm, setProfileForm] = useState<ProfileForm>({ first_name: "", last_name:"", email: "" });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }
    const timer = window.setTimeout(() => {
      setProfileForm({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  const onProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setProfileMessage("");
    const validationError = validateProfileValues(profileForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const updatedUser = await updateProfile({
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
        email: profileForm.email.trim(),
      });
      setUser(updatedUser);
      setProfileMessage("Profile updated successfully.");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to update profile."));
    }
  };

  const onPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPasswordMessage("");
    const validationError = validateChangePasswordValues(passwordForm);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage("Password changed successfully.");
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, "Unable to change password."));
    }
  };

  return (
    <section className="section-stack">
      <div className="page-heading">
        <div>
          <p className="page-kicker mb-1">Account</p>
          <h1 className="h3 mb-0">Profile</h1>
        </div>
      </div>

      <div className="row g-3">
        <form
          onSubmit={onProfileSubmit}
          className="app-card col-12 col-lg p-4 d-flex flex-column gap-3"
        >
          <h2 className="h5 mb-0">Personal Details</h2>
          <input
            type="text"
            value={profileForm.first_name}
            onChange={(event) =>
              setProfileForm((prev) => ({ ...prev, first_name: event.target.value }))
            }
            className="app-input form-control"
            placeholder="First Name"
            required
          /><input
            type="text"
            value={profileForm.last_name}
            onChange={(event) =>
              setProfileForm((prev) => ({ ...prev, last_name: event.target.value }))
            }
            className="app-input form-control"
            placeholder="Last Name"
            required
          />
          <input
            type="email"
            value={profileForm.email}
            onChange={(event) =>
              setProfileForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="app-input form-control"
            placeholder="Email"
            required
          />
          <button
            type="submit"
            className="btn btn-primary align-self-start"
            title="Save Profile"
            aria-label="Save Profile"
          >
            <SaveIcon />
          </button>
          {profileMessage && (
            <p className="alert alert-success py-2 mb-0">
              {profileMessage}
            </p>
          )}
        </form>

        <form
          onSubmit={onPasswordSubmit}
          className="app-card col-12 col-lg p-4 d-flex flex-column gap-3"
        >
          <h2 className="h5 mb-0">Change Password</h2>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
            }
            className="app-input form-control"
            placeholder="Current password"
            required
          />
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
            }
            className="app-input form-control"
            placeholder="New password"
            required
          />
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
            }
            className="app-input form-control"
            placeholder="Confirm new password"
            required
          />
          <button
            type="submit"
            className="btn btn-primary align-self-start"
            title="Update Password"
            aria-label="Update Password"
          >
            <SaveIcon />
          </button>
          {passwordMessage && (
            <p className="alert alert-success py-2 mb-0">
              {passwordMessage}
            </p>
          )}
        </form>
      </div>

      {error && (
        <p className="alert alert-danger py-2 mb-0">
          {error}
        </p>
      )}
    </section>
  );
}
