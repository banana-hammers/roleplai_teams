'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CLAUDE_MODELS, modelTierConfigs, type ModelTier } from '@/lib/utils/model-tiers'

interface ModelSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent>
        {CLAUDE_MODELS.map((model) => {
          const tierConfig = modelTierConfigs[model.tier as ModelTier]
          const TierIcon = tierConfig.icon

          return (
            <SelectItem key={model.value} value={model.value}>
              <div className="flex items-center gap-2">
                <TierIcon className={`h-4 w-4 ${tierConfig.colorClass}`} />
                <span>{model.label}</span>
                <span className={`text-xs ${tierConfig.colorClass}`}>
                  {tierConfig.label}
                </span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
