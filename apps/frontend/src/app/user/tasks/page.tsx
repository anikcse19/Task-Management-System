"use client";

import { useState, useEffect, useCallback } from "react";
import { tasksApi, type Task } from "@/lib/api";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/badge";

export default function UserTasksPage() {
  return (
    <AuthGuard requiredRole="USER">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <MyTasksContent />
      </main>
    </AuthGuard>
  );
}

function MyTasksContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await tasksApi.getMyTasks();
      setTasks(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      loadTasks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tasks assigned to you ({tasks.length} total)
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks assigned to you yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Tasks will appear here when an admin assigns them to you.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {task.title}
                </h3>
                <StatusBadge status={task.status} />
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {task.description}
              </p>

              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Update Status
                </label>
                <Select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="DONE">DONE</option>
                </Select>
              </div>

              <div className="mt-3 text-xs text-gray-400">
                Created by {task.createdBy.name} •{" "}
                {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
