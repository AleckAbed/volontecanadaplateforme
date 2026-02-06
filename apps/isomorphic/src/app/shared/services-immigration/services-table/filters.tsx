'use client';

import { Badge, Box, Button, Flex, Input, Text, Title } from 'rizzui';
import StatusField from '@core/components/controlled-table/status-field';
import { type Table as ReactTableType } from '@tanstack/react-table';
import { PiMagnifyingGlassBold, PiTrashDuotone } from 'react-icons/pi';
import ModalButton from '@/app/shared/modal-button';
import CreateService from '../create-service';
import { servicesList } from '@/data/services-immigration';

const statusOptions = [
  {
    value: 'active',
    label: 'Actif',
  },
  {
    value: 'inactive',
    label: 'Inactif',
  },
  {
    value: 'pending',
    label: 'En attente',
  },
];

const categories = Array.from(
  new Set(servicesList.map((service) => service.category))
).map((category) => ({
  label: category,
  value: category,
}));

interface TableToolbarProps<T extends Record<string, any>> {
  table: ReactTableType<T>;
}

export default function Filters<TData extends Record<string, any>>({
  table,
}: TableToolbarProps<TData>) {
  const isFiltered =
    table.getState().globalFilter || table.getState().columnFilters.length > 0;
  return (
    <Box className="mb-4 @container">
      <Flex
        gap="3"
        align="center"
        justify="between"
        className="w-full flex-wrap @4xl:flex-nowrap"
      >
        <Title
          as="h3"
          className="rizzui-title-h3 order-1 whitespace-nowrap pe-4 text-base font-semibold sm:text-lg"
        >
          Tous les Services
        </Title>
        <Flex
          align="center"
          direction="col"
          gap="2"
          className="order-4 @lg:grid @lg:grid-cols-2 @4xl:order-2 @4xl:flex @4xl:flex-row"
        >
          <StatusField
            placeholder="Filtrer par statut"
            options={statusOptions}
            value={table.getColumn('status')?.getFilterValue() ?? []}
            onChange={(e) => table.getColumn('status')?.setFilterValue(e)}
            getOptionValue={(option) => option.value}
            dropdownClassName="!z-10 h-auto"
            className="@4xl:w-40"
            getOptionDisplayValue={(option) =>
              renderOptionDisplayValue(option.value as string)
            }
            displayValue={(selected: string) =>
              renderOptionDisplayValue(selected)
            }
          />
          <StatusField
            placeholder="Filtrer par catégorie"
            options={categories}
            value={table.getColumn('category')?.getFilterValue() ?? []}
            onChange={(e) => table.getColumn('category')?.setFilterValue(e)}
            getOptionValue={(option) => option.value}
            dropdownClassName="!z-10"
            className="@4xl:w-40"
          />
          {isFiltered && (
            <Button
              size="sm"
              onClick={() => {
                table.resetGlobalFilter();
                table.resetColumnFilters();
              }}
              variant="flat"
              className="h-9 w-full bg-gray-200/70 @lg:col-span-full @4xl:w-auto"
            >
              <PiTrashDuotone className="me-1.5 size-[17px]" /> Effacer
            </Button>
          )}
        </Flex>
        <Input
          type="search"
          clearable={true}
          placeholder="Rechercher un service..."
          value={table.getState().globalFilter ?? ''}
          onClear={() => table.setGlobalFilter('')}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          prefix={<PiMagnifyingGlassBold className="size-4" />}
          className="order-3 h-9 w-full @2xl:order-2 @2xl:ms-auto @2xl:h-auto @2xl:max-w-60 @4xl:order-3"
        />
        <Box className="order-2 ms-4 @2xl:order-3 @2xl:ms-0 @4xl:order-4 @4xl:shrink-0">
          <ModalButton
            label="Ajouter un Service"
            view={<CreateService />}
            customSize={700}
            className="mt-0"
          />
        </Box>
      </Flex>
    </Box>
  );
}

function renderOptionDisplayValue(value: string) {
  switch (value) {
    case 'active':
      return (
        <div className="flex items-center">
          <Badge color="success" renderAsDot />
          <Text className="ms-2 font-medium capitalize text-green-dark">
            Actif
          </Text>
        </div>
      );
    case 'inactive':
      return (
        <div className="flex items-center">
          <Badge color="danger" renderAsDot />
          <Text className="ms-2 font-medium capitalize text-red-dark">
            Inactif
          </Text>
        </div>
      );
    default:
      return (
        <div className="flex items-center">
          <Badge renderAsDot className="bg-orange-dark" />
          <Text className="ms-2 font-medium capitalize text-orange-dark">
            En attente
          </Text>
        </div>
      );
  }
}




