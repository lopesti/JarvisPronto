"use client";

import { Header } from "@/components/layout/header";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockChats = [
  { id: "1", name: "Lucas Almeida", phone: "11987654321", lastMessage: "Quero saber mais sobre o plano", score: 86, time: "11:24" },
  { id: "2", name: "Fernanda Oliveira", phone: "21998765432", lastMessage: "Vocês fazem integração?", score: 72, time: "10:58" },
  { id: "3", name: "Roberto Martins", phone: "31912345678", lastMessage: "Quero testar por 7 dias", score: 58, time: "09:41" },
  { id: "4", name: "Juliana Castro", phone: "41987651234", lastMessage: "Obrigada pela ajuda!", score: 45, time: "Ontem" },
];

export default function ConversationsPage() {
  const [selected, setSelected] = useState(mockChats[0]);

  return (
    <>
      <Header title="Conversas" subtitle="Gerencie os chats do WhatsApp" />
      <div className="flex flex-1 overflow-hidden">
        {/* Lista de chats */}
        <div className="w-80 border-r border-border overflow-y-auto">
          <div className="p-3">
            <input
              type="text"
              placeholder="Buscar conversa..."
              className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {mockChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelected(chat)}
              className={cn(
                "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                selected?.id === chat.id && "bg-primary/10"
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {chat.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{chat.name}</span>
                  <span className="text-[10px] text-muted-foreground">{chat.time}</span>
                </div>
                <p className="truncate text-xs text-muted-foreground">{chat.lastMessage}</p>
                <span className="mt-1 inline-block rounded bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
                  score {chat.score}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Chat aberto */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
              {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium">{selected.name}</p>
              <p className="text-[11px] text-muted-foreground">{selected.phone}</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-primary/20 px-4 py-2.5 text-sm">
              Olá! Sou o JARVIS, assistente de vendas. Como posso ajudar?
            </div>
            <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-sm bg-secondary px-4 py-2.5 text-sm">
              {selected.lastMessage}
            </div>
            <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-primary/20 px-4 py-2.5 text-sm">
              Claro! Vou te explicar as opções disponíveis...
            </div>
          </div>

          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite uma mensagem..."
                className="flex-1 rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
