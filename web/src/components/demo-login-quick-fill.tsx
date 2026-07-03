'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DEMO_LOGIN_PRESETS, DEMO_SEED_PASSWORD } from '@/lib/demo-seed-logins'

interface DemoLoginQuickFillProps {
  onSelect: (email: string, password: string) => void
}

export function DemoLoginQuickFill({ onSelect }: DemoLoginQuickFillProps) {
  return (
    <Card className="border-border shadow-none">
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Ambiente de demonstração
            </p>
            <p className="text-sm font-medium text-foreground">Preenchimento rápido</p>
            <p className="text-xs text-muted-foreground">
              Contas de exemplo para explorar a interface.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {DEMO_LOGIN_PRESETS.map((preset) => (
              <Button
                key={preset.email}
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 w-full justify-start rounded-full font-normal"
                onClick={() => onSelect(preset.email, DEMO_SEED_PASSWORD)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
