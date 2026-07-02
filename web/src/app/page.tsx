import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Filter,
  GitBranch,
  Layers,
  MapPin,
  MonitorSmartphone,
  Workflow,
} from 'lucide-react'
import Link from 'next/link'
import { HomeFeaturedJobs } from '@/components/home-featured-jobs'
import { PublicHeader } from '@/components/public-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const heroCuratoria = [
  {
    icon: Filter,
    title: 'Stack e toolchain',
    description:
      'Linguagens, frameworks e infraestrutura visíveis antes de investir tempo no processo.',
  },
  {
    icon: Layers,
    title: 'Senioridade e impacto',
    description:
      'Nível alinhado ao ownership e à complexidade do sistema, não só ao título no perfil.',
  },
  {
    icon: BadgeCheck,
    title: 'Cultura de engenharia',
    description: 'Sinal sobre reviews, qualidade e transparência técnica desde a ficha da vaga.',
  },
] as const

const discoverySurfaces = [
  {
    href: '/vagas?seniority=Senior',
    icon: Layers,
    title: 'Por senioridade',
    description: 'Junior a staff. Filtre pelo nível de ownership que procura.',
  },
  {
    href: '/vagas?q=TypeScript',
    icon: Filter,
    title: 'Por stack',
    description: 'TypeScript, Rust, Go e o resto da toolchain como critério de primeira classe.',
  },
  {
    href: '/vagas?modality=Remoto',
    icon: MonitorSmartphone,
    title: 'Por modalidade',
    description: 'Remoto, híbrido ou presencial, antes de investir tempo no processo.',
  },
  {
    href: '/vagas',
    icon: MapPin,
    title: 'Por local',
    description: 'Cidade e região indexadas no explorador público.',
  },
] as const

const capabilities = [
  {
    icon: Filter,
    title: 'Filtros estruturados',
    description:
      'Stack, senioridade, modalidade e empresa, sem descrições vagas de full-stack genérico.',
  },
  {
    icon: GitBranch,
    title: 'Multi-tenant',
    description: 'Cada empresa com página de carreiras, vagas e pipeline próprios.',
  },
  {
    icon: Workflow,
    title: 'Pipeline configurável',
    description: 'Etapas de contratação alinhadas ao processo de engenharia do time.',
  },
  {
    icon: Building2,
    title: 'Área empresa',
    description: 'Publicar, pausar e gerir candidaturas num único painel.',
  },
] as const

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="flex flex-1 flex-col">
        <section
          id="hero"
          className="relative scroll-mt-28 overflow-hidden border-b border-border py-16 lg:py-24"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--color-primary)/0.12,transparent)]"
            aria-hidden
          />
          <div className="page-container relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="min-w-0 max-w-2xl flex-1">
              <h1 className="text-balance text-[length:var(--text-display)] font-semibold leading-[1.05] tracking-tight">
                Vagas técnicas, indexadas de verdade.
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Marketplace multi-tenant para candidatos e recrutadores que preferem stack
                explícita, senioridade honesta e pipeline configurável, sem ruído de RH genérico.
              </p>
              <div className="mt-10 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                <Button
                  size="lg"
                  className="h-12 min-h-11 w-full gap-2 rounded-full px-6 text-base font-semibold lg:w-auto"
                  asChild
                >
                  <Link href="/vagas">
                    Explorar vagas
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 min-h-11 w-full rounded-full px-6 text-base font-semibold lg:w-auto"
                  asChild
                >
                  <Link href="/entrar">Publicar vaga</Link>
                </Button>
              </div>
            </div>

            <aside
              aria-label="Critérios de curadoria"
              className="w-full min-w-0 shrink-0 lg:max-w-md"
            >
              <div className="rounded-xl border border-border bg-card/90 p-6 shadow-sm ring-1 ring-foreground/5 backdrop-blur-sm">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  Curadoria em três eixos
                </h2>
                <p className="mt-2 text-pretty text-sm text-muted-foreground">
                  Menos ruído, mais overlap real com o que cada time faz em produção.
                </p>
                <ul className="mt-6 space-y-5 border-t border-border pt-6">
                  {heroCuratoria.map(({ icon: Icon, title, description }) => (
                    <li key={title} className="flex min-w-0 gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{title}</p>
                        <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-5">
                  {['TypeScript', 'Rust', 'Go'].map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="font-mono text-[11px] font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section
          id="indice"
          className="scroll-mt-28 border-b border-border bg-muted/30 py-16 lg:py-20"
        >
          <div className="page-container">
            <div className="section-head max-w-2xl">
              <h2 className="text-balance text-[length:var(--text-display-s)] font-semibold tracking-tight">
                Quatro formas de entrar no índice
              </h2>
              <p className="text-pretty text-muted-foreground">
                O valor da plataforma é a descoberta, não um hero decorativo. Escolha por onde
                começar.
              </p>
            </div>

            <ul className="mt-12 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
              {discoverySurfaces.map(({ href, icon: Icon, title, description }) => (
                <li key={href} className="min-w-0">
                  <Link
                    href={href}
                    className="hover-lift flex h-full min-h-[11rem] flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-2 flex-1 text-pretty text-sm text-muted-foreground">
                      {description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Abrir
                      <ArrowRight className="size-3.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-2">
              {['TypeScript', 'Rust', 'Go', 'PostgreSQL', 'Kubernetes'].map((tag) => (
                <Badge key={tag} variant="secondary" className="font-mono text-[11px] font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <HomeFeaturedJobs />

        <section id="capacidades" className="scroll-mt-28 border-y border-border py-16 lg:py-20">
          <div className="page-container">
            <div className="section-head max-w-2xl">
              <h2 className="text-balance text-[length:var(--text-display-s)] font-semibold tracking-tight">
                O que a plataforma faz
              </h2>
              <p className="text-pretty text-muted-foreground">
                Capacidades reais do produto, sem métricas inventadas.
              </p>
            </div>

            <ul className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="flex min-w-0 gap-4 rounded-xl border border-border bg-card p-6"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-pretty text-sm text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-border bg-primary/5 py-16 lg:py-20">
          <div className="page-container flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-xl">
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Pronto para indexar a sua próxima vaga?
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">
                Crie conta como candidato ou entre na área empresa para publicar.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <Button size="lg" className="min-h-11 w-full rounded-full sm:w-auto" asChild>
                <Link href="/cadastro">Criar conta candidato</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-11 w-full rounded-full sm:w-auto"
                asChild
              >
                <Link href="/entrar">Área empresa</Link>
              </Button>
            </div>
          </div>
        </section>

        <footer id="footer" className="scroll-mt-28 py-12 lg:py-16">
          <div className="page-container flex flex-col gap-10">
            <div className="flex flex-col gap-6 border-b border-border pb-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 max-w-lg">
                <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Deploy Talent. Recrutamento técnico sem ruído.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Índice público, carreiras por empresa e pipeline configurável.
                </p>
              </div>
              <nav
                className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-x-6"
                aria-label="Rodapé"
              >
                <Link
                  href="/vagas"
                  className="min-h-11 inline-flex items-center hover:text-primary"
                >
                  Explorar vagas
                </Link>
                <Link
                  href="/cadastro"
                  className="min-h-11 inline-flex items-center hover:text-primary"
                >
                  Cadastro
                </Link>
                <Link
                  href="/entrar"
                  className="min-h-11 inline-flex items-center hover:text-primary"
                >
                  Entrar
                </Link>
              </nav>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Deploy Talent
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
