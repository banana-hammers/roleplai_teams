# Skills System

Skills are functions that roles can execute, linked via the `role_skills` junction table.

## Progressive Disclosure Architecture (3-level)

| Level | Field | Purpose | When Loaded |
|-------|-------|---------|-------------|
| 1 | `short_description` | Brief description (~50 chars) | System prompt (always) |
| 2 | `detailed_instructions` | Rich guidance for execution | When skill is invoked |
| 2 | `examples` | Input/output examples (JSONB) | When skill is invoked |
| 3 | `linked_lore_ids` | Related lore for context | When skill is invoked |

## Skill Creation

- Created during role creation (via Forge) or manually added
- Each skill has a `prompt_template` for execution
- Server actions in `app/actions/roles.ts` handle CRUD

## Execution

Located in `lib/skills/execute-skill.ts`:

```typescript
// Simple skill (no tools)
const result = await executeSkillSimple(skill, inputs, context)

// Agentic skill (with tools)
const result = await executeSkillWithTools(skill, inputs, context)
```

## Agentic Skills

Skills with `allowed_tools` array can call tools during execution:
- Built-in tools: `web_search`, `web_fetch`
- MCP tools: `mcp_{serverName}_{toolName}`
- Nested execution with max 5 iterations

## Related Files

- Execution: `lib/skills/execute-skill.ts`
- Tool conversion: `lib/skills/to-anthropic-tools.ts`
- Template utils: `lib/skills/template-utils.ts`
- System prompt: `lib/prompts/system-prompt-builder.ts`
