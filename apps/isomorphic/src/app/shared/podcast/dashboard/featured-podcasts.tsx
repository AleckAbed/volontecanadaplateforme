'use client';

import { useEffect, useState } from 'react';
import WidgetCard from '@core/components/cards/widget-card';
import cn from '@core/utils/class-names';
import Image from 'next/image';
import Link from 'next/link';
import { PiArrowCircleRightFill } from 'react-icons/pi';
import { Box } from 'rizzui/box';
import { Flex } from 'rizzui/flex';
import { Grid } from 'rizzui/grid';
import { Title, Text } from 'rizzui/typography';
import { newsService, NewsArticle } from '@/services/news';

export default function FeaturedPodcasts({
  className,
}: {
  className?: string;
}) {
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService.listPublicArticles({ featuredOnly: true, limit: 4 })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard
      title="Articles à la une"
      headerClassName="mb-6 items-baseline"
      className={cn('@container', className)}
      action={
        <Link
          href={'/admin/news/articles'}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          Voir tout
        </Link>
      }
    >
      {loading ? (
        <Text className="py-8 text-center text-gray-400">Chargement…</Text>
      ) : items.length === 0 ? (
        <Text className="py-8 text-center text-gray-400">Aucun article à la une.</Text>
      ) : (
        <Grid className="grid-cols-2 gap-5 @xl:grid-cols-4 @4xl:gap-7">
          {items.map((program) => (
            <FeaturedProgram key={program.id} data={program} />
          ))}
        </Grid>
      )}
    </WidgetCard>
  );
}

function FeaturedProgram({ data }: { data: NewsArticle }) {
  const name = data.title;
  const thumb = data.thumbnail || 'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/featured-podcast-1.webp';
  return (
    <button className="group relative aspect-square overflow-hidden rounded-lg text-left">
      <Image
        src={thumb}
        alt={name}
        fill
        className="object-cover object-center transition duration-500 group-hover:scale-105"
      />
      <Flex
        direction="col"
        justify="between"
        align="start"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_100%)] p-3"
      >
        <Box className="relative z-[1] inline-flex size-6 rounded-full">
          <PiArrowCircleRightFill className="size-6 text-white drop-shadow" />
        </Box>
        <Title
          as="h6"
          className="line-clamp-3 font-inter text-xs font-medium text-white"
        >
          {name}
        </Title>
      </Flex>
    </button>
  );
}
