"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ActorRole = "admin" | "superadmin";
type ManagedUser = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_code: string;
  status: "Active" | "Pending" | "Inactive";
  is_blocked: boolean;
};
type UserRole = { role_code: string; role_name: string };
type UserStatus = "Active" | "Pending" | "Inactive" | "Blocked";
type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: UserStatus;
};
type UserField = keyof UserForm;
type UserErrors = Partial<Record<UserField, string>>;
type ApiResult = {
  errors?: UserErrors;
  message?: string;
  users?: ManagedUser[];
  roles?: UserRole[];
};
type UserDialog = { kind: "add" } | { kind: "edit"; user: ManagedUser };
type PendingAction = { action: "block" | "unblock"; user: ManagedUser };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fieldClass =
  "min-h-[42px] w-full rounded-[6px] border border-hope-border bg-white px-3 py-2 text-sm text-hope-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2";
const labelClass = "text-xs font-semibold text-hope-ink";
const errorClass = "min-h-4 text-xs text-hope-ink";

function displayStatus(user: ManagedUser): UserStatus {
  return user.is_blocked ? "Blocked" : user.status;
}

function statusClass(status: UserStatus) {
  if (status === "Active") return "bg-hope-sage text-hope-forest";
  if (status === "Blocked") return "bg-rose-100 text-rose-800";
  if (status === "Inactive") return "bg-slate-100 text-slate-700";
  return "bg-hope-ivory text-hope-ink";
}

function getRoleName(roleCode: string, roles: UserRole[]) {
  return roles.find((role) => role.role_code === roleCode)?.role_name ?? roleCode;
}

async function readResponse(response: Response): Promise<ApiResult> {
  try {
    return (await response.json()) as ApiResult;
  } catch {
    return { message: "The request could not be completed. Please try again." };
  }
}

