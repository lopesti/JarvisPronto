"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: autenticar com o backend
    router.push("/overview");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Entrar no JARVIS</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acesse seu painel de vendas com IA
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              required
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">Senha</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
