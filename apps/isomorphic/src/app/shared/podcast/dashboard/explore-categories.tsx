'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@core/components/cards/widget-card';
import cn from '@core/utils/class-names';
import Link from 'next/link';
import {
  PiCaretRightBold,
  PiScalesDuotone,
  PiIdentificationCardDuotone,
  PiBuildingsDuotone,
  PiGlobeDuotone,
  PiUsersThreeDuotone,
  PiGraduationCapDuotone,
  PiFolderOpenDuotone,
} from 'react-icons/pi';
import { Flex } from 'rizzui/flex';
import { Grid } from 'rizzui/grid';
import { Title, Text } from 'rizzui/typography';
import { invitationsService, Category } from '@/services/invitations';

/** Map an icon name (stored in the DB) to an actual React icon component. */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  scales: PiScalesDuotone,
  passport: PiIdentificationCardDuotone,
  buildings: PiBuildingsDuotone,
  globe: PiGlobeDuotone,
  users: PiUsersThreeDuotone,
  'graduation-cap': PiGraduationCapDuotone,
};

const COLOR_MAP: Record<string, string> = {
  blue: 'text-blue-200',
  purple: 'text-purple-200',
  green: 'text-green-200',
  amber: 'text-amber-200',
  pink: 'text-pink-200',
  indigo: 'text-indigo-200',
  red: 'text-red-200',
  gray: 'text-gray-200',
};

export default function ExplorePodcastsCategories({
  className,
}: {
  className?: string;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invitationsService.listCategories({ type: 'news', activeOnly: true })
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard
      className={cn('@container', className)}
      headerClassName="mb-6 items-baseline"
      title="Lois & règlements IRCC"
      action={
        <Link
          href={'/configuration/categories'}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          Voir tout
        </Link>
      }
    >
      {loading ? (
        <Text className="py-8 text-center text-gray-400">Chargement…</Text>
      ) : categories.length === 0 ? (
        <Text className="py-8 text-center text-gray-400">Aucune catégorie. <Link href="/configuration/categories" className="text-blue-600 hover:underline">En créer</Link></Text>
      ) : (
        <Grid className="grid-cols-1 gap-5 @xl:grid-cols-3 @3xl:gap-5 @4xl:gap-7">
          {categories.slice(0, 6).map((category) => (
            <CategoryItem key={category.id} data={category} />
          ))}
        </Grid>
      )}
    </WidgetCard>
  );
}

function CategoryItem({ data }: { data: Category }) {
  const { name, icon, color } = data;
  const Icon = (icon && ICON_MAP[icon]) || PiFolderOpenDuotone;
  const iconColorClass = (color && COLOR_MAP[color]) || 'text-gray-200';

  return (
    <Flex
      justify="between"
      align="start"
      className="relative min-h-32 w-full flex-col overflow-hidden rounded-xl bg-gray-100 p-6 @2xl:min-h-40 @4xl:min-h-48"
    >
      <Title
        as="h4"
        className="relative z-[1] font-inter text-base font-semibold text-gray-900 @xl:text-lg @3xl:text-xl"
      >
        {name}
      </Title>
      <Link
        href={`/admin/news/articles?category_id=${data.id}`}
        className="group relative z-[1] inline-flex items-center text-xs font-semibold text-primary transition"
      >
        Consulter
        <PiCaretRightBold className="ml-0 transition-all group-hover:ml-1" />
      </Link>
      <Icon className={cn(
        'absolute -bottom-[20%] -right-[2%] left-auto top-auto size-40 -rotate-[30deg] dark:opacity-50',
        iconColorClass,
      )} />
    </Flex>
  );
}
