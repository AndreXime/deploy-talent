import { IS_DEMO } from '@/lib/env'

export function DemoEnvironmentBanner() {
  if (!IS_DEMO) {
    return null
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[100] w-full border-b border-amber-900/25 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950 shadow-sm dark:border-amber-300/25 dark:bg-amber-600 dark:text-amber-50"
    >
      Demonstração: os dados apresentados são fictícios e não correspondem a informações reais de
      empresas ou candidatos.
    </div>
  )
}
