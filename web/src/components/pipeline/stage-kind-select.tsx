'use client'

import { type ReactNode, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PipelineStageKind } from '@/lib/api/types'

const KIND_OPTIONS: ReadonlyArray<{ value: PipelineStageKind; label: string }> = [
  { value: 'MANUAL', label: 'Manual (só recrutador)' },
  { value: 'QUESTIONNAIRE', label: 'Questionário' },
  { value: 'INTERVIEW_LINK', label: 'Entrevista (link)' },
  { value: 'FILE_UPLOAD', label: 'Envio de arquivo' },
]

interface StageKindSelectProps {
  id: string
  value: PipelineStageKind
  disabled?: boolean
  onChange: (kind: PipelineStageKind) => void
}

export function StageKindSelect({ id, value, disabled, onChange }: StageKindSelectProps) {
  const items = useMemo(() => {
    const rec: Record<string, ReactNode> = {}
    for (const opt of KIND_OPTIONS) {
      rec[opt.value] = opt.label
    }
    return rec
  }, [])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Tipo</Label>
      <Select
        value={value}
        items={items}
        disabled={disabled}
        onValueChange={(v) => {
          if (v == null) return
          onChange(v as PipelineStageKind)
        }}
      >
        <SelectTrigger id={id} size="default" className="h-10 w-full min-w-0 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {KIND_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
