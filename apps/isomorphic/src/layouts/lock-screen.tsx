'use client';

import { useEffect, useRef, useState } from 'react';
import { PiLockKeyDuotone, PiLockKeyOpenDuotone, PiEyeDuotone, PiEyeClosedDuotone, PiArrowCircleUpFill } from 'react-icons/pi';
import Image from 'next/image';
import UpStorageImg from '@public/upgrade-plan.webp';
import { getRandomLockQuote, LockQuote } from '@/data/lock-screen-quotes';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { adminProfileService } from '@/services/admin-profile';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const LOCK_STATE_KEY = 'app_locked';
const DEFAULT_BG = '/bg0.jpg';

// Petit event bus pour permettre au bouton du header d'activer le verrouillage
type Listener = (locked: boolean) => void;
const listeners: Set<Listener> = new Set();

export function lockApp() {
  try { localStorage.setItem(LOCK_STATE_KEY, '1'); } catch {}
  listeners.forEach((l) => l(true));
}

export function isAppLocked(): boolean {
  if (typeof window === 'undefined') return false;
  try { return localStorage.getItem(LOCK_STATE_KEY) === '1'; } catch { return false; }
}

function unlockApp() {
  try { localStorage.removeItem(LOCK_STATE_KEY); } catch {}
  listeners.forEach((l) => l(false));
}

