/**
 * Centralized extraction prompts for role and skill extraction endpoints.
 */

/**
 * Role extraction prompt template.
 * Placeholders: {{transcript}}, {{identity_core}}
 */
export const ROLE_EXTRACTION_PROMPT = `Extract a role configuration and 2-4 starter skills from this interview.

INTERVIEW:
{{transcript}}

IDENTITY CORE (base personality):
{{identity_core}}

---

Output valid JSON (no markdown) with this structure:

{
  "role": {
    "name": "Catchy name, max 50 chars",
    "description": "1-2 sentences, max 200 chars",
    "instructions": "2-4 paragraphs: purpose, behaviors, edge cases",
    "identity_facets": {
      "tone_adjustment": "How this role modifies style, or null",
      "priority_override": ["elevated priorities"],
      "special_behaviors": ["role-specific behaviors"]
    },
    "approval_policy": "smart"
  },
  "skills": [
    {
      "name": "Action name, max 50 chars",
      "description": "What it does, max 150 chars",
      "prompt_template": "Prompt with {{placeholders}}",
      "input_schema": { "type": "object", "properties": {...}, "required": [...] },
      "examples": [{ "input": {...}, "expected_output": "..." }]
    }
  ]
}

GUIDELINES:
- Skills should be immediately useful for the role's purpose
- Use identity core voice in prompt templates
- Include clear {{placeholders}} like {{recipient}}, {{topic}}
- Only require essential input fields`

/**
 * Skill extraction prompt builder.
 * Used by the skills/extract endpoint.
 */
export function buildSkillExtractionPrompt(
  transcript: string,
  mode: 'create' | 'edit',
  existingSkillContext?: string
): string {
  const modeContext =
    mode === 'edit' && existingSkillContext
      ? `You are updating an existing skill. Here is the current definition:

${existingSkillContext}

Based on the conversation, update the skill with the requested changes. Preserve fields that weren't discussed unless they conflict with the changes.`
      : `You are creating a new skill from scratch based on the conversation.`

  return `You are extracting a structured skill definition from a conversation between a user and Forge (a skill designer AI).

${modeContext}

<interview_transcript>
${transcript}
</interview_transcript>

Based on this conversation, extract a complete skill definition. Include:
1. A clear, action-oriented name
2. A short description (~50 chars) for quick reference
3. A full description explaining what the skill does
4. A prompt template with {{placeholders}} for any inputs
5. Detailed instructions for how to execute the skill well
6. Any tools the skill should use (web_search, web_fetch, or MCP tools mentioned)
7. At least one example input/output pair

For the prompt_template:
- Use {{placeholder_name}} syntax for inputs
- Make it specific and actionable
- Include context about expected output format

For examples:
- Provide realistic input/output pairs
- Show what a successful execution looks like

Use the extract_skill tool to provide the structured output.`
}
