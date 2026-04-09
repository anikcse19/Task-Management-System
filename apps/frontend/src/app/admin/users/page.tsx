"use client";

import { useState, useEffect, useCallback } from "react";
import { usersApi, type UserWithCounts } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Shield, User as UserIcon } from "lucide-react";

export default function UsersPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <UsersContent />
      </main>
    </AuthGuard>
  );
}

function UsersContent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Dialog states
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithCounts | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithCounts | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const handleCreated = (msg: string) => {
    setShowCreate(false);
    setSuccessMsg(msg);
    loadUsers();
  };

  const handleUpdated = (msg: string) => {
    setEditingUser(null);
    setSuccessMsg(msg);
    loadUsers();
  };

  const handleDeleted = async () => {
    if (!deletingUser) return;
    try {
      const res = await usersApi.delete(deletingUser.id);
      setSuccessMsg(res.message);
      setDeletingUser(null);
      loadUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      setDeletingUser(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system users and their roles ({users.length} users)
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add User
        </Button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 font-medium underline"
          >
            dismiss
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* Users table */}
      {users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No users found.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                          {u.role === "ADMIN" ? (
                            <Shield className="h-4 w-4 text-blue-600" />
                          ) : (
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {u.name}
                            {isSelf && (
                              <span className="ml-1.5 text-xs text-blue-600 font-normal">
                                (you)
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.role === "ADMIN" ? "admin" : "user"}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        <span title="Assigned tasks">
                          {u._count.assignedTasks} assigned
                        </span>
                        <span className="mx-1.5 text-gray-300">·</span>
                        <span title="Created tasks">
                          {u._count.createdTasks} created
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(u)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "You cannot delete yourself"
                              : "Delete user"
                          }
                          onClick={() => setDeletingUser(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create user dialog */}
      <CreateUserDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={handleCreated}
      />

      {/* Edit user dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          isSelf={editingUser.id === currentUser?.id}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={handleUpdated}
        />
      )}

      {/* Delete confirmation dialog */}
      {deletingUser && (
        <Dialog
          open={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          title="Delete User"
        >
          <p className="text-sm text-gray-600 mb-2">
            Are you sure you want to delete <strong>{deletingUser.name}</strong>{" "}
            ({deletingUser.email})?
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Their assigned tasks will be unassigned. This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleted}>
              Delete User
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// ─── Create User Dialog ────────────────────────────────

function CreateUserDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const res = await usersApi.create({ name, email, password, role });
      reset();
      onSuccess(res.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Create New User">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ─── Edit User Dialog ──────────────────────────────────

function EditUserDialog({
  user,
  isSelf,
  open,
  onClose,
  onSuccess,
}: {
  user: UserWithCounts;
  isSelf: boolean;
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">(user.role);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updates: Record<string, string> = {};
    if (name !== user.name) updates.name = name;
    if (email !== user.email) updates.email = email;
    if (role !== user.role) updates.role = role;
    if (password.trim()) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
      updates.password = password;
    }

    if (Object.keys(updates).length === 0) {
      setError("No changes to save");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const res = await usersApi.update(user.id, updates);
      onSuccess(res.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={`Edit User — ${user.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password{" "}
            <span className="text-xs text-gray-400 font-normal">
              (leave blank to keep current)
            </span>
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep unchanged"
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
            disabled={isSelf}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </Select>
          {isSelf && (
            <p className="text-xs text-gray-400 mt-1">
              You cannot change your own role.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
