import { DEMO_LOGIN_CREDENTIALS, DEMO_SEED_PASSWORD } from '@/lib/demo-seed-credentials'
import { IS_DEMO } from '@/lib/env'

export function DemoLoginCredentials() {
  if (!IS_DEMO) {
    return null
  }

  return (
    <section
      className="rounded-lg border border-amber-900/20 bg-amber-500/10 px-3 py-3 text-sm dark:border-amber-300/20 dark:bg-amber-600/10"
      aria-labelledby="demo-login-heading"
    >
      <p id="demo-login-heading" className="font-medium text-amber-950 dark:text-amber-50">
        Logins de demonstração
      </p>
      <p className="mt-1 text-xs text-amber-950/80 dark:text-amber-50/80">
        Senha para todas as contas:{' '}
        <span className="font-mono font-medium text-amber-950 dark:text-amber-50">
          {DEMO_SEED_PASSWORD}
        </span>
      </p>
      <ul className="mt-3 space-y-2.5">
        {DEMO_LOGIN_CREDENTIALS.map((entry) => (
          <li
            key={entry.role}
            className="border-t border-amber-900/15 pt-2.5 first:border-0 first:pt-0 dark:border-amber-300/15"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-100/70">
              {entry.label}
            </p>
            <p className="mt-0.5 font-mono text-xs text-amber-950 dark:text-amber-50">
              {entry.email}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