export default function UserManagementClient({
  actorRole,
  actorUserId,
}: {
  actorRole: ActorRole;
  actorUserId: string;
}) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [dialog, setDialog] = useState<UserDialog | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [form, setForm] = useState<UserForm>({
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    status: "Active",
  });
  const [fieldErrors, setFieldErrors] = useState<UserErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyUserId, setBusyUserId] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const result = await readResponse(response);
      if (!response.ok || !result.users || !result.roles) {
        setLoadError(result.message ?? "Unable to load users. Please try again.");
        return;
      }

      setLoadError("");
      setUsers(result.users);
      setRoles(result.roles);
    } catch {
      setLoadError("Unable to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetch("/api/users", { cache: "no-store" })
      .then(readResponse)
      .then((result) => {
        if (!active) return;
        if (!result.users || !result.roles) {
          setLoadError(result.message ?? "Unable to load users. Please try again.");
          return;
        }

        setUsers(result.users);
        setRoles(result.roles);
      })
      .catch(() => {
        if (active) {
          setLoadError("Unable to load users. Please try again.");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!dialog && !pendingAction) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving && !busyUserId) {
        setDialog(null);
        setPendingAction(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [dialog, pendingAction, isSaving, busyUserId]);

  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter && user.role_code !== roleFilter) return false;
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return (
        !normalizedQuery ||
        fullName.includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [users, query, roleFilter]);

  function openAddDialog() {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      role: "user",
      status: "Active",
    });
    setFieldErrors({});
    setFormMessage("");
    setDialog({ kind: "add" });
  }

  function openEditDialog(user: ManagedUser) {
    setForm({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role_code,
      status: displayStatus(user),
    });
    setFieldErrors({});
    setFormMessage("");
    setDialog({ kind: "edit", user });
  }

  function updateField(field: UserField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormMessage("");
  }

  function validateForm() {
    const nextErrors: UserErrors = {};
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (!firstName) {
      nextErrors.firstName = "Enter a first name.";
    } else if (firstName.length > 100) {
      nextErrors.firstName = "First name must be 100 characters or fewer.";
    }
    if (!lastName) {
      nextErrors.lastName = "Enter a last name.";
    } else if (lastName.length > 100) {
      nextErrors.lastName = "Last name must be 100 characters or fewer.";
    }
    if (!email || email.length > 255 || !emailPattern.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!roles.some((role) => role.role_code === form.role)) {
      nextErrors.role = "Select a valid role.";
    }
    if (
      dialog?.kind === "edit" &&
      !["Active", "Pending", "Inactive", "Blocked"].includes(form.status)
    ) {
      nextErrors.status = "Select a valid status.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");
    setNotice("");
    if (!validateForm() || !dialog) return;

    setIsSaving(true);
    const isEditing = dialog.kind === "edit";
    const path = isEditing
      ? `/api/users/${encodeURIComponent(dialog.user.user_id)}`
      : "/api/users";
    const body = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      role: form.role,
      ...(isEditing ? { status: form.status } : {}),
    };

    try {
      const response = await fetch(path, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await readResponse(response);
      if (!response.ok) {
        setFieldErrors(result.errors ?? {});
        setFormMessage(
          result.message ?? "Unable to save user. Please try again.",
        );
        return;
      }

      setDialog(null);
      setNotice(result.message ?? (isEditing ? "User updated." : "User added."));
      setNoticeIsError(false);
      await loadUsers();
    } catch {
      setFormMessage("Unable to save user. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setBusyUserId(pendingAction.user.user_id);
    setNotice("");

    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(pendingAction.user.user_id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: pendingAction.action }),
        },
      );
      const result = await readResponse(response);
      setPendingAction(null);
      if (!response.ok) {
        setNotice(result.message ?? "Unable to update user. Please try again.");
        setNoticeIsError(true);
        return;
      }

      setNotice(
        result.message ??
          (pendingAction.action === "block"
            ? "User blocked."
            : "User unblocked."),
      );
      setNoticeIsError(false);
      await loadUsers();
    } catch {
      setPendingAction(null);
      setNotice("Unable to update user. Please try again.");
      setNoticeIsError(true);
    } finally {
      setBusyUserId("");
    }
  }

  const sortedRoles = [...roles].sort((left, right) => {
    const order = ["user", "admin", "superadmin"];
    return order.indexOf(left.role_code) - order.indexOf(right.role_code);
  });

  return (
    <main className="min-h-screen bg-hope-ivory px-4 py-8 font-[Inter,_Segoe_UI,_Arial,sans-serif] text-hope-ink sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              Administration
            </p>
            <h1 className="text-2xl leading-tight font-semibold text-hope-forest">
              User Management
            </h1>
            <p className="mt-2 text-sm leading-6 text-hope-ink/80">
              Manage account access and user details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              className="text-sm font-semibold text-hope-forest underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
              href="/dashboard"
            >
              Back to dashboard
            </Link>
            <button
              className="min-h-10 rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
              type="button"
              onClick={openAddDialog}
            >
              + Add User
            </button>
          </div>
        </header>

        {notice ? (
          <p
            className={`mb-4 rounded-[6px] border-l-[3px] px-3 py-2.5 text-sm ${
              noticeIsError
                ? "border-hope-gold bg-hope-ivory text-hope-ink"
                : "border-hope-green-2 bg-hope-sage text-hope-forest"
            }`}
            role={noticeIsError ? "alert" : "status"}
            aria-live="polite"
          >
            {notice}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-[10px] border border-hope-border bg-white shadow-[0_2px_10px_rgb(20_45_39_/_5%)]">
          <div className="flex flex-wrap items-end gap-4 border-b border-hope-border p-4 sm:p-5">
            <div className="grid min-w-[220px] flex-1 gap-1.5">
              <label className={labelClass} htmlFor="user-search">
                Search users
              </label>
              <input
                className={fieldClass}
                id="user-search"
                type="search"
                placeholder="Search name or email"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="grid min-w-[180px] gap-1.5">
              <label className={labelClass} htmlFor="role-filter">
                Role
              </label>
              <select
                className={fieldClass}
                id="role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
              >
                <option value="">All roles</option>
                {sortedRoles.map((role) => (
                  <option key={role.role_code} value={role.role_code}>
                    {role.role_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadError ? (
            <p
              className="m-4 rounded-[6px] border-l-[3px] border-hope-gold bg-hope-ivory px-3 py-2.5 text-sm"
              role="alert"
            >
              {loadError}
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-hope-ivory text-xs font-semibold text-hope-ink">
                <tr>
                  <th className="px-4 py-3" scope="col">Name</th>
                  <th className="px-4 py-3" scope="col">Email</th>
                  <th className="px-4 py-3" scope="col">Role</th>
                  <th className="px-4 py-3" scope="col">Status</th>
                  <th className="px-4 py-3" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hope-border">
                {isLoading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-hope-ink/70" colSpan={5}>
                      Loading users...
                    </td>
                  </tr>
                ) : loadError ? null : visibleUsers.length ? (
                  visibleUsers.map((user) => {
                    const status = displayStatus(user);
                    const canManage =
                      actorRole === "superadmin" || user.role_code === "user";
                    const isBusy = busyUserId === user.user_id;
                    return (
                      <tr key={user.user_id}>
                        <td className="px-4 py-3 font-medium text-hope-forest">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">
                          {getRoleName(user.role_code, roles)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {!canManage ? (
                            <span aria-label="No actions">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="rounded-[6px] border border-hope-border px-2.5 py-1.5 text-xs font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2 disabled:opacity-50"
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  setPendingAction({
                                    action: user.is_blocked ? "unblock" : "block",
                                    user,
                                  })
                                }
                              >
                                {user.is_blocked ? "Unblock" : "Block"}
                              </button>
                              <button
                                className="rounded-[6px] border border-hope-border px-2.5 py-1.5 text-xs font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                                type="button"
                                onClick={() => openEditDialog(user)}
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-hope-ink/70" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {dialog ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              setDialog(null);
            }
          }}
        >
          <section
            className="max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_12px_36px_rgb(20_45_39_/_18%)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-dialog-title"
          >
            <header className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-xl font-semibold text-hope-forest"
                  id="user-dialog-title"
                >
                  {dialog.kind === "add" ? "Add User" : "Edit User"}
                </h2>
                <p className="mt-1 text-sm text-hope-ink/75">
                  {dialog.kind === "add"
                    ? "Create an account for the workspace."
                    : "Update account details and access status."}
                </p>
              </div>
              <button
                className="rounded-[6px] border border-hope-border px-3 py-2 text-xs font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                type="button"
                disabled={isSaving}
                onClick={() => setDialog(null)}
              >
                Close
              </button>
            </header>

            <form
              className="grid gap-4"
              id="user-form"
              onSubmit={saveUser}
              noValidate
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <label className={labelClass} htmlFor="user-first-name">
                    First name
                  </label>
                  <input
                    className={fieldClass}
                    id="user-first-name"
                    name="firstName"
                    autoComplete="given-name"
                    maxLength={100}
                    autoFocus
                    value={form.firstName}
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    aria-describedby="user-first-name-error"
                    onChange={(event) =>
                      updateField("firstName", event.target.value)
                    }
                  />
                  <p className={errorClass} id="user-first-name-error" role="alert">
                    {fieldErrors.firstName}
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <label className={labelClass} htmlFor="user-last-name">
                    Last name
                  </label>
                  <input
                    className={fieldClass}
                    id="user-last-name"
                    name="lastName"
                    autoComplete="family-name"
                    maxLength={100}
                    value={form.lastName}
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    aria-describedby="user-last-name-error"
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                  />
                  <p className={errorClass} id="user-last-name-error" role="alert">
                    {fieldErrors.lastName}
                  </p>
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className={labelClass} htmlFor="user-email">
                  Email address
                </label>
                <input
                  className={fieldClass}
                  id="user-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={255}
                  value={form.email}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby="user-email-error"
                  onChange={(event) => updateField("email", event.target.value)}
                />
                <p className={errorClass} id="user-email-error" role="alert">
                  {fieldErrors.email}
                </p>
              </div>

              <div className="grid gap-1.5">
                <label className={labelClass} htmlFor="user-role">
                  Role
                </label>
                <select
                  className={fieldClass}
                  id="user-role"
                  name="role"
                  value={form.role}
                  disabled={
                    actorRole === "admin" ||
                    (dialog.kind === "edit" &&
                      dialog.user.user_id === actorUserId)
                  }
                  aria-invalid={Boolean(fieldErrors.role)}
                  aria-describedby="user-role-error"
                  onChange={(event) => updateField("role", event.target.value)}
                >
                  {sortedRoles.map((role) => (
                    <option key={role.role_code} value={role.role_code}>
                      {role.role_name}
                    </option>
                  ))}
                </select>
                <p className={errorClass} id="user-role-error" role="alert">
                  {fieldErrors.role}
                </p>
              </div>

              {dialog.kind === "edit" ? (
                <div className="grid gap-1.5">
                  <label className={labelClass} htmlFor="user-status">
                    Status
                  </label>
                  <select
                    className={fieldClass}
                    id="user-status"
                    name="status"
                    value={form.status}
                    aria-invalid={Boolean(fieldErrors.status)}
                    aria-describedby="user-status-error"
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                  <p className={errorClass} id="user-status-error" role="alert">
                    {fieldErrors.status}
                  </p>
                </div>
              ) : null}

              {formMessage ? (
                <p
                  className="rounded-[6px] border-l-[3px] border-hope-gold bg-hope-ivory px-3 py-2.5 text-sm"
                  id="user-form-message"
                  role="alert"
                  aria-live="polite"
                >
                  {formMessage}
                </p>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-hope-border pt-4">
                <button
                  className="min-h-10 rounded-[6px] border border-hope-border px-4 text-sm font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                  type="button"
                  disabled={isSaving}
                  onClick={() => setDialog(null)}
                >
                  Cancel
                </button>
                <button
                  className="min-h-10 rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2 disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : dialog.kind === "add"
                      ? "Add User"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {pendingAction ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyUserId) {
              setPendingAction(null);
            }
          }}
        >
          <section
            className="w-full max-w-[420px] rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_12px_36px_rgb(20_45_39_/_18%)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-user-title"
          >
            <h2
              className="text-xl font-semibold text-hope-forest"
              id="confirm-user-title"
            >
              {pendingAction.action === "block" ? "Block user?" : "Unblock user?"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-hope-ink/80">
              {pendingAction.action === "block"
                ? `Block ${pendingAction.user.first_name} ${pendingAction.user.last_name}? They will no longer be able to sign in.`
                : `Unblock ${pendingAction.user.first_name} ${pendingAction.user.last_name}?`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="min-h-10 rounded-[6px] border border-hope-border px-4 text-sm font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                type="button"
                disabled={Boolean(busyUserId)}
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </button>
              <button
                className="min-h-10 rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white transition-colors hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={Boolean(busyUserId)}
                onClick={() => void confirmAction()}
              >
                {busyUserId
                  ? "Saving..."
                  : pendingAction.action === "block"
                    ? "Block User"
                    : "Unblock User"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
