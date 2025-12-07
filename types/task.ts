export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'requires_approval'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Task {
  id: string
  user_id: string
  role_id: string
  skill_id: string | null
  input: Record<string, any>
  output: string | null
  status: TaskStatus
  trace: Record<string, any>
  created_at: string
  completed_at: string | null
}

export interface TaskApproval {
  id: string
  task_id: string
  action_type: string
  proposed_action: Record<string, any>
  status: ApprovalStatus
  created_at: string
  resolved_at: string | null
}
