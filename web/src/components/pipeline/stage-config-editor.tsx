'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
  FileUploadConfig,
  InterviewLinkConfig,
  PipelineStageKind,
  QuestionnaireConfig,
  QuestionnaireQuestion,
} from '@/lib/api/types'

interface Props {
  kind: PipelineStageKind
  config: Record<string, unknown>
  disabled?: boolean
  onChange: (config: Record<string, unknown>) => void
}

export function StageConfigEditor({ kind, config, disabled, onChange }: Props) {
  switch (kind) {
    case 'MANUAL':
      return (
        <p className="text-sm text-muted-foreground">
          Etapa sem acção do candidato. O recrutador avança manualmente quando estiver pronta.
        </p>
      )
    case 'INTERVIEW_LINK':
      return (
        <InterviewLinkEditor
          config={config as InterviewLinkConfig}
          disabled={disabled}
          onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
        />
      )
    case 'FILE_UPLOAD':
      return (
        <FileUploadEditor
          config={config as FileUploadConfig}
          disabled={disabled}
          onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
        />
      )
    case 'QUESTIONNAIRE':
      return (
        <QuestionnaireEditor
          config={(config as unknown as QuestionnaireConfig) ?? { questions: [] }}
          disabled={disabled}
          onChange={(c) => onChange(c as unknown as Record<string, unknown>)}
        />
      )
  }
}

function InterviewLinkEditor({
  config,
  disabled,
  onChange,
}: {
  config: InterviewLinkConfig
  disabled?: boolean
  onChange: (c: InterviewLinkConfig) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="instructions">Instruções (visível ao candidato)</Label>
      <Textarea
        id="instructions"
        rows={3}
        value={config.instructions ?? ''}
        disabled={disabled}
        onChange={(e) => onChange({ ...config, instructions: e.target.value })}
        placeholder="Ex: A entrevista é com a equipa técnica. Traz portfolio."
      />
      <p className="text-xs text-muted-foreground">
        O URL e a data são definidos depois pelo recrutador, candidatura a candidatura.
      </p>
    </div>
  )
}

function FileUploadEditor({
  config,
  disabled,
  onChange,
}: {
  config: FileUploadConfig
  disabled?: boolean
  onChange: (c: FileUploadConfig) => void
}) {
  return (
    <div className="grid gap-3">
      <div className="space-y-2">
        <Label htmlFor="upload_instructions">Instruções</Label>
        <Textarea
          id="upload_instructions"
          rows={2}
          value={config.instructions ?? ''}
          disabled={disabled}
          onChange={(e) => onChange({ ...config, instructions: e.target.value })}
          placeholder="Ex: Envia um portfolio ou prova técnica em PDF."
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Tipos e tamanho máximo do ficheiro são definidos pela plataforma (PDF, DOCX, PNG, JPG, TXT;
        limite efectivo conforme configuração do servidor).
      </p>
    </div>
  )
}

function QuestionnaireEditor({
  config,
  disabled,
  onChange,
}: {
  config: QuestionnaireConfig
  disabled?: boolean
  onChange: (c: QuestionnaireConfig) => void
}) {
  const questions = config.questions ?? []

  const update = (id: string, partial: Partial<QuestionnaireQuestion>) =>
    onChange({
      questions: questions.map((q) => (q.id === id ? { ...q, ...partial } : q)),
    })

  const remove = (id: string) => onChange({ questions: questions.filter((q) => q.id !== id) })

  const add = () =>
    onChange({
      questions: [
        ...questions,
        {
          id: crypto.randomUUID(),
          label: '',
          type: 'TEXT_SHORT',
          required: true,
        },
      ],
    })

  return (
    <div className="flex flex-col gap-3">
      {questions.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Adicione perguntas que o candidato deverá responder nesta etapa.
        </p>
      )}
      {questions.map((q, idx) => (
        <div key={q.id} className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Label>Pergunta {idx + 1}</Label>
              <Input
                value={q.label}
                disabled={disabled}
                onChange={(e) => update(q.id, { label: e.target.value })}
                placeholder="Ex: Qual a sua experiência com TypeScript?"
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <select
                    value={q.type}
                    disabled={disabled}
                    onChange={(e) =>
                      update(q.id, {
                        type: e.target.value as QuestionnaireQuestion['type'],
                        options:
                          e.target.value === 'SINGLE_CHOICE' ? (q.options ?? ['', '']) : undefined,
                      })
                    }
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="TEXT_SHORT">Texto curto</option>
                    <option value="TEXT_LONG">Texto longo</option>
                    <option value="SINGLE_CHOICE">Escolha única</option>
                  </select>
                </div>
                <label className="flex items-end gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={q.required}
                    disabled={disabled}
                    onChange={(e) => update(q.id, { required: e.target.checked })}
                  />
                  Obrigatória
                </label>
              </div>
              {q.type === 'SINGLE_CHOICE' && (
                <div className="space-y-1">
                  <Label className="text-xs">Opções (uma por linha)</Label>
                  <Textarea
                    rows={3}
                    value={(q.options ?? []).join('\n')}
                    disabled={disabled}
                    onChange={(e) =>
                      update(q.id, {
                        options: e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              )}
            </div>
            {!disabled && (
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => remove(q.id)}
                aria-label="Remover pergunta"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}
      {!disabled && (
        <Button variant="outline" type="button" onClick={add} className="w-fit gap-2">
          <Plus className="size-4" /> Adicionar pergunta
        </Button>
      )}
    </div>
  )
}
