-- Decouple audit_logs from tasks: remove FK constraint so deleting a task
-- does NOT cascade-delete its audit trail.  Add entityTitle column so each
-- log entry is self-contained.

-- 1. Drop the foreign key from audit_logs → tasks
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_entityId_fkey";

-- 2. Add entityTitle column (stores the task title at the time of the action)
ALTER TABLE "audit_logs" ADD COLUMN "entityTitle" TEXT NOT NULL DEFAULT '';
