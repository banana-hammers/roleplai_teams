'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Check, Wrench, Cpu } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AVAILABLE_MODELS, modelTierConfigs } from '@/lib/utils/model-tiers'

// Available built-in tools that skills can use
const AVAILABLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', description: 'Search the web for information' },
  { id: 'web_fetch', name: 'Web Fetch', description: 'Fetch and parse web page content' },
]

export interface SkillFormValues {
  name: string
  description: string
  prompt_template: string
  short_description: string
  detailed_instructions: string
  allowed_tools: string[]
  model_preference: string | null
}

interface SkillFormFieldsProps {
  values: SkillFormValues
  onChange: (values: SkillFormValues) => void
  idPrefix: string
  onToggleTool: (toolId: string) => void
}

export function SkillFormFields({ values, onChange, idPrefix, onToggleTool }: SkillFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name *</Label>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(e) => onChange({ ...values, name: e.target.value })}
          placeholder="e.g., Draft Email, Review Code"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-short-desc`}>Short Description (for system prompt)</Label>
        <Input
          id={`${idPrefix}-short-desc`}
          value={values.short_description}
          onChange={(e) => onChange({ ...values, short_description: e.target.value })}
          placeholder="~50 chars: Concise description shown to the AI"
          maxLength={100}
        />
        <p className="text-xs text-muted-foreground">
          Brief description that appears in the system prompt. Keep it short.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Full Description *</Label>
        <Input
          id={`${idPrefix}-description`}
          value={values.description}
          onChange={(e) => onChange({ ...values, description: e.target.value })}
          placeholder="Complete description of what this skill does"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-prompt`}>Prompt Template *</Label>
        <Textarea
          id={`${idPrefix}-prompt`}
          value={values.prompt_template}
          onChange={(e) => onChange({ ...values, prompt_template: e.target.value })}
          placeholder="The task template. Use {{placeholder}} for inputs."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-instructions`}>Detailed Instructions</Label>
        <Textarea
          id={`${idPrefix}-instructions`}
          value={values.detailed_instructions}
          onChange={(e) => onChange({ ...values, detailed_instructions: e.target.value })}
          placeholder="Detailed guidance loaded when this skill is invoked..."
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Rich instructions loaded only when the skill is used (not in system prompt).
        </p>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Allowed Tools
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          Enable tools this skill can use. Skills with tools run in agentic mode.
        </p>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <Badge
              key={tool.id}
              variant={values.allowed_tools.includes(tool.id) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => onToggleTool(tool.id)}
            >
              {values.allowed_tools.includes(tool.id) && <Check className="mr-1 h-3 w-3" />}
              {tool.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Model Override
        </Label>
        <Select
          value={values.model_preference || '__inherit__'}
          onValueChange={(value) => onChange({ ...values, model_preference: value === '__inherit__' ? null : value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Use role's model (default)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__inherit__">Use role&apos;s model (default)</SelectItem>
            {AVAILABLE_MODELS.map((model) => {
              const tierConfig = modelTierConfigs[model.tier]
              return (
                <SelectItem key={model.value} value={model.value}>
                  <span className="flex items-center gap-2">
                    <span className={tierConfig.colorClass}>{model.label}</span>
                    <span className="text-xs text-muted-foreground">({tierConfig.label})</span>
                  </span>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Override the role&apos;s model for this skill. Useful for complex skills that need more capable models.
        </p>
      </div>
    </>
  )
}
