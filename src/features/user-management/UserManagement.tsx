"use client";

import { useState } from "react";

type ManagedUser = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_code: string;
  status: string;
  is_blocked: boolean;
};

type UserRole = "superadmin" | "admin" | "user";
type UserAction =
  | "approve"
  | "disapprove"
  | "block"
  | "unblock"
  | "makeAdmin"
  | "removeAdmin";
type ResponseBody = {
  message?: string;
  role_code?: UserRole;
  status?: string;
  is_blocked?: boolean;
};
type RightItem = {
  right_code: string;
  module_code: string;
  description: string;
};
type RightsResponse = {
  message?: string;
  rights?: RightItem[];
  selectedRightCodes?: string[];
};

const roleLabels: Record<UserRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  user: "User",
};

const roleBadgeStyles: Record<UserRole, string> = {
  superadmin: "bg-hope-gold/25 text-hope-sidebar",
  admin: "bg-hope-sage text-hope-forest",
  user: "bg-hope-ivory text-hope-ink",
};

const moduleLabels: Record<string, string> = {
  customers: "Customers",
  products: "Products",
  hr: "Human Resources",
  sales: "Sales",
  reports: "Reports",
};

const actionLabels: Record<UserAction, string> = {
  approve: "Approve",
  disapprove: "Disapprove",
  block: "Block",
  unblock: "Unblock",
  makeAdmin: "Make Admin",
  removeAdmin: "Remove Admin",
};

function isUserRole(role: string): role is UserRole {
  return role === "superadmin" || role === "admin" || role === "user";
}

