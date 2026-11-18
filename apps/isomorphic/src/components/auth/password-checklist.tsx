'use client';

import { PiCheckCircleDuotone, PiXCircleDuotone } from 'react-icons/pi';

/** Mêmes règles que l'API (AdminAccessTokens::passwordRules). */
export const PASSWORD_CHECKS = [
  { key: 'len', label: 'Au moins 8 caractères', test: (s: string) => s.length >= 8 },
  { key: 'upper', label: 'Une lettre majuscule (A-Z)', test: (s: string) => /[A-Z]/.test(s) },
  { key: 'lower', label: 'Une lettre minuscule (a-z)', test: (s: string) => /[a-z]/.test(s) },
  { key: 'digit', label: 'Un chiffre (0-9)', test: (s: string) => /[0-9]/.test(s) },
  { key: 'spec', label: 'Un caractère spécial (!@#$%…)', test: (s: string) => /[^A-Za-z0-9]/.test(s) },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_CHECKS.every((c) => c.test(password));
}

export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">Règles de sécurité</p>
      <ul className="space-y-1.5">
        {PASSWORD_CHECKS.map((c) => {
          const passed = c.test(password);
          return (
            <li key={c.key} className={`flex items-center gap-2 text-sm ${passed ? 'text-emerald-700' : 'text-gray-500'}`}>
              {passed
                ? <PiCheckCircleDuotone className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                : <PiXCircleDuotone className="h-4 w-4 flex-shrink-0 text-gray-400" />}
              <span>{c.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
