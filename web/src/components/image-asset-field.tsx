'use client'

import { ImageIcon } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Aspect = 'square' | 'wide'

export interface ImageAssetFieldProps {
  /** URL GET pré assinada da imagem actual. `null` mostra placeholder. */
  currentUrl: string | null
  /** Forma do preview: quadrado (logo/avatar) ou largo (banner). */
  aspect?: Aspect
  /** MIME types aceites no input file (default JPEG/PNG/WebP). */
  accept?: string[]
  /** Texto auxiliar abaixo dos botões (ex.: limites de tamanho). */
  hint?: string
  /** Texto alternativo da imagem (boa prática de a11y). */
  alt?: string
  /** Estado de upload em curso. */
  uploading?: boolean
  /** Estado de remoção em curso. */
  removing?: boolean
  /** Disparado quando o utilizador escolhe um ficheiro. */
  onUpload: (file: File) => void | Promise<void>
  /** Disparado quando o utilizador remove a imagem actual. */
  onRemove: () => void | Promise<void>
}

const DEFAULT_ACCEPT = ['image/jpeg', 'image/png', 'image/webp']

export function ImageAssetField({
  currentUrl,
  aspect = 'square',
  accept = DEFAULT_ACCEPT,
  hint,
  alt,
  uploading = false,
  removing = false,
  onUpload,
  onRemove,
}: ImageAssetFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const busy = uploading || removing

  const previewSize = aspect === 'square' ? 'size-28 rounded-xl' : 'h-28 w-full max-w-xs rounded-xl'

  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center">
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden border bg-muted text-muted-foreground',
          previewSize,
        )}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt={alt ?? ''} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="size-8 opacity-60" aria-hidden />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void onUpload(file)
        }}
      />

      <div className="flex flex-col items-center gap-2 lg:items-start">
        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'A enviar…' : currentUrl ? 'Atualizar' : 'Enviar imagem'}
          </Button>
          {currentUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void onRemove()}
            >
              {removing ? 'A remover…' : 'Remover'}
            </Button>
          )}
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}
