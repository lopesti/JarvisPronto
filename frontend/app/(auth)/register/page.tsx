"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/overview");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Comece a usar o JARVIS Comercial
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">Nome</label>
            <input
              type="text"
              required
              placeholder="Seu nome"
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
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
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Criar conta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
