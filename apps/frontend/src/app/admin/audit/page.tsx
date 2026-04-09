"use client";

import { useState, useEffect, useCallback } from "react";
import { auditApi, type AuditLog } from "@/lib/api";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AuditLogsPage() {
  return (
    <AuthGuard requiredRole="ADMIN">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AuditLogsContent />
      </main>
    </AuthGuard>
  );
}

// Map action types to human-readable labels and colors
const actionLabels: Record<string, { label: string; color: string }> = {
  TASK_CREATED: { label: "Task Created", color: "bg-green-100 text-green-800" },
  TASK_UPDATED: { label: "Task Updated", color: "bg-blue-100 text-blue-800" },
  TASK_DELETED: { label: "Task Deleted", color: "bg-red-100 text-red-800" },
  TASK_STATUS_CHANGED: {
    label: "Status Changed",
    color: "bg-yellow-100 text-yellow-800",
  },
  TASK_ASSIGNED: {
    label: "Task Assigned",
    color: "bg-purple-100 text-purple-800",
  },
  USER_CREATED: { label: "User Created", color: "bg-teal-100 text-teal-800" },
  USER_UPDATED: {
    label: "User Updated",
    color: "bg-indigo-100 text-indigo-800",
  },
  USER_DELETED: { label: "User Deleted", color: "bg-rose-100 text-rose-800" },
};

function AuditLogsContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await auditApi.getAll(page, 15);
      setLogs(res.data);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track all actions performed in the system ({total} total entries)
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No audit logs yet. Actions will appear here.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Actor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => {
                  const actionInfo = actionLabels[log.action] || {
                    label: log.action,
                    color: "bg-gray-100 text-gray-800",
                  };

                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {log.actorName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.actorRole}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          {log.entityTitle ? (
                            <div
                              className="text-sm font-medium text-gray-900 max-w-[200px] truncate"
                              title={log.entityTitle}
                            >
                              {log.entityTitle}
                            </div>
                          ) : (
                            <span className="text-xs italic text-gray-400">
                              Unknown
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {log.entityType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionInfo.color}`}
                        >
                          {actionInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <AuditDetails log={log} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Renders human-readable details for each audit log entry.
 * Shows before→after for changes, full data for creates/deletes.
 */
function AuditDetails({ log }: { log: AuditLog }) {
  const prev = log.previousValues;
  const next = log.newValues;

  switch (log.action) {
    case "TASK_CREATED":
      return (
        <span>
          Created task:{" "}
          <strong>{(next as Record<string, unknown>)?.title as string}</strong>
        </span>
      );
    case "TASK_DELETED":
      return (
        <span>
          Deleted task:{" "}
          <strong>{(prev as Record<string, unknown>)?.title as string}</strong>
        </span>
      );
    case "TASK_STATUS_CHANGED":
      return (
        <span>
          Status:{" "}
          <Badge variant="default">
            {(prev as Record<string, unknown>)?.status as string}
          </Badge>{" "}
          →{" "}
          <Badge variant="default">
            {(next as Record<string, unknown>)?.status as string}
          </Badge>
        </span>
      );
    case "TASK_ASSIGNED":
      return (
        <span>
          Assignment changed (
          {(prev as Record<string, unknown>)?.assignedToId
            ? "reassigned"
            : "newly assigned"}
          )
        </span>
      );
    case "TASK_UPDATED":
      return (
        <span>
          Updated fields: {next ? Object.keys(next).join(", ") : "unknown"}
        </span>
      );
    case "USER_CREATED":
      return (
        <span>
          Created user:{" "}
          <strong>{(next as Record<string, unknown>)?.name as string}</strong> (
          {(next as Record<string, unknown>)?.email as string})
        </span>
      );
    case "USER_UPDATED":
      return (
        <span>Updated: {next ? Object.keys(next).join(", ") : "unknown"}</span>
      );
    case "USER_DELETED":
      return (
        <span>
          Deleted user:{" "}
          <strong>{(prev as Record<string, unknown>)?.name as string}</strong> (
          {(prev as Record<string, unknown>)?.email as string})
        </span>
      );
    default:
      return <span>{log.action}</span>;
  }
}
