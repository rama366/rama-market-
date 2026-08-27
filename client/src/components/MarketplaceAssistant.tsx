import { AIChatBox, Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { MessageCircleMore, X } from "lucide-react";
import { useState } from "react";

const startingMessages: Message[] = [{ role: "system", content: "You are RAMA Guide." }];

export function MarketplaceAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(startingMessages);
  const help = trpc.ai.help.useMutation({
    onSuccess: ({ message }) => setMessages((current) => [...current, { role: "assistant", content: message }]),
    onError: () => setMessages((current) => [...current, { role: "assistant", content: "I’m having trouble responding at the moment. You can still explore categories or create a seller account." }]),
  });

  const send = (content: string) => {
    if (help.isPending) return;
    setMessages((current) => [...current, { role: "user", content }]);
    help.mutate({ message: content });
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 sm:bottom-7 sm:right-7">
      {open && <div className="absolute bottom-16 right-0 w-[min(390px,calc(100vw-2.5rem))] overflow-hidden rounded-[1.5rem] border border-[#193d2b]/10 bg-[#fcfbf7] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#193d2b]/10 bg-[#193d2b] px-4 py-3 text-white"><div><p className="text-sm font-semibold">RAMA Guide</p><p className="text-[10px] text-[#c7d0a6]">Marketplace support, whenever you need it</p></div><button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full hover:bg-white/10" aria-label="Close RAMA Guide"><X className="size-4" /></button></div>
        <AIChatBox messages={messages} onSendMessage={send} isLoading={help.isPending} height="480px" placeholder="Ask about finding, selling, or RAMA Plus..." emptyStateMessage="How can RAMA Guide help today?" suggestedPrompts={["Help me search for a home", "How do I start selling?", "What does RAMA Plus offer?"]} className="rounded-none border-0 shadow-none" />
      </div>}
      <button onClick={() => setOpen(!open)} className="group flex items-center gap-2 rounded-full bg-[#b85a3f] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_-12px_rgba(184,90,63,0.65)] transition hover:-translate-y-0.5 hover:bg-[#a84b34] active:scale-[0.97]" aria-label="Open RAMA Guide"><MessageCircleMore className="size-5" /><span className="hidden sm:inline">Ask RAMA Guide</span></button>
    </div>
  );
}
