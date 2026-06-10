'use client';

import { useEffect, useRef, useState } from 'react';
import { PiSpinnerGapDuotone, PiMapPinDuotone } from 'react-icons/pi';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface CanadaAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  enabled?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}

/**
 * Address input with autocomplete suggestions restricted to Canada.
 * Uses OpenStreetMap Nominatim (free, no API key required).
 * Falls back to a plain textarea when `enabled=false`.
 */
export default function CanadaAddressInput({
  value,
  onChange,
  enabled = true,
  placeholder = 'Adresse complète',
  className = '',
  rows = 2,
}: CanadaAddressInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced fetch on value change
  useEffect(() => {
    if (!enabled || !value || value.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=ca&limit=6&q=${encodeURIComponent(value)}`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'fr,en' },
        });
        if (res.ok) {
          const data = (await res.json()) as AddressSuggestion[];
          setSuggestions(data);
          setShowDropdown(data.length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, enabled]);

  const handleSelect = (s: AddressSuggestion) => {
    onChange(formatCanadianAddress(s));
    setShowDropdown(false);
    setSuggestions([]);
  };

  const formatSuggestion = (s: AddressSuggestion): { primary: string; secondary: string } => {
    const a = s.address ?? {};
    const streetLine = [a.house_number, a.road].filter(Boolean).join(' ');
    const cityLine = [a.city || a.town || a.village, provinceAbbreviation(a.state), formatPostcode(a.postcode)].filter(Boolean).join(', ');
    return {
      primary: streetLine || s.display_name.split(',').slice(0, 2).join(','),
      secondary: cityLine || s.display_name.split(',').slice(2).join(',').trim(),
    };
  };

  if (!enabled) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${className}`}
      />
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${className}`}
      />
      {loading && (
        <PiSpinnerGapDuotone className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
      )}

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            🇨🇦 Adresses au Canada
          </div>
          {suggestions.map((s, idx) => {
            const { primary, secondary } = formatSuggestion(s);
            return (
              <button
                key={`${s.lat}-${s.lon}-${idx}`}
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-start gap-2 border-b border-gray-100 px-3 py-2 text-left hover:bg-blue-50 last:border-b-0"
              >
                <PiMapPinDuotone className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{primary}</div>
                  {secondary && (
                    <div className="truncate text-xs text-gray-500">{secondary}</div>
                  )}
                </div>
              </button>
            );
          })}
          <div className="border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] text-gray-400">
            Données : OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Map full province names (FR/EN) to standard 2-letter abbreviations. */
const PROVINCE_ABBR: Record<string, string> = {
  'alberta': 'AB',
  'british columbia': 'BC',
  'colombie-britannique': 'BC',
  'colombie britannique': 'BC',
  'manitoba': 'MB',
  'new brunswick': 'NB',
  'nouveau-brunswick': 'NB',
  'nouveau brunswick': 'NB',
  'newfoundland and labrador': 'NL',
  'terre-neuve-et-labrador': 'NL',
  'nova scotia': 'NS',
  'nouvelle-écosse': 'NS',
  'nouvelle ecosse': 'NS',
  'ontario': 'ON',
  'prince edward island': 'PE',
  'île-du-prince-édouard': 'PE',
  'quebec': 'QC',
  'québec': 'QC',
  'saskatchewan': 'SK',
  'northwest territories': 'NT',
  'territoires du nord-ouest': 'NT',
  'nunavut': 'NU',
  'yukon': 'YT',
};

function provinceAbbreviation(state?: string): string {
  if (!state) return '';
  return PROVINCE_ABBR[state.toLowerCase().trim()] ?? state;
}

/** Normalize Canadian postcode: "g8l 1t9" → "G8L1T9" (uppercase, no space). */
function formatPostcode(pc?: string): string {
  if (!pc) return '';
  return pc.replace(/\s+/g, '').toUpperCase();
}

/**
 * Build the canonical Canadian address string from Nominatim data.
 * Format: `{house_number}, {road} {city}, {province_abbr} {postcode}`
 * Example: "261, 2e Avenue Dolbeau-Mistassini, QC G8L1T9"
 */
function formatCanadianAddress(s: AddressSuggestion): string {
  const a = s.address ?? {};
  const house = (a.house_number ?? '').trim();
  const road = (a.road ?? '').trim();
  const city = (a.city ?? a.town ?? a.village ?? '').trim();
  const province = provinceAbbreviation(a.state);
  const postcode = formatPostcode(a.postcode);

  // If we lack structured data, fall back to display_name
  if (!road && !city) return s.display_name;

  const streetPart = [house ? `${house},` : '', road, city]
    .filter(Boolean)
    .join(' ');
  const tail = [province, postcode].filter(Boolean).join(' ');
  return tail ? `${streetPart}, ${tail}` : streetPart;
}
