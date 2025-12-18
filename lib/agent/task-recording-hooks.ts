import { createClient } from '@/lib/supabase/server'

/**
 * Context for task recording hooks
 */
interface TaskContext {
  userId: string
  roleId: string
  conversationId?: string
}

/**
 * Task trace data structure
 */
interface TaskTrace {
  started_at: string
  completed_at?: string
  duration_ms?: number
  conversation_id?: string
  session_id?: string
  tool_name: string
  input_preview: string
  output_preview?: string
  token_usage?: {
    input_tokens: number
    output_tokens: number
    cache_read_tokens?: number
  }
  cost_usd?: number
  error?: string
  is_interrupt?: boolean
  approval_id?: string
  approval_status?: 'pending' | 'approved' | 'rejected'
}

/**
 * Truncate a string to a maximum length
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Map tool name to skill ID if applicable
 */
async function findSkillIdByToolName(
  toolName: string,
  roleId: string
): Promise<string | null> {
  const supabase = await createClient()

  // Try to find a skill that matches this tool name
  const { data } = await supabase
    .from('role_skills')
    .select(`
      skill_id,
      skills!inner (
        name
      )
    `)
    .eq('role_id', roleId)

  if (!data) return null

  // Match tool name to skill (tool names are sanitized versions of skill names)
  const sanitizedToolName = toolName.toLowerCase()
  for (const rs of data) {
    const skill = rs.skills as any
    if (skill?.name) {
      const sanitizedSkillName = skill.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')
      if (sanitizedSkillName === sanitizedToolName) {
        return rs.skill_id
      }
    }
  }

  return null
}

/**
 * Create task recording hooks for the Claude Agent SDK
 *
 * These hooks intercept tool calls to:
 * 1. Record task start in the database
 * 2. Update task completion with results
 * 3. Track audit trail via trace JSONB
 */
export function createTaskRecordingHooks(context: TaskContext) {
  // Map tool_use_id -> task.id for correlating pre/post hooks
  const taskMap = new Map<string, string>()
  // Track start times for duration calculation
  const startTimes = new Map<string, number>()

  /**
   * PreToolUse hook - called before each tool execution
   */
  const preToolUseHook = async (
    toolName: string,
    toolInput: Record<string, unknown>,
    toolUseId?: string
  ): Promise<void> => {
    const supabase = await createClient()
    const startTime = Date.now()

    // Find skill ID if this tool maps to a skill
    const skillId = await findSkillIdByToolName(toolName, context.roleId)

    // Create task record
    const trace: TaskTrace = {
      tool_name: toolName,
      started_at: new Date().toISOString(),
      conversation_id: context.conversationId,
      input_preview: truncate(JSON.stringify(toolInput), 500),
    }

    const { data: task } = await supabase
      .from('tasks')
      .insert({
        user_id: context.userId,
        role_id: context.roleId,
        skill_id: skillId,
        input: toolInput,
        status: 'running',
        trace,
      })
      .select('id')
      .single()

    if (task && toolUseId) {
      taskMap.set(toolUseId, task.id)
      startTimes.set(toolUseId, startTime)
    }
  }

  /**
   * PostToolUse hook - called after each tool execution
   */
  const postToolUseHook = async (
    toolName: string,
    toolResponse: unknown,
    toolUseId?: string,
    error?: Error
  ): Promise<void> => {
    if (!toolUseId) return

    const taskId = taskMap.get(toolUseId)
    if (!taskId) return

    const supabase = await createClient()
    const startTime = startTimes.get(toolUseId)
    const duration = startTime ? Date.now() - startTime : undefined

    // Build updated trace
    const trace: Partial<TaskTrace> = {
      completed_at: new Date().toISOString(),
      duration_ms: duration,
      output_preview: truncate(JSON.stringify(toolResponse), 500),
    }

    if (error) {
      trace.error = error.message
    }

    // Update task with result
    await supabase
      .from('tasks')
      .update({
        status: error ? 'failed' : 'completed',
        output: JSON.stringify(toolResponse),
        completed_at: new Date().toISOString(),
        trace,
      })
      .eq('id', taskId)

    // Clean up maps
    taskMap.delete(toolUseId)
    startTimes.delete(toolUseId)
  }

  /**
   * Create approval request for sensitive operations
   */
  const createApprovalRequest = async (
    taskId: string,
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<string> => {
    const supabase = await createClient()

    const { data: approval } = await supabase
      .from('task_approvals')
      .insert({
        task_id: taskId,
        action_type: toolName,
        proposed_action: toolInput,
        status: 'pending',
      })
      .select('id')
      .single()

    // Update task status to requires_approval
    await supabase
      .from('tasks')
      .update({
        status: 'requires_approval',
        trace: {
          approval_id: approval?.id,
          approval_status: 'pending',
        },
      })
      .eq('id', taskId)

    return approval?.id || ''
  }

  // Return hooks in SDK-compatible format
  // HookCallback is a direct function: (input, toolUseID, options) => Promise<HookJSONOutput>
  return {
    preToolUseHook,
    postToolUseHook,
    createApprovalRequest,
    // SDK hooks configuration
    hooks: {
      PreToolUse: [{
        hooks: [
          async (input: any, toolUseId: string | undefined) => {
            if (input.hook_event_name === 'PreToolUse') {
              await preToolUseHook(input.tool_name, input.tool_input as Record<string, unknown>, toolUseId)
            }
            return {}
          }
        ]
      }],
      PostToolUse: [{
        hooks: [
          async (input: any, toolUseId: string | undefined) => {
            if (input.hook_event_name === 'PostToolUse') {
              await postToolUseHook(input.tool_name, input.tool_response, toolUseId)
            }
            return {}
          }
        ]
      }]
    }
  }
}

/**
 * Get task history for a conversation
 */
export async function getTaskHistory(
  conversationId: string,
  limit = 50
): Promise<any[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('trace->>conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return data || []
}

/**
 * Get pending approvals for a user
 */
export async function getPendingApprovals(userId: string): Promise<any[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('task_approvals')
    .select(`
      *,
      tasks!inner (
        user_id,
        role_id,
        input,
        trace
      )
    `)
    .eq('status', 'pending')
    .eq('tasks.user_id', userId)
    .order('created_at', { ascending: false })

  return data || []
}

/**
 * Approve or reject a task approval request
 */
export async function resolveApproval(
  approvalId: string,
  status: 'approved' | 'rejected',
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  // Verify ownership via task
  const { data: approval } = await supabase
    .from('task_approvals')
    .select(`
      id,
      task_id,
      tasks!inner (
        user_id
      )
    `)
    .eq('id', approvalId)
    .single()

  if (!approval || (approval.tasks as any)?.user_id !== userId) {
    return false
  }

  // Update approval status
  await supabase
    .from('task_approvals')
    .update({
      status,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', approvalId)

  // Update task status based on approval
  await supabase
    .from('tasks')
    .update({
      status: status === 'approved' ? 'pending' : 'failed',
      trace: {
        approval_id: approvalId,
        approval_status: status,
        resolved_at: new Date().toISOString(),
      },
    })
    .eq('id', approval.task_id)

  return true
}
