import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Cpu,
  Filter,
  GitBranch,
  Layers,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import Link from 'next/link'
import { HomeFeaturedJobs } from '@/components/home-featured-jobs'
import { HomeSessionRedirect } from '@/components/home-session-redirect'
import { PublicHeader } from '@/components/public-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <HomeSessionRedirect />
      <PublicHeader />

      <main className="flex flex-1 flex-col">
        <section
          id="hero"
          className="relative scroll-mt-28 overflow-hidden border-b border-border/60 px-4 py-16 lg:py-24"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-15%,var(--color-primary)/0.08,transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="max-w-2xl flex-1">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Deploy Talent
              </p>
              <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                Talento de elite para quem leva engenharia de software a sério.
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Filtros por stack (TypeScript, Rust, Go…), senioridade e impacto arquitetural — para
                cortar o ruído de processos genéricos e alinhar expectativas técnicas antes da
                primeira entrevista.
              </p>
              <div className="mt-10 flex flex-col gap-3 lg:max-w-none lg:flex-row lg:flex-wrap lg:items-center">
                <Button
                  size="lg"
                  className="h-12 w-full gap-2 px-6 text-base font-semibold shadow-sm lg:w-auto lg:min-w-[240px]"
                  asChild
                >
                  <Link href="/vagas">
                    Encontrar minha próxima stack
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full border-border/80 bg-background/60 px-6 text-base font-semibold backdrop-blur-sm lg:w-auto lg:min-w-[220px]"
                  asChild
                >
                  <Link href="/entrar">Anunciar vaga técnica</Link>
                </Button>
              </div>
            </div>
            <aside
              aria-label="Critérios de curadoria"
              className="w-full shrink-0 rounded-2xl border border-border/80 bg-card/50 p-6 text-sm shadow-sm ring-1 ring-foreground/5 backdrop-blur-sm lg:max-w-md"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Curadoria em três eixos
              </p>
              <p className="mt-2 text-base font-semibold tracking-tight text-foreground">
                Menos ruído, mais overlap real com o que vocês fazem em produção.
              </p>
              <ul className="mt-6 space-y-5 border-t border-border/60 pt-6">
                <li className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Filter className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Stack e toolchain</p>
                    <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                      Linguagens, frameworks e infraestrutura visíveis antes de investir tempo no
                      processo.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Layers className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      Senioridade e impacto arquitetural
                    </p>
                    <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                      Nível alinhado ao ownership e à complexidade do sistema — não só ao título no
                      LinkedIn.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BadgeCheck className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">Cultura de engenharia</p>
                    <p className="mt-0.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                      Sinal verificável sobre práticas de equipe: reviews, qualidade e transparência
                      de engenharia.
                    </p>
                  </div>
                </li>
              </ul>
            </aside>
          </div>
        </section>

        <section
          id="diferenciais"
          className="scroll-mt-28 border-b border-border/60 bg-muted/20 px-4 py-20 lg:py-24"
        >
          <div className="mx-auto max-w-6xl lg:px-0">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                Diferenciais
              </h2>
              <p className="mt-2 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Menos buzzword. Mais sinal técnico.
              </p>
              <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground">
                Bento com o que importa para decidir se a vaga merece o seu tempo: stack explícita,
                integrações e transparência de cultura de engenharia.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
              <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm ring-1 ring-foreground/5 lg:col-span-7 lg:row-span-2 lg:p-8">
                <div>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Filter className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                    Filtros por tecnologia — não por &quot;full-stack genérico&quot;
                  </h3>
                  <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                    TypeScript, Rust, Go e o resto da sua stack entram como critério de primeira
                    classe. Menos descrições vagas; mais overlap real com o runtime e o toolchain
                    que vocês usam em produção.
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-2">
                  {['TypeScript', 'Rust', 'Go', 'Node.js', 'PostgreSQL'].map((tag) => (
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

              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm ring-1 ring-foreground/5 lg:col-span-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <GitBranch className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                  Integração com o ecossistema de desenvolvimento
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  CI/CD, observabilidade, contratos de API e IaC aparecem no contexto da vaga — para
                  avaliar se o time opera num stack escalável, não só num repositório bonito.
                </p>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm ring-1 ring-foreground/5 lg:col-span-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="size-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                  Tech stack da empresa — transparente
                </h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  Linguagens, frameworks e limites arquiteturais visíveis antes de investir tempo no
                  processo. Otimize a sua curadoria como otimizaria um deploy: com dados, não com
                  suposições.
                </p>
              </div>

              <div className="flex flex-col justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/5 p-6 lg:col-span-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
                <div className="flex items-start gap-3">
                  <Workflow className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="font-semibold text-foreground">
                      Pipeline de contratação alinhado a engenharia
                    </p>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      Menos etapas decorativas; mais sinal sobre ownership, revisão de código e
                      impacto em produção — para candidatos e hiring managers falarem a mesma
                      linguagem desde o início.
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="mt-6 w-full shrink-0 lg:mt-0 lg:w-auto"
                  asChild
                >
                  <Link href="/vagas">Explorar vagas indexadas</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <HomeFeaturedJobs />

        <section
          id="metricas"
          className="scroll-mt-28 border-y border-border/60 bg-muted/15 px-4 py-20 lg:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Social proof
            </h2>
            <p className="mt-2 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Times que tratam recrutamento como sistema distribuído
            </p>
            <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
              Espaço reservado para marcas que publicam vagas com stack honesta e revisão técnica no
              processo — métricas abaixo ilustram o tipo de sinal que o portal prioriza.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-border/80 bg-card p-6 ring-1 ring-foreground/5">
                <Cpu className="size-5 text-primary" aria-hidden />
                <p className="mt-4 font-mono text-3xl font-semibold tracking-tight text-foreground">
                  4,2 d
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Tempo médio para deploy de nova vaga
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Da submissão à publicação indexada — alvo operacional para times ágeis.
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card p-6 ring-1 ring-foreground/5">
                <Boxes className="size-5 text-primary" aria-hidden />
                <p className="mt-4 font-mono text-3xl font-semibold tracking-tight text-foreground">
                  91%
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Taxa de match técnico declarada
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Candidatos com overlap de stack ≥ 70% face ao JD estruturado.
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card p-6 ring-1 ring-foreground/5">
                <ShieldCheck className="size-5 text-primary" aria-hidden />
                <p className="mt-4 font-mono text-3xl font-semibold tracking-tight text-foreground">
                  38
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  Empresas com cultura técnica verificada
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Badge opcional após checklist de práticas de engenharia.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer
          id="newsletter"
          className="scroll-mt-28 border-t border-border/80 bg-card/30 px-4 pt-16 lg:scroll-mt-24 pb-6"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Deploy Talent
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                Footer técnico
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Links operacionais, redes e curadoria semanal — sem fluff de RH.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:col-span-7 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Produto
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <Link href="/vagas" className="text-foreground hover:underline">
                      Índice de vagas
                    </Link>
                  </li>
                  <li>
                    <Link href="/registo" className="text-foreground hover:underline">
                      Registo candidato
                    </Link>
                  </li>
                  <li>
                    <Link href="/entrar" className="text-foreground hover:underline">
                      Área empresa / recrutamento
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Redes
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <a
                      href="https://www.linkedin.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      LinkedIn
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://x.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline"
                    >
                      X / Twitter
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-6xl border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Deploy Talent. Stack escalável começa no primeiro contato.
          </div>
        </footer>
      </main>
    </div>
  )
}