export default function LockScreen() {
  const { t } = useTranslation();
  const [locked, setLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const { currentUser, userType } = useAuth();

  // Backgrounds : tableau d'URLs prêtes à afficher (blob: ou /bg0.jpg)
  const [bgUrls, setBgUrls] = useState<string[]>([DEFAULT_BG]);
  const [bgIndex, setBgIndex] = useState(0);
  const [rotateInterval, setRotateInterval] = useState(8);
  const [quote, setQuote] = useState<LockQuote | null>(null);
  const blobsRef = useRef<string[]>([]);

  // Sync state with localStorage on mount + listen to lock events
  useEffect(() => {
    setLocked(isAppLocked());
    const handler = (l: boolean) => setLocked(l);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  // Horloge live (rafraichie chaque seconde) — démarre seulement quand verrouillé
  useEffect(() => {
    if (!locked) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [locked]);

  // Tire une nouvelle citation à chaque verrouillage
  useEffect(() => {
    if (locked) setQuote(getRandomLockQuote());
  }, [locked]);

  // Bloque le scroll de la page quand l'overlay est affiché
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);

  // Quand le lock screen apparaît : charger les images du profil
  useEffect(() => {
    if (!locked || userType !== 'admin') return;
    let alive = true;
    (async () => {
      try {
        const settings = await adminProfileService.getLockScreenSettings();
        if (!alive) return;
        setRotateInterval(Math.max(0, settings.interval ?? 8));
        if (settings.backgrounds.length === 0) {
          setBgUrls([DEFAULT_BG]);
          return;
        }
        const urls = await Promise.all(
          settings.backgrounds.map(async (b) => {
            try { return await adminProfileService.fetchBackgroundBlobUrl(b.filename); }
            catch { return null; }
          })
        );
        if (!alive) return;
        const valid = urls.filter((u): u is string => !!u);
        blobsRef.current = valid;
        // Inclure aussi bg0.jpg par défaut en premier ? Non — l'admin a configuré, on respecte sa liste.
        setBgUrls(valid.length > 0 ? valid : [DEFAULT_BG]);
        setBgIndex(0);
      } catch {
        // En cas d'échec, on garde au moins bg0.jpg
        setBgUrls([DEFAULT_BG]);
      }
    })();
    return () => {
      alive = false;
      // Révoquer les blob URLs créées
      blobsRef.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
      blobsRef.current = [];
    };
  }, [locked, userType]);

  // Rotation
  useEffect(() => {
    if (!locked) return;
    if (rotateInterval <= 0 || bgUrls.length <= 1) return;
    const t = setInterval(() => {
      setBgIndex((i) => (i + 1) % bgUrls.length);
    }, rotateInterval * 1000);
    return () => clearInterval(t);
  }, [locked, rotateInterval, bgUrls.length]);

  if (!locked) return null;

  const email = currentUser?.email;

  const handleUnlock = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password.trim()) return;
    if (!email || userType !== 'admin') {
      toast.error(t('lock_screen.session_unavailable'));
      return;
    }
    setSubmitting(true);
    try {
      // Endpoint dédié : vérifie juste le mot de passe sans rotation de token.
      // Le cookie HttpOnly de session est préservé, pas de nouveau login.
      // Rate-limited côté Laravel (5 essais/min) — anti-brute-force.
      const res = await api.verifyAdminPassword(password);
      if (res?.success) {
        toast.success(t('lock_screen.welcome_back'));
        setPassword('');
        unlockApp();
      } else {
        toast.error(t('lock_screen.wrong_password'));
      }
    } catch (err: any) {
      toast.error(err?.message || t('lock_screen.wrong_password'));
    } finally {
      setSubmitting(false);
    }
  };

  const localeMap: Record<string, string> = { fr: 'fr-FR', en: 'en-US', es: 'es-ES' };
  const locale = localeMap[(typeof document !== 'undefined' && document.documentElement.lang) || 'fr'] || 'fr-FR';
  const timeStr = now ? now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
  const dateStr = now ? now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
      {/* Couche d'images empilées avec crossfade */}
      {bgUrls.map((url, i) => (
        <div
          key={url + i}
          aria-hidden
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${url})`,
            opacity: i === bgIndex ? 1 : 0,
          }}
        />
      ))}
      {/* Voile rouge pour la lisibilité */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(127,29,29,0.65) 0%, rgba(185,28,28,0.55) 50%, rgba(127,29,29,0.7) 100%)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Bloc heure + date : EN DEHORS et au-dessus de la carte */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="text-center font-bold tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
          style={{
            fontFamily: '"Inter", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
            fontSize: 'clamp(48px, 9vw, 110px)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            fontWeight: 800,
            textShadow: '0 6px 32px rgba(0,0,0,0.5)',
          }}
        >
          {timeStr}
        </div>
        <div className="mt-2 text-base font-medium uppercase tracking-[0.25em] text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-lg">
          {dateStr}
        </div>

        {/* Carte blanche glass — laisse transparaître l'arrière-plan */}
        <div
          className="mt-10 w-[min(420px,92vw)] rounded-lg p-8 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-lg">
              <PiLockKeyDuotone className="h-7 w-7" />
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {currentUser ? ((currentUser as any).name || (currentUser as any).first_name || t('lock_screen.admin_fallback')) : t('lock_screen.admin_fallback')}
            </div>
            <div className="text-xs text-gray-500">{email}</div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('lock_screen.password_placeholder')}
                className="w-full rounded-md border border-white/70 bg-white/60 px-4 py-3 pr-11 text-center text-base text-gray-900 placeholder-gray-500 backdrop-blur focus:border-red-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? t('lock_screen.hide_password') : t('lock_screen.show_password')}
              >
                {showPassword ? <PiEyeClosedDuotone className="h-5 w-5" /> : <PiEyeDuotone className="h-5 w-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting || !password.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-red-600 to-rose-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-red-700 hover:to-rose-800 disabled:opacity-50"
            >
              <PiLockKeyOpenDuotone className="h-5 w-5" />
              {submitting ? t('lock_screen.verifying') : t('lock_screen.unlock')}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-gray-500">
            {t('lock_screen.session_paused')}
          </p>
        </div>
      </div>

      {/* Carte citation — en bas à droite, change à chaque verrouillage */}
      {quote && (
        <div className="absolute bottom-6 right-6 z-10 hidden w-[360px] sm:block">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-2xl">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold text-gray-900">
                {quote.author || t('lock_screen.anonymous')}
              </div>
              <span
                className="mb-2 mt-1 block overflow-hidden text-xs italic leading-snug text-gray-500"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                « {quote.text} »
              </span>
              <button
                type="button"
                onClick={() => setQuote(getRandomLockQuote())}
                className="flex items-center gap-1.5 text-xs font-bold uppercase text-red-600 hover:text-red-700"
              >
                <PiArrowCircleUpFill className="size-4" /> {t('lock_screen.next_quote')}
              </button>
            </div>
            <Image width={80} height={80} src={UpStorageImg} alt="" className="shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}
