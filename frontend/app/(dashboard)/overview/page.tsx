"use client";

import { Header } from "@/components/layout/header";
import { MessageSquare, Users, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const kpis = [
  {
    label: "Conversas Ativas",
    value: "128",
    change: "+18% vs ontem",
    icon: MessageSquare,
    positive: true,
  },
  {
    label: "Leads Hoje",
    value: "42",
    change: "+27% vs ontem",
    icon: Users,
    positive: true,
  },
  {
    label: "Vendas Hoje",
    value: formatCurrency(87540),
    change: "+35% vs ontem",
    icon: DollarSign,
    positive: true,
  },
  {
    label: "Taxa de Conversão",
    value: "24,7%",
    change: "+6,3% vs ontem",
    icon: TrendingUp,
    positive: true,
  },
];

export default function OverviewPage() {
  return (
    <>
      <Header
        title="Overview"
        subtitle="Visão geral do desempenho de vendas"
      />
      <div className="flex-1 overflow-y-auto p-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {kpi.label}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="mt-3 text-2xl font-bold text-foreground">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-primary">{kpi.change}</p>
              </div>
            );
          })}
        </div>

        {/* Charts placeholder */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-foreground">
              Conversas ao longo do tempo
            </h3>
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
              Gráfico de linhas (Recharts) — conecte a API
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-medium text-foreground">
              Funil de Vendas
            </h3>
            <div className="mt-4 flex h-48 items-center justify-center text-sm text-muted-foreground">
              Funil visual — conecte a API /api/pipeline
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
