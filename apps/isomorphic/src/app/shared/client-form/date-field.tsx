'use client';

import { Controller, Control, FieldError } from 'react-hook-form';
import { DatePicker } from '@core/ui/datepicker';

interface DateFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  placeholder?: string;
  error?: FieldError;
  className?: string;
}

export default function DateField({
  name,
  control,
  label,
  placeholder = 'Sélectionner une date',
  error,
  className,
}: DateFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange } }) => (
        <DatePicker
          inputProps={{
            label: label.replace('(AAAA/MM/JJ)', '(JJ/MM/AAAA)').replace('(AAAAMM/JJ)', '(JJ/MM/AAAA)'),
            error: error?.message,
          }}
          placeholderText={placeholder}
          dateFormat="dd/MM/yyyy"
          selected={value ? (typeof value === 'string' ? new Date(value) : value instanceof Date ? value : new Date(value)) : null}
          onChange={(date) => {
            // Convertir la Date en string ISO pour la validation Zod
            if (date) {
              onChange(date.toISOString().split('T')[0]); // Format YYYY-MM-DD
            } else {
              onChange('');
            }
          }}
          className={className}
        />
      )}
    />
  );
}

