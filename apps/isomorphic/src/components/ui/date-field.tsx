'use client';

import { useEffect, useState } from 'react';

/** « 1990-04-07 » → « 07/04/1990 » */
export function isoToFr(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/** « 07/04/1990 » → « 1990-04-07 », ou '' si la date est incomplète ou impossible. */
export function frToIso(fr: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(fr.trim());
  if (!m) return '';
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return '';
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Ajoute les barres au fil de la frappe : « 07041990 » → « 07/04/1990 ». */
function mask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/**
 * Date au format québécois jj/mm/aaaa, quelle que soit la langue du navigateur
 * (le champ natif « date » suit le navigateur : mm/dd/yyyy en anglais américain).
 * Valeur échangée au format ISO (AAAA-MM-JJ), comme l'API.
 */
export default function DateField({
  value, onChange, label, error, id, disabled,
}: {
  value: string | null | undefined;
  onChange: (iso: string) => void;
  label?: string;
  error?: string;
  id?: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState(isoToFr(value));
  useEffect(() => {
    if (frToIso(text) !== (value ?? '')) setText(isoToFr(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const invalid = text.length === 10 && !frToIso(text);
  const fieldId = id ?? 'date';

  return (
    <div>
      {label && <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>}
      <input
        id={fieldId}
        type="text"
        inputMode="numeric"
        placeholder="jj/mm/aaaa"
        maxLength={10}
        disabled={disabled}
        value={text}
        onChange={(e) => {
          const next = mask(e.target.value);
          setText(next);
          onChange(next === '' ? '' : frToIso(next));
        }}
        className={`w-full rounded-lg border ${error || invalid ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-sm`}
      />
      {(error || invalid) && <p className="mt-1 text-xs text-red-600">{error ?? 'Date impossible : vérifiez le jour et le mois.'}</p>}
    </div>
  );
}
