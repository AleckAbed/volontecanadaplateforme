'use client';

import { Button } from 'rizzui';
import { PiPlus, PiTrash } from 'react-icons/pi';
import { DatePicker } from '@core/ui/datepicker';

interface DynamicTableProps<T> {
  title: string;
  description?: string;
  columns: Array<{
    key: string;
    label: string;
    type?: 'text' | 'date' | 'select' | 'number';
    options?: Array<{ label: string; value: string }>;
    placeholder?: string;
  }>;
  data: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: any) => void;
  maxRows?: number;
}

export default function DynamicTable<T extends Record<string, any>>({
  title,
  description,
  columns,
  data,
  onAdd,
  onRemove,
  onUpdate,
  maxRows = 10,
}: DynamicTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <div className="mb-4 grid grid-cols-12 gap-4 items-start">
        <div className="col-span-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm font-normal text-gray-600 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {data.length < maxRows && (
          <div className="col-span-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            className="gap-2"
          >
            <PiPlus className="h-4 w-4" />
            Ajouter une ligne
          </Button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300"
                >
                  {col.label}
                </th>
              ))}
              <th className="w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  Aucune donnée. Cliquez sur "Ajouter une ligne" pour commencer.
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3">
                      {col.type === 'select' && col.options ? (
                        <select
                          className="w-full rounded-md border-gray-300 text-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          value={row[col.key] || ''}
                          onChange={(e) => onUpdate(index, col.key, e.target.value)}
                        >
                          <option value="">{col.placeholder || 'Sélectionner'}</option>
                          {col.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : col.type === 'date' ? (
                        <div className="min-w-[140px] [&_.react-datepicker-wrapper]:w-full">
                          <DatePicker
                            selected={row[col.key] ? new Date(row[col.key]) : null}
                            onChange={(date: Date | null) => {
                              onUpdate(index, col.key, date ? date.toISOString().split('T')[0] : '');
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText={col.placeholder || 'JJ/MM/AAAA'}
                            inputProps={{
                              className: 'w-full rounded-md border-gray-300 text-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white',
                            }}
                          />
                        </div>
                      ) : col.type === 'number' ? (
                        <input
                          type="number"
                          className="w-full rounded-md border-gray-300 text-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          value={row[col.key] || ''}
                          onChange={(e) => onUpdate(index, col.key, e.target.value)}
                          placeholder={col.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          className="w-full rounded-md border-gray-300 text-sm focus:border-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          value={row[col.key] || ''}
                          onChange={(e) => onUpdate(index, col.key, e.target.value)}
                          placeholder={col.placeholder}
                        />
                      )}
                    </td>
                  ))}
                  <td className="w-24 px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemove(index)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Supprimer cette ligne"
                    >
                      <PiTrash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

