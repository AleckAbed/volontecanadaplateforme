'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  PiPlus,
  PiTrash,
  PiPaperPlaneTilt,
  PiSparkle,
  PiChatCircle,
  PiList,
  PiX,
  PiSignOut,
  PiGear,
  PiMicrophone,
  PiStopCircle,
} from 'react-icons/pi';
import SettingsModal from './SettingsModal';
import { chatbotService, ChatMessage, Disambiguation } from '@/services/chatbot';
import {
  Conversation,
  conversationStorage,
  groupConversationsByDate,
} from '@/lib/chatbot-storage';
import { getAuthToken } from '@/lib/auth-storage';

const SUGGESTIONS = [
  "Comment créer un nouveau dossier ?",
  "Comment envoyer une invitation à un client ?",
  "À quoi sert le bouton « Modifier » sur un document IRCC ?",
  "Comment ajouter un collaborateur à mon cabinet ?",
];

export default function VoloAssistantPage() {
  const [userKey, setUserKey] = useState<string | null>(null);
  const [userLabel, setUserLabel] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Récupère l'identité utilisateur pour namespacer le storage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = getAuthToken();
        const apiBase =
          (process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '')) ||
          `${window.location.protocol}//${window.location.hostname}:8000/api`;
        const res = await fetch(`${apiBase}/admin/me`, {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) {
          window.location.href = '/signin';
          return;
        }
        const json = await res.json();
        const user = json?.data?.user || json?.data || json;
        const id = user?.id ?? user?.email ?? 'unknown';
        const label = user?.name || user?.email || 'Admin';
        if (cancelled) return;
        const key = `admin_${id}`;
        setUserKey(key);
        setUserLabel(label);

        // Hydrate depuis le storage namespacé
        const all = conversationStorage.list(key);
        setConversations(all);
        const active = conversationStorage.getActiveId(key);
        if (active && all.some((c) => c.id === active)) {
          setActiveId(active);
        }
      } catch {
        if (!cancelled) {
          window.location.href = '/signin';
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeConv = conversations.find((c) => c.id === activeId) || null;
  const messages = activeConv?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Web Speech API — détection support
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const toggleRecording = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("La dictée vocale n'est pas supportée par ce navigateur. Utilisez Chrome, Edge ou Safari.");
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SR();
    recognition.lang = 'fr-FR';
    recognition.interimResults = true;
    recognition.continuous = false;
    let finalTranscript = '';
    const baseInput = input;
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      setInput((baseInput ? baseInput + ' ' : '') + (finalTranscript + interim).trim());
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const handleNewChat = () => {
    if (!userKey) return;
    setActiveId(null);
    conversationStorage.setActiveId(userKey, null);
    setInput('');
    setError(null);
  };

  const handleSelectConv = (id: string) => {
    if (!userKey) return;
    setActiveId(id);
    conversationStorage.setActiveId(userKey, id);
    setError(null);
  };

  const handleDeleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userKey) return;
    if (!confirm('Supprimer cette conversation ?')) return;
    conversationStorage.remove(userKey, id);
    setConversations(conversationStorage.list(userKey));
    if (activeId === id) {
      setActiveId(null);
      conversationStorage.setActiveId(userKey, null);
    }
  };

  const send = async (overrideText?: string) => {
    if (!userKey) return;
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setError(null);

    let conv = activeConv;
    if (!conv) {
      conv = conversationStorage.newConversation();
      conv.title = conversationStorage.titleFromMessage(text);
    }

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...conv.messages, userMsg];
    const updatedConv: Conversation = {
      ...conv,
      messages: newMessages,
      updatedAt: Date.now(),
    };

    conversationStorage.upsert(userKey, updatedConv);
    setConversations(conversationStorage.list(userKey));
    setActiveId(updatedConv.id);
    conversationStorage.setActiveId(userKey, updatedConv.id);
    setInput('');
    setLoading(true);

    try {
      const result = await chatbotService.ask('admin', text, conv.messages);
      const botMsg: ChatMessage =
        result.kind === 'answer'
          ? { role: 'assistant', content: result.answer }
          : { role: 'assistant', content: result.disambiguation.message, disambiguation: result.disambiguation };
      const finalConv: Conversation = {
        ...updatedConv,
        messages: [...newMessages, botMsg],
        updatedAt: Date.now(),
      };
      conversationStorage.upsert(userKey, finalConv);
      setConversations(conversationStorage.list(userKey));
    } catch (e: any) {
      setError(e.message || 'Erreur de communication');
    } finally {
      setLoading(false);
    }
  };

  const handleDisambiguationPick = (sendText: string) => {
    send(sendText);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const groups = groupConversationsByDate(conversations);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white">
      {/* Sidebar des conversations */}
      <aside
        className={`flex flex-col border-r border-red-100 bg-red-50/40 transition-all duration-200 ${
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-red-100 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white shadow-sm">
            🤖
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-red-900">Volo</div>
            <div className="truncate text-[10px] text-red-500/80">Assistant IA</div>
          </div>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-red-700 hover:to-red-800"
          >
            <PiPlus className="h-4 w-4" />
            Nouvelle conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 && (
            <div className="px-3 py-8 text-center text-xs text-red-400/80">
              Aucune conversation pour l&apos;instant.
            </div>
          )}
          {groups.map((g) => (
            <div key={g.label} className="mt-3">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-red-500/70">
                {g.label}
              </div>
              <div className="space-y-0.5">
                {g.items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectConv(c.id)}
                    className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                      c.id === activeId
                        ? 'bg-red-100 font-semibold text-red-900'
                        : 'text-gray-700 hover:bg-red-100/60'
                    }`}
                  >
                    <PiChatCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <span
                      onClick={(e) => handleDeleteConv(c.id, e)}
                      className="hidden h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-red-200 hover:text-red-700 group-hover:flex"
                    >
                      <PiTrash className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-red-100 p-3">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-gray-600">
              <img src="/avatar.webp" alt="" className="h-5 w-5 rounded-full object-cover" />
              <span className="truncate">{userLabel || '—'}</span>
            </div>
            <Link
              href="/"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title="Retour à l'admin"
            >
              <PiSignOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Zone principale */}
      <main className="flex flex-1 flex-col bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              aria-label="Basculer le menu"
            >
              {sidebarOpen ? <PiX className="h-5 w-5" /> : <PiList className="h-5 w-5" />}
            </button>
            <div>
              <div className="text-sm font-bold text-gray-900">
                {activeConv ? activeConv.title : 'Volo — Assistant Volonté Canada'}
              </div>
              <div className="text-[11px] text-gray-500">Système IA interne · Volonté Canada</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            title="Paramètres de Volo"
          >
            <PiGear className="h-4 w-4" />
            <span className="hidden sm:inline">Paramètres</span>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!userKey ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Chargement…
            </div>
          ) : messages.length === 0 && !loading ? (
            <Welcome onPick={(s) => send(s)} />
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} onPick={handleDisambiguationPick} />
              ))}
              {loading && <TypingIndicator />}
              {error && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-white px-4 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-2 shadow-sm focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder={isRecording ? '🎤 En écoute…' : 'Posez votre question à Volo…'}
                rows={1}
                disabled={!userKey}
                className="max-h-48 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none outline-none focus:border-0 focus:outline-none focus:ring-0"
              />
              {(
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={!userKey || loading}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition disabled:opacity-40 ${
                    isRecording
                      ? 'animate-pulse bg-red-600 text-white shadow-lg shadow-red-200'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
                  }`}
                  aria-label={isRecording ? 'Arrêter' : 'Dicter'}
                  title={isRecording ? 'Arrêter la dictée' : 'Dicter avec la voix'}
                >
                  {isRecording ? <PiStopCircle className="h-5 w-5" /> : <PiMicrophone className="h-5 w-5" />}
                </button>
              )}
              <button
                type="button"
                onClick={() => send()}
                disabled={!input.trim() || loading || !userKey}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-700 text-white shadow-sm transition hover:from-red-700 hover:to-red-800 disabled:opacity-40"
                aria-label="Envoyer"
              >
                <PiPaperPlaneTilt className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 px-1 text-center text-[10px] text-gray-400">
              Volo répond uniquement sur l&apos;utilisation de la plateforme.
              Pour les questions juridiques, contactez votre superviseur.
            </p>
          </div>
        </div>
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function MessageBubble({
  message,
  onPick,
}: {
  message: ChatMessage;
  onPick: (sendText: string) => void;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={`mb-5 flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <img
          src="/avatar.webp"
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm text-white">
          🤖
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-red-600 text-white'
              : 'border border-gray-200 bg-gray-50 text-gray-800'
          }`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
        {message.disambiguation && (
          <div className="mt-2 flex flex-col gap-1.5">
            {message.disambiguation.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onPick(opt.sendText)}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-left text-xs font-medium text-red-700 transition hover:border-red-400 hover:bg-red-50 hover:shadow-sm"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="mb-5 flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-sm text-white">
        🤖
      </div>
      <div className="inline-flex items-center gap-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-red-400" style={{ animationDelay: '0ms' }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-red-400" style={{ animationDelay: '150ms' }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-red-400" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-10">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-700 text-3xl shadow-lg shadow-red-200">
        🤖
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Bonjour, je suis Volo</h1>
      <p className="mt-2 max-w-md text-center text-sm text-gray-500">
        Je suis là pour vous aider à utiliser la plateforme Volonté Canada.
        Posez-moi n&apos;importe quelle question sur son fonctionnement !
      </p>
      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-xl border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:shadow-sm"
          >
            <PiSparkle className="mb-1.5 h-4 w-4 text-red-500" />
            <div>{s}</div>
          </button>
        ))}
      </div>
    </div>
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
    .replace(/`([^`]+)`/g, '<code class="rounded bg-black/10 px-1 text-[0.85em]">$1</code>')
    .replace(/\n/g, '<br/>');
}
