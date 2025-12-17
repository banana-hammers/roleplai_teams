'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check } from 'lucide-react'
import type { ExtractedSkill } from '@/types/role-creation'

interface RoleSkillsPreviewProps {
  skills: ExtractedSkill[]
  selectedIndices: number[]
  onToggle: (index: number) => void
}

export function RoleSkillsPreview({ skills, selectedIndices, onToggle }: RoleSkillsPreviewProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Starter Skills</h3>
        <span className="text-sm text-muted-foreground">
          {selectedIndices.length} of {skills.length} selected
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Toggle to include skills your role can use. You can add more later.
      </p>

      <div className="space-y-2">
        {skills.map((skill, index) => {
          const isSelected = selectedIndices.includes(index)
          const isExpanded = expandedIndex === index

          return (
            <div
              key={index}
              className={`rounded-lg border transition-colors ${
                isSelected
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border bg-background'
              }`}
            >
              {/* Skill header */}
              <div className="flex items-center gap-3 p-3">
                {/* Checkbox */}
                <button
                  onClick={() => onToggle(index)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground/30 hover:border-primary'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </button>

                {/* Skill info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{skill.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {skill.description}
                  </p>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => toggleExpand(index)}
                  className="p-1 rounded hover:bg-muted"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t pt-3 space-y-3">
                  {/* Prompt template */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Prompt Template
                    </span>
                    <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                      {skill.prompt_template}
                    </pre>
                  </div>

                  {/* Input schema */}
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Required Inputs
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(skill.input_schema.properties || {}).map(([key, value]) => (
                        <span
                          key={key}
                          className="text-xs px-2 py-0.5 rounded bg-muted border"
                          title={(value as { description?: string }).description}
                        >
                          {key}
                          {skill.input_schema.required?.includes(key) && (
                            <span className="text-destructive ml-0.5">*</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Example */}
                  {skill.examples && skill.examples.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Example Output
                      </span>
                      <p className="text-xs text-muted-foreground italic">
                        {skill.examples[0].expected_output.slice(0, 150)}
                        {skill.examples[0].expected_output.length > 150 && '...'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedIndices.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Select at least one skill to continue.
        </p>
      )}
    </div>
  )
}