export default function UserManagement({
  users: initialUsers,
  actorRole,
  currentUserId,
}: {
  users: ManagedUser[];
  actorRole: "superadmin" | "admin";
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [rightsUser, setRightsUser] = useState<ManagedUser | null>(null);
  const [rights, setRights] = useState<RightItem[]>([]);
  const [selectedRightCodes, setSelectedRightCodes] = useState<string[]>([]);
  const [isLoadingRights, setIsLoadingRights] = useState(false);
  const [isSavingRights, setIsSavingRights] = useState(false);
  const roleChoices: UserRole[] = editingUser
    ? actorRole === "superadmin"
      ? ["user", "admin", "superadmin"]
      : editingUser.role_code === "user"
        ? ["user"]
        : isUserRole(editingUser.role_code)
          ? [editingUser.role_code]
          : []
    : [];

  async function performAction(user: ManagedUser, action: UserAction) {
    setActingUserId(user.user_id);
    setMessage("");
    setMessageIsError(false);

    let response: Response;
    try {
      response = await fetch(`/api/users/${user.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch {
      setMessage("Unable to reach the user management service.");
      setMessageIsError(true);
      setActingUserId(null);
      return;
    }

    let result: ResponseBody;
    try {
      result = (await response.json()) as ResponseBody;
    } catch {
      setMessage("Unable to complete this user action.");
      setMessageIsError(true);
      setActingUserId(null);
      return;
    }

    setActingUserId(null);
    if (!response.ok) {
      setMessage(result.message ?? "Unable to complete this user action.");
      setMessageIsError(true);
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((currentUser) =>
        currentUser.user_id === user.user_id
          ? {
              ...currentUser,
              role_code: result.role_code ?? currentUser.role_code,
              status: result.status ?? currentUser.status,
              is_blocked: result.is_blocked ?? currentUser.is_blocked,
            }
          : currentUser,
      ),
    );
    setMessage(result.message ?? "User updated.");
  }

  function openEditor(user: ManagedUser) {
    if (!isUserRole(user.role_code)) return;
    setEditingUser(user);
    setSelectedRole(user.role_code);
    setMessage("");
    setMessageIsError(false);
  }

  async function openRights(user: ManagedUser) {
    setRightsUser(user);
    setRights([]);
    setSelectedRightCodes([]);
    setIsLoadingRights(true);
    setMessage("");
    setMessageIsError(false);

    let response: Response;
    try {
      response = await fetch(`/api/users/${user.user_id}/rights`);
    } catch {
      setMessage("Unable to reach the user management service.");
      setMessageIsError(true);
      setRightsUser(null);
      setIsLoadingRights(false);
      return;
    }

    let result: RightsResponse;
    try {
      result = (await response.json()) as RightsResponse;
    } catch {
      setMessage("Unable to load User rights.");
      setMessageIsError(true);
      setRightsUser(null);
      setIsLoadingRights(false);
      return;
    }

    setIsLoadingRights(false);
    if (!response.ok || !result.rights || !result.selectedRightCodes) {
      setMessage(result.message ?? "Unable to load User rights.");
      setMessageIsError(true);
      setRightsUser(null);
      return;
    }

    setRights(result.rights);
    setSelectedRightCodes(result.selectedRightCodes);
  }

  async function saveRights() {
    if (!rightsUser) return;
    setIsSavingRights(true);
    setMessage("");
    setMessageIsError(false);

    let response: Response;
    try {
      response = await fetch(`/api/users/${rightsUser.user_id}/rights`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rightCodes: selectedRightCodes }),
      });
    } catch {
      setMessage("Unable to reach the user management service.");
      setMessageIsError(true);
      setIsSavingRights(false);
      return;
    }

    let result: RightsResponse;
    try {
      result = (await response.json()) as RightsResponse;
    } catch {
      setMessage("Unable to save User rights.");
      setMessageIsError(true);
      setIsSavingRights(false);
      return;
    }

    setIsSavingRights(false);
    if (!response.ok) {
      setMessage(result.message ?? "Unable to save User rights.");
      setMessageIsError(true);
      return;
    }

    setRightsUser(null);
    setMessage(result.message ?? "Rights saved.");
  }

  function toggleRight(rightCode: string) {
    setSelectedRightCodes((current) =>
      current.includes(rightCode)
        ? current.filter((code) => code !== rightCode)
        : [...current, rightCode],
    );
  }

  async function saveRole() {
    if (!editingUser) return;
    setIsSaving(true);
    setMessage("");
    setMessageIsError(false);

    let response: Response;
    try {
      response = await fetch(`/api/users/${editingUser.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_code: selectedRole }),
      });
    } catch {
      setMessage("Unable to reach the user management service.");
      setMessageIsError(true);
      setIsSaving(false);
      return;
    }

    let result: ResponseBody;
    try {
      result = (await response.json()) as ResponseBody;
    } catch {
      setMessage("Unable to complete the role update.");
      setMessageIsError(true);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    const updatedRole = result.role_code;
    if (!response.ok || !updatedRole) {
      setMessage(result.message ?? "Unable to update this role.");
      setMessageIsError(true);
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.user_id === editingUser.user_id
          ? { ...user, role_code: updatedRole }
          : user,
      ),
    );
    setMessage("Role updated.");
    setEditingUser(null);
  }

  return (
    <>
      {message ? (
        <p
          className={`mb-4 rounded-[6px] border-l-[3px] px-3 py-2.5 text-sm ${
            messageIsError
              ? "border-red-700 bg-red-50 text-red-900"
              : "border-hope-gold bg-white text-hope-ink"
          }`}
          role={messageIsError ? "alert" : "status"}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-[10px] border border-hope-border bg-white shadow-[0_2px_10px_rgb(20_45_39_/_5%)]">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-hope-ivory text-xs font-semibold text-hope-ink">
            <tr>
              <th className="px-4 py-3" scope="col">
                Name
              </th>
              <th className="px-4 py-3" scope="col">
                Email
              </th>
              <th className="px-4 py-3" scope="col">
                Status
              </th>
              <th className="px-4 py-3" scope="col">
                Role
              </th>
              <th className="px-4 py-3" scope="col">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hope-border">
            {users.map((user) => {
              const role = isUserRole(user.role_code)
                ? user.role_code
                : "user";
              const isOwnRow = user.user_id === currentUserId;
              const canEdit =
                isOwnRow ||
                actorRole === "superadmin" ||
                (actorRole === "admin" && role === "user");
              const canAct =
                !isOwnRow &&
                (actorRole === "superadmin" || role === "user");
              const status = user.is_blocked ? "Blocked" : user.status;
              const isPendingUser = role === "user" && status === "Pending";

              return (
                <tr key={user.user_id}>
                  <td className="px-4 py-3 font-medium text-hope-ink">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-4 py-3 text-hope-ink/80">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        status === "Active"
                          ? "bg-hope-sage text-hope-forest"
                          : status === "Pending"
                            ? "bg-hope-gold/25 text-hope-sidebar"
                            : "bg-hope-ivory text-hope-ink"
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeStyles[role]}`}
                    >
                      {roleLabels[role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canAct && isPendingUser ? (
                        <>
                          <ActionButton
                            action="approve"
                            disabled={actingUserId === user.user_id}
                            onClick={() => performAction(user, "approve")}
                          />
                          <ActionButton
                            action="disapprove"
                            disabled={actingUserId === user.user_id}
                            onClick={() => performAction(user, "disapprove")}
                          />
                        </>
                      ) : canAct ? (
                        <>
                          <ActionButton
                            action={user.is_blocked ? "unblock" : "block"}
                            disabled={actingUserId === user.user_id}
                            onClick={() =>
                              performAction(
                                user,
                                user.is_blocked ? "unblock" : "block",
                              )
                            }
                          />
                          {actorRole === "superadmin" &&
                          status === "Active" &&
                          !user.is_blocked &&
                          role === "user" ? (
                            <ActionButton
                              action="makeAdmin"
                              disabled={actingUserId === user.user_id}
                              onClick={() => performAction(user, "makeAdmin")}
                            />
                          ) : null}
                          {actorRole === "superadmin" &&
                          status === "Active" &&
                          !user.is_blocked &&
                          role === "admin" ? (
                            <ActionButton
                              action="removeAdmin"
                              disabled={actingUserId === user.user_id}
                              onClick={() => performAction(user, "removeAdmin")}
                            />
                          ) : null}
                        </>
                      ) : null}
                      {canAct && role === "user" ? (
                        <button
                          className="min-h-9 rounded-[6px] border border-hope-border bg-white px-3 text-xs font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                          type="button"
                          disabled={actingUserId === user.user_id}
                          onClick={() => openRights(user)}
                        >
                          Rights
                        </button>
                      ) : null}
                      {canEdit ? (
                        <button
                          className="min-h-9 rounded-[6px] border border-hope-border bg-white px-3 text-xs font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                          type="button"
                          onClick={() => openEditor(user)}
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm text-hope-ink/70"
                  colSpan={5}
                >
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {editingUser ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-hope-sidebar/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) {
              setEditingUser(null);
            }
          }}
        >
          <section
            className="w-full max-w-[480px] rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_12px_36px_rgb(20_45_39_/_20%)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-role-title"
          >
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              User Management
            </p>
            <h2
              className="text-xl font-semibold text-hope-forest"
              id="edit-role-title"
            >
              Edit role
            </h2>
            <p className="mt-2 text-sm text-hope-ink/80">
              {editingUser.first_name} {editingUser.last_name}
            </p>
            <label
              className="mt-5 block text-xs font-semibold text-hope-ink"
              htmlFor="edit-user-role"
            >
              Role
            </label>
            <select
              className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-hope-border bg-white px-3 text-sm text-hope-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
              id="edit-user-role"
              value={selectedRole}
              onChange={(event) => {
                if (isUserRole(event.target.value)) {
                  setSelectedRole(event.target.value);
                }
              }}
            >
              {roleChoices.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
            {actorRole === "admin" ? (
              <p className="mt-2 text-xs text-hope-ink/70">
                Admins can only manage User accounts and cannot promote users.
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="min-h-10 rounded-[6px] border border-hope-border bg-white px-4 text-sm font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                type="button"
                disabled={isSaving}
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
              <button
                className="min-h-10 rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={isSaving || selectedRole === editingUser.role_code}
                onClick={saveRole}
              >
                {isSaving ? "Saving..." : "Save role"}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {rightsUser ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-hope-sidebar/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSavingRights) {
              setRightsUser(null);
            }
          }}
        >
          <section
            className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-[10px] border border-hope-border bg-white p-6 shadow-[0_12px_36px_rgb(20_45_39_/_20%)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-rights-title"
          >
            <p className="mb-2 text-xs font-bold tracking-[0.1em] text-hope-green-2 uppercase">
              User Management
            </p>
            <h2
              className="text-xl font-semibold text-hope-forest"
              id="edit-rights-title"
            >
              Rights
            </h2>
            <p className="mt-2 text-sm text-hope-ink/80">
              {rightsUser.first_name} {rightsUser.last_name}
            </p>
            {isLoadingRights ? (
              <p className="mt-6 text-sm text-hope-ink/75">
                Loading rights...
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {["customers", "products", "hr", "sales", "reports"].map(
                  (moduleCode) => {
                    const moduleRights = rights.filter(
                      (right) => right.module_code === moduleCode,
                    );
                    if (moduleRights.length === 0) return null;

                    return (
                      <fieldset
                        className="grid gap-2 rounded-[6px] border border-hope-border p-3"
                        key={moduleCode}
                      >
                        <legend className="px-1 text-sm font-semibold text-hope-forest">
                          {moduleLabels[moduleCode]}
                        </legend>
                        {moduleRights.map((right) => (
                          <label
                            className="flex items-start gap-2 text-sm text-hope-ink"
                            key={right.right_code}
                          >
                            <input
                              className="mt-0.5 accent-hope-forest"
                              type="checkbox"
                              checked={selectedRightCodes.includes(
                                right.right_code,
                              )}
                              onChange={() => toggleRight(right.right_code)}
                            />
                            <span>{right.description}</span>
                          </label>
                        ))}
                      </fieldset>
                    );
                  },
                )}
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="min-h-10 rounded-[6px] border border-hope-border bg-white px-4 text-sm font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2"
                type="button"
                disabled={isSavingRights}
                onClick={() => setRightsUser(null)}
              >
                Cancel
              </button>
              <button
                className="min-h-10 rounded-[6px] bg-hope-forest px-4 text-sm font-semibold text-white hover:bg-hope-green-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={isLoadingRights || isSavingRights}
                onClick={saveRights}
              >
                {isSavingRights ? "Saving..." : "Save rights"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function ActionButton({
  action,
  disabled,
  onClick,
}: {
  action: UserAction;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="min-h-9 rounded-[6px] border border-hope-border bg-white px-3 text-xs font-semibold text-hope-forest hover:bg-hope-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hope-green-2 disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {actionLabels[action]}
    </button>
  );
}
