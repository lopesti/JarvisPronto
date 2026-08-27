"use client";

import { Header } from "@/components/layout/header";

const stages = [
  { name: "Novo Lead", color: "bg-cyan-500", leads: [
    { name: "Camila Rocha", score: 72 },
    { name: "Bruno Almeida", score: 58 },
  ]},
  { name: "Qualificação", color: "bg-blue-500", leads: [
    { name: "Rafael Lima", score: 74 },
    { name: "Patrícia Souza", score: 61 },
  ]},
  { name: "Interesse", color: "bg-indigo-500", leads: [
    { name: "Mariana Dias", score: 81 },
    { name: "Lucas Fernandes", score: 67 },
  ]},
  { name: "Objeção", color: "bg-purple-500", leads: [
    { name: "Thiago Martins", score: 45 },
  ]},
  { name: "Endereço", color: "bg-violet-500", leads: [
    { name: "Aline Vieira", score: 70 },
  ]},
  { name: "Fechamento", color: "bg-fuchsia-500", leads: [
    { name: "Marcelo H.", score: 88 },
  ]},
  { name: "Vendido", color: "bg-green-500", leads: [
    { name: "Leonardo Silva", score: 100 },
  ]},
];

export default function PipelinePage() {
  return (
    <>
      <Header title="Pipeline" subtitle="Funil de vendas em tempo real" />
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max">
          {stages.map((stage) => (
            <div key={stage.name} className="w-56 shrink-0">
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                <span className="text-sm font-medium">{stage.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {stage.leads.length}
                </span>
              </div>
              <div className="space-y-2">
                {stage.leads.map((lead) => (
                  <div
                    key={lead.name}
                    className="rounded-lg border border-border bg-card p-3 cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <p className="text-sm font-medium">{lead.name}</p>
                    <span className="mt-1 inline-block rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                      score {lead.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
