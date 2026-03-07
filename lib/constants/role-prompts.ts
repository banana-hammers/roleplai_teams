/**
 * AI Role Creation System Prompts
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
