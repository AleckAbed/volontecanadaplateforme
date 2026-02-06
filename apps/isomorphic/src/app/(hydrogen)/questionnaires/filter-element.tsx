'use client';

import React from 'react';
import { PiTrashDuotone } from 'react-icons/pi';
import StatusField from '@core/components/controlled-table/status-field';
import { Button } from 'rizzui';
import DateFiled from '@core/components/controlled-table/date-field';
import { getDateRangeStateValues } from '@core/utils/get-formatted-date';

const statusOptions = [
  {
    value: 'pending',
    label: 'En attente',
  },
  {
    value: 'in_progress',
    label: 'En cours',
  },
  {
    value: 'completed',
    label: 'Complété',
  },
  {
    value: 'expired',
    label: 'Expiré',
  },
];

const formTypeOptions = [
  {
    value: 'questionnaire_demandeur_001',
    label: 'Questionnaire Demandeur 001',
  },
  {
    value: 'questionnaire_repondant',
    label: 'Questionnaire Répondant',
  },
  {
    value: 'questionnaire_pstq_pointage',
    label: 'Questionnaire PSTQ Pointage',
  },
];

type FilterElementProps = {
  isFiltered: boolean;
  filters: { [key: string]: any };
  updateFilter: (columnId: string, filterValue: string | any[]) => void;
  handleReset: () => void;
};

export default function FilterElement({
  isFiltered,
  filters,
  updateFilter,
  handleReset,
}: FilterElementProps) {
  return (
    <>
      <StatusField
        label="Statut"
        options={statusOptions}
        value={filters['status']}
        onChange={(value: string) => {
          updateFilter('status', value);
        }}
        getOptionValue={(option: { value: any; label?: string }) => option.value}
        getOptionDisplayValue={(option: { value: any; label?: string }) => option.label || ''}
        displayValue={(selected: string) => {
          const option = statusOptions.find((opt) => opt.value === selected);
          return option?.label || '';
        }}
        dropdownClassName="h-auto"
      />
      <StatusField
        label="Type de formulaire"
        options={formTypeOptions}
        value={filters['form_type']}
        onChange={(value: string) => {
          updateFilter('form_type', value);
        }}
        getOptionValue={(option: { value: any; label?: string }) => option.value}
        getOptionDisplayValue={(option: { value: any; label?: string }) => option.label || ''}
        displayValue={(selected: string) => {
          const option = formTypeOptions.find((opt) => opt.value === selected);
          return option?.label || '';
        }}
        dropdownClassName="h-auto"
      />
      <DateFiled
        selected={getDateRangeStateValues(filters['sent_at']?.[0])}
        startDate={getDateRangeStateValues(filters['sent_at']?.[0]) as Date}
        endDate={getDateRangeStateValues(filters['sent_at']?.[1]) as Date}
        onChange={(date: any) => {
          updateFilter('sent_at', date);
        }}
        className="w-full"
        selectsRange
        placeholderText="Sélectionner la date d'envoi"
        inputProps={{
          label: "Date d'envoi",
          labelClassName: 'font-medium text-gray-700',
        }}
      />
      <DateFiled
        selected={getDateRangeStateValues(filters['expires_at']?.[0])}
        startDate={getDateRangeStateValues(filters['expires_at']?.[0]) as Date}
        endDate={getDateRangeStateValues(filters['expires_at']?.[1]) as Date}
        onChange={(date: any) => {
          updateFilter('expires_at', date);
        }}
        className="w-full"
        selectsRange
        placeholderText="Sélectionner la date d'expiration"
        inputProps={{
          label: "Date d'expiration",
          labelClassName: 'font-medium text-gray-700',
        }}
      />
      {isFiltered ? (
        <Button
          size="sm"
          onClick={() => {
            handleReset();
          }}
          className="h-8 bg-gray-200/70"
          variant="flat"
        >
          <PiTrashDuotone className="me-1.5 h-[17px] w-[17px]" /> Réinitialiser
        </Button>
      ) : null}
    </>
  );
}



