-- Remove Task System
-- This migration removes the unused tasks and task_approvals tables

-- Drop indexes first
DROP INDEX IF EXISTS idx_tasks_user_id;
DROP INDEX IF EXISTS idx_tasks_status;

-- Drop task_approvals table (has FK to tasks)
DROP TABLE IF EXISTS task_approvals;

-- Drop tasks table
DROP TABLE IF EXISTS tasks;

-- Drop enums
DROP TYPE IF EXISTS approval_status;
DROP TYPE IF EXISTS task_status;
