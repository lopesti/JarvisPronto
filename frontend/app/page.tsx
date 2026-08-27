import Link from "next/link";
import { Bot, ArrowRight, MessageSquare, GitBranch, BarChart3 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="flex h-16 items-center justify-between border-b border-border px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold">JARVIS Comercial</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Começar agora
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center lg:py-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary">
          <Bot className="h-3.5 w-3.5" />
          Assistente de vendas com Inteligência Artificial
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Seu assistente de vendas
          <br />
          <span className="text-primary">com IA no WhatsApp</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Automatize o funil completo de vendas no WhatsApp. Qualifique leads,
          trate objeções e feche pedidos 24 horas por dia com inteligência artificial.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">IA que vende</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Respostas humanizadas com Groq e Gemini. Trata objeções e conduz o lead até o fechamento.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Funil inteligente</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              10 etapas de vendas automatizadas. Do primeiro contato até a confirmação do pedido.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Dashboard ao vivo</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Acompanhe conversas, leads, pipeline e conversão em tempo real.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 JARVIS Comercial — Sistema Operacional Cognitivo de Vendas
      </footer>
    </div>
  );
}
