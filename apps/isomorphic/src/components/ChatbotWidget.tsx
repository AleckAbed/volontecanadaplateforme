'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { chatbotService, ChatMessage } from '@/services/chatbot';
import { getAuthToken } from '@/lib/auth-storage';

type Props = { audience: 'admin' | 'collab' };

const GREETING: Record<Props['audience'], string> = {
  admin:
    "Bonjour 👋 Je suis **Volo**, votre assistant. Je peux vous expliquer comment utiliser la plateforme : créer un dossier, envoyer une invitation, gérer un collaborateur, etc. Que puis-je faire pour vous ?",
  collab:
    "Bonjour 👋 Je suis **Volo**, votre assistant. Je peux vous expliquer comment naviguer dans votre espace : remplir un document, consulter un dossier, etc. Que puis-je faire pour vous ?",
};

export default function ChatbotWidget({ audience }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hydratation : vérification immédiate
    const check = () => {
      const token = getAuthToken();
      const hasUserType = typeof window !== 'undefined' && !!localStorage.getItem('user_type');
      setHasToken(Boolean(token) || hasUserType);
    };
    check();
    const interval = setInterval(check, 2000);
    // Réagir à l'événement de login
    const onLogin = () => check();
    window.addEventListener('auth-token-set', onLogin);
    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-token-set', onLogin);
    };
  }, []);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const answer = await chatbotService.ask(audience, text, messages);
      setMessages([...next, { role: 'assistant', content: answer }]);
    } catch (e: any) {
      setError(e.message || 'Erreur de communication');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!hasToken) return null;
  // Pas de bulle flottante sur la page dédiée à Volo (évite la redondance)
  if (pathname?.startsWith('/assistant')) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            if (messages.length === 0) {
              setMessages([{ role: 'assistant', content: GREETING[audience] }]);
            }
          }}
          className="fixed bottom-5 right-5 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition hover:bg-red-700 hover:scale-105"
          aria-label="Ouvrir l'assistant Volo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[9999] flex h-[600px] max-h-[85vh] w-[380px] max-w-[95vw] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">
                🤖
              </div>
              <div>
                <div className="text-sm font-semibold">Volo</div>
                <div className="text-xs text-red-100">Assistant Volonté Canada</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'border border-gray-200 bg-white text-gray-800'
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
                  <span className="inline-flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-red-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-red-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-red-400" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-2">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Posez votre question…"
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={send}
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white transition hover:bg-red-700 disabled:opacity-40"
                aria-label="Envoyer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p className="mt-1 px-1 text-[10px] text-gray-400">
              Volo répond uniquement sur l&apos;utilisation de la plateforme.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 px-1 text-[0.85em]">$1</code>')
    .replace(/\n/g, '<br/>');
}
