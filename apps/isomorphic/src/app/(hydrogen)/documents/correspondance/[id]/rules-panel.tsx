'use client';

import { useState } from 'react';
import { PiCursorClickDuotone, PiTrashBold } from 'react-icons/pi';
import type { FieldMapInfo, FieldMapRule, ProfileField } from '@/services/client-profile';

export const DATE_FORMATS = [
  { value: '', label: 'AAAA-MM-JJ (par défaut)' },
  { value: 'jj/mm/aaaa', label: 'JJ/MM/AAAA' },
  { value: 'mm/jj/aaaa', label: 'MM/JJ/AAAA' },
  { value: 'aaaa/mm/jj', label: 'AAAA/MM/JJ' },
  { value: 'aaaa', label: 'Année seulement' },
  { value: 'mm', label: 'Mois seulement' },
  { value: 'jj', label: 'Jour seulement' },
];

/** Règle en cours de préparation : on l'enregistre au clic sur la case ou la liste du PDF. */
export interface PendingRule {
  field: ProfileField;
  mode: 'equals' | 'choice' | 'text';
  equals: string[];
  format: string;
  /** Libellé lisible de la règle, pour le message de confirmation. */
  summary: string;
}

/**
 * Cases à cocher, boutons radio et listes : on choisit l'information (et la valeur qui coche
 * la case), on active la capture, puis on clique le champ dans le PDF.
 */
export default function RulesPanel({ info, rules, canEdit, armed, onArm, onRemove }: {
  info: FieldMapInfo;
  rules: FieldMapRule[];
  canEdit: boolean;
  armed: PendingRule | null;
  onArm: (rule: PendingRule | null) => void;
  onRemove: (group: string) => void;
}) {
  const [key, setKey] = useState(info.fields[0]?.key ?? '');
  const [mode, setMode] = useState<'equals' | 'choice' | 'text'>('text');
  const [value, setValue] = useState('');
  const [format, setFormat] = useState('');
  const field = info.fields.find((f) => f.key === key);

  const choiceLabel = (f: ProfileField | undefined, v: string) => f?.choices?.find((c) => c.value === v)?.label ?? v;
  const ruleText = (r: { label: string; mode: string; equals: string[]; format: string | null; key: string }) => {
    const f = info.fields.find((x) => x.key === r.key);
    const fmt = r.format ? ` (${DATE_FORMATS.find((d) => d.value === r.format)?.label ?? r.format})` : '';
    if (r.mode === 'text') return `${r.label}${fmt} → champ texte`;
    return r.mode === 'choice' ? `${r.label}${fmt} → liste` : `${r.label} = ${r.equals.map((v) => choiceLabel(f, v)).join(' ou ')}`;
  };

  const equals = field?.choices?.length ? (value ? [value] : []) : value.split(';').map((v) => v.trim()).filter(Boolean);
  const ready = !!field && (mode !== 'equals' || equals.length > 0);

  const arm = () => {
    if (!field || !ready) return;
    onArm({
      field, mode, equals, format: field.type === 'date' && mode !== 'equals' ? format : '',
      summary: ruleText({ label: field.label, mode, equals, format: field.type === 'date' && mode !== 'equals' ? format || null : null, key: field.key }),
    });
  };

  const input = 'mt-1 block w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs';

  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-white p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Relier en cliquant</div>
      <p className="mb-2 text-xs text-gray-500">Pour les cases à cocher, les listes, et les champs trop courts pour un jeton (année, mois, jour).</p>
      {canEdit && (
        <div className="space-y-2 text-xs text-gray-700">
          <label className="block">Information
            <select value={key} onChange={(e) => { setKey(e.target.value); setValue(''); setFormat(''); }} className={input}>
              {info.fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <label className="inline-flex items-center gap-1.5"><input type="radio" checked={mode === 'text'} onChange={() => setMode('text')} /> Champ texte : recopier la valeur</label>
            <label className="inline-flex items-center gap-1.5"><input type="radio" checked={mode === 'equals'} onChange={() => setMode('equals')} /> Case ou bouton radio, coché quand la valeur est…</label>
            <label className="inline-flex items-center gap-1.5"><input type="radio" checked={mode === 'choice'} onChange={() => setMode('choice')} /> Liste déroulante : choisir l’option d’après la valeur</label>
          </div>
          {mode === 'equals' && (field?.choices?.length ? (
            <select value={value} onChange={(e) => setValue(e.target.value)} className={input} aria-label="Valeur qui coche la case">
              <option value="">Choisir la valeur…</option>
              {field.choices.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          ) : (
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Valeur (plusieurs : séparez par ;)" className={input} aria-label="Valeur qui coche la case" />
          ))}
          {mode !== 'equals' && field?.type === 'date' && (
            <select value={format} onChange={(e) => setFormat(e.target.value)} className={input} aria-label="Format de la date">
              {DATE_FORMATS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          )}
          {armed ? (
            <div className="rounded-md bg-amber-50 p-2 text-amber-900">
              <p className="font-medium">Cliquez maintenant dans le PDF {armed.mode === 'choice' ? 'la liste' : armed.mode === 'text' ? 'le champ texte' : 'la case ou le bouton radio'} : {armed.summary}.</p>
              <button type="button" onClick={() => onArm(null)} className="mt-1 underline">Annuler</button>
            </div>
          ) : (
            <button type="button" onClick={arm} disabled={!ready}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              <PiCursorClickDuotone className="h-4 w-4" /> Relier en cliquant dans le PDF
            </button>
          )}
        </div>
      )}
      {rules.length > 0 ? (
        <ul className="mt-3 space-y-1 border-t border-gray-100 pt-2 text-xs">
          {rules.map((r) => (
            <li key={r.group} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-gray-700" title={r.fields.join(', ')}>{ruleText(r)}</span>
              {canEdit && (
                <button type="button" onClick={() => onRemove(r.group)} className="shrink-0 text-gray-400 hover:text-red-600" aria-label={`Retirer : ${ruleText(r)}`}>
                  <PiTrashBold className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-gray-500">Aucune case ni liste reliée.</p>
      )}
    </div>
  );
}
