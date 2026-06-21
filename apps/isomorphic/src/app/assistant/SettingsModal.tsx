'use client';

import { useEffect, useState } from 'react';
import { PiX, PiFloppyDisk, PiInfo } from 'react-icons/pi';
import {
  chatbotSettingsService,
  ChatbotSettingsPayload,
} from '@/services/chatbot-settings';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SettingsModal({ open, onClose }: Props) {
  const [settings, setSettings] = useState<ChatbotSettingsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(false);
    setLoading(true);
    chatbotSettingsService
      .get()
      .then(setSettings)
      .catch((e) => setError(e.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [open]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await chatbotSettingsService.update(settings);
      setSettings(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (e: any) {
      setError(e.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Paramètres de Volo</h2>
            <p className="text-xs text-gray-500">
              Configurer le périmètre et les capacités de l&apos;assistant.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <PiX className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading || !settings ? (
            <div className="flex h-32 items-center justify-center text-sm text-gray-400">
              Chargement…
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section 1 — Périmètre toujours actif */}
              <Section title="Périmètre de base">
                <Row
                  title="Questions sur l'utilisation de la plateforme"
                  description="Toujours activé. Volo peut expliquer comment utiliser l'app."
                >
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                    ACTIVÉ
                  </span>
                </Row>
              </Section>

              {/* Section 2 — Immigration */}
              <Section title="Questions d'immigration">
                <Toggle
                  title="Autoriser les questions sur le domaine de l'immigration"
                  description="Procédures IRCC, programmes provinciaux, principes des relations clients-consultant."
                  checked={settings.allow_immigration_questions}
                  onChange={(v) =>
                    setSettings({ ...settings, allow_immigration_questions: v })
                  }
                />
                {settings.allow_immigration_questions && (
                  <div className="ml-12 mt-2 rounded-lg bg-red-50 p-3">
                    <label className="block text-xs font-semibold text-red-900">
                      Qui peut poser ces questions ?
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {(['admin', 'collab', 'both'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            setSettings({ ...settings, immigration_questions_for: v })
                          }
                          className={`rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition ${
                            settings.immigration_questions_for === v
                              ? 'border-red-600 bg-white text-red-700'
                              : 'border-transparent bg-white/60 text-gray-600 hover:bg-white'
                          }`}
                        >
                          {v === 'admin' ? 'Admins' : v === 'collab' ? 'Collaborateurs' : 'Les deux'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              {/* Section 3 — Lookup */}
              <Section title="Accès aux données du système">
                <Toggle
                  title="Résumer un dossier sur demande"
                  description="Quand l'utilisateur dit « parle-moi du dossier 42 », Volo récupère les infos et les résume."
                  checked={settings.allow_dossier_lookup}
                  onChange={(v) =>
                    setSettings({ ...settings, allow_dossier_lookup: v })
                  }
                />
                <Toggle
                  title="Résumer un client sur demande"
                  description="Quand l'utilisateur dit « résume le client 17 », Volo récupère les infos (nom, famille, dossiers liés)."
                  checked={settings.allow_client_lookup}
                  onChange={(v) =>
                    setSettings({ ...settings, allow_client_lookup: v })
                  }
                />
                {(settings.allow_dossier_lookup || settings.allow_client_lookup) && (
                  <div className="ml-12 mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
                    <PiInfo className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      Volo ne fournit ces résumés que lorsque l&apos;utilisateur mentionne
                      explicitement un identifiant numérique (ex&nbsp;: <code className="rounded bg-white px-1">dossier 42</code>).
                    </div>
                  </div>
                )}
              </Section>

              {/* Section 4 — Instructions custom */}
              <Section title="Instructions personnalisées (optionnel)">
                <textarea
                  value={settings.custom_instructions ?? ''}
                  onChange={(e) =>
                    setSettings({ ...settings, custom_instructions: e.target.value })
                  }
                  rows={4}
                  placeholder="Ex : Tutoie l'utilisateur. Ne mentionne jamais les tarifs. Renvoie systématiquement vers Marie pour les questions d'agenda."
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Ces instructions sont ajoutées au prompt système de Volo.
                  Max 2000 caractères.
                </p>
              </Section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3">
          <div className="text-xs">
            {error && <span className="text-red-600">{error}</span>}
            {success && <span className="text-green-600">✅ Paramètres enregistrés</span>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || loading || !settings}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-red-700 hover:to-red-800 disabled:opacity-50"
            >
              <PiFloppyDisk className="h-4 w-4" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-white p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        {description && <div className="mt-0.5 text-xs text-gray-500">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row
      title={title}
      description={description}
    >
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? 'bg-red-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </Row>
  );
}
