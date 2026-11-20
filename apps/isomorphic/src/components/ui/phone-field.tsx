'use client';

import { useEffect, useMemo, useState } from 'react';
import { countries } from '@/data/countries';

/** Indicatifs téléphoniques internationaux par code ISO (UIT-T E.164). */
export const DIAL_CODES: Record<string, string> = {
  AF: '93', ZA: '27', AL: '355', DZ: '213', DE: '49', AD: '376', AO: '244', AG: '1268', SA: '966', AR: '54', AM: '374',
  AU: '61', AT: '43', AZ: '994', BS: '1242', BH: '973', BD: '880', BB: '1246', BE: '32', BZ: '501', BJ: '229', BT: '975',
  BY: '375', MM: '95', BO: '591', BA: '387', BW: '267', BR: '55', BN: '673', BG: '359', BF: '226', BI: '257', KH: '855',
  CM: '237', CA: '1', CV: '238', CF: '236', TD: '235', CL: '56', CN: '86', CO: '57', KM: '269', CG: '242', CD: '243',
  CR: '506', CI: '225', HR: '385', CU: '53', CY: '357', CZ: '420', DK: '45', DJ: '253', DM: '1767', DO: '1809', EC: '593',
  EG: '20', SV: '503', GQ: '240', ER: '291', EE: '372', SZ: '268', ET: '251', FJ: '679', FI: '358', FR: '33', GA: '241',
  GM: '220', GE: '995', GH: '233', GR: '30', GD: '1473', GT: '502', GN: '224', GW: '245', GY: '592', HT: '509', HN: '504',
  HU: '36', IS: '354', IN: '91', ID: '62', IR: '98', IQ: '964', IE: '353', IL: '972', IT: '39', JM: '1876', JP: '81',
  JO: '962', KZ: '7', KE: '254', KI: '686', XK: '383', KW: '965', KG: '996', LA: '856', LV: '371', LB: '961', LS: '266',
  LR: '231', LY: '218', LI: '423', LT: '370', LU: '352', MG: '261', MW: '265', MY: '60', MV: '960', ML: '223', MT: '356',
  MH: '692', MR: '222', MU: '230', MX: '52', FM: '691', MD: '373', MC: '377', MN: '976', ME: '382', MA: '212', MZ: '258',
  NA: '264', NR: '674', NP: '977', NL: '31', NZ: '64', NI: '505', NE: '227', NG: '234', KP: '850', MK: '389', NO: '47',
  OM: '968', PK: '92', PW: '680', PS: '970', PA: '507', PG: '675', PY: '595', PE: '51', PH: '63', PL: '48', PT: '351',
  QA: '974', RO: '40', RU: '7', RW: '250', KN: '1869', LC: '1758', VC: '1784', WS: '685', SM: '378', ST: '239', SN: '221',
  RS: '381', SC: '248', SL: '232', SG: '65', SK: '421', SI: '386', SB: '677', SO: '252', KR: '82', SS: '211', ES: '34',
  LK: '94', SD: '249', SR: '597', SE: '46', CH: '41', SY: '963', TW: '886', TJ: '992', TZ: '255', TH: '66', TL: '670',
  TG: '228', TO: '676', TT: '1868', TN: '216', TR: '90', TM: '993', TV: '688', UG: '256', UA: '380', AE: '971', GB: '44',
  US: '1', UY: '598', UZ: '998', VU: '678', VA: '379', VE: '58', VN: '84', YE: '967', ZM: '260', ZW: '263',
};

const flag = (code: string) => String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));

/** Lit « +33 6 12 34 56 78 » : pays (indicatif le plus long qui correspond) et numéro national. */
export function parsePhone(value: string | null | undefined, fallback = 'CA'): { country: string; national: string } {
  const v = (value ?? '').trim();
  if (!v.startsWith('+')) return { country: fallback, national: v };
  const digits = v.slice(1).replace(/\D/g, '');
  let best: { country: string; len: number } | null = null;
  for (const [iso, dial] of Object.entries(DIAL_CODES)) {
    if (digits.startsWith(dial) && (!best || dial.length > best.len || (dial.length === best.len && iso === fallback))) {
      best = { country: iso, len: dial.length };
    }
  }
  if (!best) return { country: fallback, national: v };
  const rest = v.slice(1).replace(/^\s*/, '');
  // Retire l'indicatif (en tenant compte d'éventuels espaces) pour garder la saisie nationale telle quelle.
  let consumed = 0;
  let i = 0;
  while (i < rest.length && consumed < best.len) {
    if (/\d/.test(rest[i])) consumed++;
    i++;
  }
  return { country: best.country, national: rest.slice(i).trim() };
}

/** Numéro au format international : « +<indicatif> <numéro> », ou vide. */
export function formatPhone(country: string, national: string): string {
  const n = national.replace(/[^\d\s().-]/g, '').trim();
  if (!n) return '';
  return `+${DIAL_CODES[country] ?? ''} ${n}`.trim();
}

/**
 * Téléphone international : choix du pays (drapeau + indicatif) et numéro.
 * Les clients viennent du monde entier ; la valeur est stockée au format international.
 */
export default function PhoneField({
  value, onChange, label, error, id, defaultCountry = 'CA', placeholder, disabled,
}: {
  value: string | null | undefined;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  id?: string;
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const initial = useMemo(() => parsePhone(value, defaultCountry), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState(initial.country);
  const [national, setNational] = useState(initial.national);

  // Valeur changée de l'extérieur (formulaire réinitialisé, fiche rechargée).
  useEffect(() => {
    if ((value ?? '') !== formatPhone(country, national)) {
      const p = parsePhone(value, country);
      setCountry(p.country);
      setNational(p.national);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = useMemo(() => [...countries].sort((a, b) => a.name.localeCompare(b.name, 'fr')), []);
  const fieldId = id ?? 'phone';

  return (
    <div>
      {label && <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>}
      <div className={`flex rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-50' : 'bg-white'} focus-within:ring-2 focus-within:ring-blue-200`}>
        <select
          aria-label="Pays de l’indicatif"
          disabled={disabled}
          value={country}
          onChange={(e) => { setCountry(e.target.value); onChange(formatPhone(e.target.value, national)); }}
          className="max-w-[9.5rem] shrink-0 rounded-l-lg border-0 border-r border-gray-300 bg-gray-50 py-2 pl-2 pr-6 text-sm focus:ring-0"
        >
          {sorted.filter((c) => DIAL_CODES[c.code]).map((c) => (
            <option key={c.code} value={c.code}>{flag(c.code)} {c.name} (+{DIAL_CODES[c.code]})</option>
          ))}
        </select>
        <span className="flex items-center pl-3 text-sm text-gray-500">+{DIAL_CODES[country]}</span>
        <input
          id={fieldId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          disabled={disabled}
          placeholder={placeholder ?? '514 555 0123'}
          onChange={(e) => { setNational(e.target.value); onChange(formatPhone(country, e.target.value)); }}
          className="min-w-0 flex-1 rounded-r-lg border-0 bg-transparent px-2 py-2 text-sm focus:ring-0"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
