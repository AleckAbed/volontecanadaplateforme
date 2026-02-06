'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Input, Button } from 'rizzui';
import { PiMagnifyingGlassBold, PiX } from 'react-icons/pi';
import { countries, type Country } from '@/data/countries';
import cn from '@core/utils/class-names';

interface CountrySelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export default function CountrySelect({
  value,
  onChange,
  placeholder = 'Sélectionner un pays',
  label,
  error,
  className,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === value || c.code === value),
    [value]
  );

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelect = (country: Country) => {
    onChange(country.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full justify-between',
          error && 'border-red-500',
          !selectedCountry && 'text-gray-400'
        )}
      >
        <span className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <Image
                src={selectedCountry.flag}
                alt={selectedCountry.name}
                width={20}
                height={15}
                className="rounded-sm"
              />
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </span>
        <span className="ml-2">▼</span>
      </Button>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery('');
            }}
          />
          
          {/* Popup */}
          <div className="absolute left-0 right-0 bottom-full z-50 mb-2 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            <div className="p-4">
              {/* Search Input */}
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  prefix={<PiMagnifyingGlassBold className="h-4 w-4" />}
                  className="w-full"
                  autoFocus
                />
              </div>

              {/* Countries List */}
              <div className="max-h-64 overflow-y-auto">
                {filteredCountries.length === 0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Aucun pays trouvé
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => handleSelect(country)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
                          selectedCountry?.code === country.code &&
                            'bg-primary/10 text-primary'
                        )}
                      >
                        <Image
                          src={country.flag}
                          alt={country.name}
                          width={24}
                          height={18}
                          className="rounded-sm flex-shrink-0"
                        />
                        <span className="flex-1 text-sm">{country.name}</span>
                        {selectedCountry?.code === country.code && (
                          <span className="text-primary">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

