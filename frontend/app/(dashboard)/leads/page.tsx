"use client";

import { Header } from "@/components/layout/header";

const mockLeads = [
  { name: "Ana Carolina Mendes", phone: "(11) 98765-4321", score: 92, stage: "Qualificação", product: "Volumetrão Gel", status: "Ativo" },
  { name: "Bruno Ferreira Lima", phone: "(21) 99876-5432", score: 87, stage: "Interesse", product: "Volumetrão Gel", status: "Ativo" },
  { name: "Carla Teixeira Rocha", phone: "(31) 91234-5678", score: 74, stage: "Proposta", product: "Volumetrão Gel", status: "Ativo" },
  { name: "Diego Oliveira Santos", phone: "(41) 98765-1234", score: 58, stage: "Qualificação", product: "Volumetrão Gel", status: "Ativo" },
  { name: "Fernanda Almeida", phone: "(51) 97654-3210", score: 45, stage: "Contato Inicial", product: "Volumetrão Gel", status: "Pendente" },
  { name: "Gabriel Nogueira", phone: "(61) 98123-4567", score: 33, stage: "Contato Inicial", product: "Volumetrão Gel", status: "Pendente" },
];

export default function LeadsPage() {
  return (
    <>
      <Header title="Leads" subtitle="Gerencie seus leads e oportunidades" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-72"
          />
          <select className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground">
            <option>Todos os estágios</option>
            <option>Qualificação</option>
            <option>Interesse</option>
            <option>Proposta</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Etapa</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockLeads.map((lead) => (
                <tr key={lead.phone} className="border-b border-border hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-xs text-primary font-medium">
                      {lead.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">{lead.stage}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.product}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${lead.status === "Ativo" ? "text-green-400" : "text-yellow-400"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${lead.status === "Ativo" ? "bg-green-400" : "bg-yellow-400"}`} />
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
