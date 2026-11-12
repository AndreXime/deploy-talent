import {
  ArrowRight,
  Building2,
  Code2,
  Database,
  Handshake,
  Lightbulb,
  type LucideIcon,
  Server,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { HomeFeaturedJobs } from '@/components/home-featured-jobs'
import { PublicHeader } from '@/components/public-header'
import { Button } from '@/components/ui/button'

const areaLinks: ReadonlyArray<{
  href: string
  title: string
  description: string
  imageSrc: string
  imageAlt: string
  icon: LucideIcon
}> = [
  {
    href: '/vagas?q=Desenvolvimento',
    title: 'Desenvolvimento',
    description:
      'Para quem ama criar, codificar e resolver problemas. De front a back, mobile e full stack.',
    imageSrc: '/images/area-dev.jpg',
    imageAlt: 'Notebook com código em uma mesa de trabalho',
    icon: Code2,
  },
  {
    href: '/vagas?q=Dados',
    title: 'Dados',
    description:
      'Para mentes curiosas que transformam números em insights e ajudam decisões estratégicas.',
    imageSrc: '/images/area-dados.jpg',
    imageAlt: 'Painel de dados e gráficos em um notebook',
    icon: Database,
  },
  {
    href: '/vagas?q=Infraestrutura',
    title: 'Infraestrutura',
    description:
      'Para quem garante performance, segurança e escalabilidade nos bastidores da tecnologia.',
    imageSrc: '/images/area-infra.jpg',
    imageAlt: 'Ilustração de servidores e nuvem com segurança',
    icon: Server,
  },
  {
    href: '/vagas?q=Produto',
    title: 'Produto e design',
    description:
      'Para quem pesquisa, idealiza, prototipa e cria experiências que fazem sentido para as pessoas.',
    imageSrc: '/images/area-produto.jpg',
    imageAlt: 'Tablet com protótipo de aplicativo em uma mesa',
    icon: Lightbulb,
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <PublicHeader />

      <main className="flex flex-1 flex-col">
        <section
          id="hero"
          className="relative scroll-mt-28 min-h-[min(100dvh,42rem)] overflow-hidden border-b border-border"
        >
          <Image
            src="/images/hero-office.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,oklch(96.8%_0.006_85/0.94)_0%,oklch(96.8%_0.006_85/0.82)_42%,oklch(96.8%_0.006_85/0.45)_68%,oklch(96.8%_0.006_85/0.22)_100%)]"
            aria-hidden
          />
          <div className="page-container relative flex min-h-[min(100dvh,42rem)] flex-col justify-end gap-8 py-16 lg:justify-end lg:pb-24 lg:pt-28">
            <div className="min-w-0 max-w-2xl">
              <h1 className="text-balance text-(length:--text-display) font-semibold leading-[1.05] tracking-tight text-foreground">
                Sua próxima vaga de TI começa aqui.
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-foreground/80 sm:text-lg">
                Explore oportunidades em tecnologia, candidate-se com um único perfil e acompanhe
                cada etapa do processo.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Button
                  size="lg"
                  className="h-12 min-h-11 w-full gap-2 rounded-full px-6 text-base font-semibold sm:w-auto"
                  asChild
                >
                  <Link href="/vagas">
                    Ver vagas
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 min-h-11 w-full rounded-full border-foreground/20 bg-background/70 px-6 text-base font-semibold backdrop-blur-sm sm:w-auto"
                  asChild
                >
                  <Link href="/entrar">Sou empresa</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section
          id="areas"
          className="scroll-mt-28 border-b border-border bg-background py-16 lg:py-24"
        >
          <div className="page-container">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/12 text-primary">
                <Users className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-balance font-display text-(length:--text-display-s) font-semibold tracking-tight">
                Como encontrar a vaga certa
              </h2>
              <span className="mt-3 h-1 w-14 rounded-full bg-primary" aria-hidden />
              <p className="mt-4 text-pretty text-muted-foreground">
                Vagas que combinam com seus talentos e com o que cada time precisa.
                <br className="hidden sm:block" />
                Para recrutadores e candidatos.
              </p>
            </div>

            <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {areaLinks.map((area) => {
                const Icon = area.icon
                return (
                  <li key={area.href} className="min-w-0">
                    <Link
                      href={area.href}
                      className="hover-lift group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_oklch(18%_0.008_60/0.05)] transition-colors hover:border-primary/30"
                    >
                      <div className="relative aspect-16/10 w-full overflow-hidden">
                        <Image
                          src={area.imageSrc}
                          alt={area.imageAlt}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="relative flex flex-1 flex-col px-6 pt-8 pb-6">
                        <span className="absolute -top-6 left-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-card">
                          <Icon className="size-5" aria-hidden />
                        </span>
                        <h3 className="font-display text-xl font-semibold tracking-tight">
                          {area.title}
                        </h3>
                        <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                          {area.description}
                        </p>
                        <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                          Ver vagas
                          <ArrowRight className="size-3.5" aria-hidden />
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <HomeFeaturedJobs />

        <section
          id="para-quem"
          className="scroll-mt-28 border-y border-border bg-muted/40 py-16 lg:py-24"
        >
          <div className="page-container">
            <div className="max-w-3xl">
              <h2 className="text-balance font-display text-(length:--text-display-s) font-semibold tracking-tight">
                Encontre o match{' '}
                <span className="relative inline-block text-primary">
                  perfeito.
                  <span
                    className="absolute inset-x-0 -bottom-1 h-0.75 rounded-full bg-primary/70"
                    aria-hidden
                  />
                </span>
              </h2>
              <p className="mt-4 max-w-2xl text-pretty text-muted-foreground">
                Soluções pensadas para empresas que contratam e para profissionais de tecnologia que
                crescem.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_oklch(18%_0.008_60/0.06)]">
                <div className="grid min-h-0 grid-cols-1 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="flex flex-col p-6 lg:p-8">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <Building2 className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
                      Para empresas
                    </h3>
                    <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                      Publique vagas de TI, gerencie candidaturas e acompanhe todo o processo de
                      contratação em um só lugar.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button className="min-h-11 gap-2 rounded-xl" asChild>
                        <Link href="/cadastro">
                          <Building2 className="size-4" aria-hidden />
                          Cadastrar empresa
                        </Link>
                      </Button>
                      <Link
                        href="/entrar"
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Saiba mais
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                  <div className="relative min-h-48 sm:min-h-full">
                    <Image
                      src="/images/para-empresas.jpg"
                      alt="Profissional em ambiente de trabalho com notebook"
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--card)_0%,transparent_42%)] sm:bg-[linear-gradient(to_right,var(--card)_0%,transparent_55%)]"
                      aria-hidden
                    />
                  </div>
                </div>
              </article>

              <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_oklch(18%_0.008_60/0.06)]">
                <div className="grid min-h-0 grid-cols-1 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="flex flex-col p-6 lg:p-8">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary/12 text-primary">
                      <UserRound className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
                      Para candidatos
                    </h3>
                    <p className="mt-3 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                      Candidate-se a vagas de tecnologia com um único perfil, acompanhe
                      oportunidades e conecte-se com empresas que valorizam seu talento.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <Button className="min-h-11 gap-2 rounded-xl" asChild>
                        <Link href="/cadastro">
                          <UserRound className="size-4" aria-hidden />
                          Criar conta
                        </Link>
                      </Button>
                      <Link
                        href="/vagas"
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Saiba mais
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                  <div className="relative min-h-48 sm:min-h-full">
                    <Image
                      src="/images/para-candidatos.jpg"
                      alt="Candidato sorrindo enquanto usa o notebook"
                      fill
                      sizes="(max-width: 640px) 100vw, 25vw"
                      className="object-cover"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--card)_0%,transparent_42%)] sm:bg-[linear-gradient(to_right,var(--card)_0%,transparent_55%)]"
                      aria-hidden
                    />
                  </div>
                </div>
              </article>
            </div>

            <p className="mt-10 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
              Um espaço seguro, transparente e feito para conectar talento com oportunidades.
            </p>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-border py-16 lg:py-24">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_0%_20%,var(--color-accent)/0.18,transparent_55%),linear-gradient(90deg,var(--color-accent)/0.08_0%,transparent_45%)]"
            aria-hidden
          />
          <svg
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-foreground/6"
            viewBox="0 0 1200 160"
            preserveAspectRatio="none"
            role="presentation"
            focusable="false"
            aria-hidden="true"
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              d="M0 110 C120 80 180 140 300 110 S480 70 600 105 S780 145 900 100 S1080 60 1200 95"
            />
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              d="M0 130 C140 100 200 150 320 125 S500 95 620 130 S800 160 920 120 S1100 85 1200 120"
            />
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              d="M0 145 C160 125 220 155 340 140 S520 115 640 145 S820 170 940 140 S1120 110 1200 140"
            />
          </svg>

          <div className="page-container relative grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="min-w-0 max-w-xl">
              <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                <span className="relative inline-block">
                  Pronto
                  <span
                    className="absolute inset-x-0 -bottom-1 h-1 rounded-full bg-primary"
                    aria-hidden
                  />
                </span>{' '}
                para preencher sua próxima vaga de TI?
              </h2>
              <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Conectamos recrutadores a candidatos qualificados para impulsionar as melhores
                contratações em tecnologia.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <Button size="lg" className="min-h-11 w-full rounded-xl sm:w-auto" asChild>
                  <Link href="/cadastro">Criar conta</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-11 w-full rounded-xl border-primary/40 text-primary hover:bg-primary/5 hover:text-primary sm:w-auto"
                  asChild
                >
                  <Link href="/entrar">Já tenho conta</Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto hidden h-64 w-full max-w-sm lg:block" aria-hidden>
              <div className="absolute top-2 right-10 size-44 rounded-full bg-primary/8" />
              <div className="absolute top-8 right-4 flex size-28 items-center justify-center rounded-full bg-primary/12 text-primary shadow-[0_12px_40px_oklch(48%_0.09_180/0.12)]">
                <Users className="size-12" strokeWidth={1.5} />
              </div>
              <div className="absolute right-28 bottom-6 flex size-20 items-center justify-center rounded-full bg-primary/12 text-primary shadow-[0_10px_30px_oklch(48%_0.09_180/0.1)]">
                <Handshake className="size-9" strokeWidth={1.5} />
              </div>
              <div className="absolute top-4 right-36 grid grid-cols-3 gap-1.5 opacity-40">
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
              </div>
              <div className="absolute right-6 bottom-20 grid grid-cols-2 gap-1.5 opacity-35">
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
                <span className="size-1.5 rounded-full bg-primary/50" />
              </div>
            </div>
          </div>
        </section>

        <footer
          id="footer"
          className="relative scroll-mt-28 overflow-hidden border-t border-border bg-muted/40 py-14 lg:py-20"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_0%,var(--color-accent)/0.1,transparent_55%)]"
            aria-hidden
          />
          <div className="page-container relative flex flex-col gap-12">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
              <div className="min-w-0 max-w-xl">
                <Link
                  href="/"
                  className="inline-flex font-display text-base font-semibold tracking-tight text-foreground"
                >
                  Deploy Talent
                </Link>
                <p className="mt-6 font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  Vagas de tecnologia com processo claro.
                </p>
                <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
                  Para empresas que contratam TI e profissionais que buscam a próxima oportunidade.
                </p>
                <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
                  Feito para conectar talento com oportunidades.
                </p>
              </div>

              <nav className="grid grid-cols-2 gap-8 sm:gap-10" aria-label="Rodapé">
                <div>
                  <p className="text-sm font-semibold text-foreground">Candidatos</p>
                  <ul className="mt-4 flex flex-col gap-1">
                    <li>
                      <Link
                        href="/vagas"
                        className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        Ver vagas
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/cadastro"
                        className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        Criar conta
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/entrar"
                        className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        Entrar
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Empresas</p>
                  <ul className="mt-4 flex flex-col gap-1">
                    <li>
                      <Link
                        href="/cadastro"
                        className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        Cadastrar empresa
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/entrar"
                        className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        Área empresa
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/#para-quem"
                        className="inline-flex min-h-10 items-center text-sm text-muted-foreground hover:text-primary"
                      >
                        Como funciona
                      </Link>
                    </li>
                  </ul>
                </div>
              </nav>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Deploy Talent
              </p>
              <p className="text-xs text-muted-foreground">Recrutamento de TI sem complicação.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
