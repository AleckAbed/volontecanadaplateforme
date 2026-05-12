'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PiArrowRightBold } from 'react-icons/pi';
import { Box } from 'rizzui/box';
import { Flex } from 'rizzui/flex';
import { Grid } from 'rizzui/grid';
import { Text, Title } from 'rizzui/typography';
import WidgetCard from '@core/components/cards/widget-card';
import cn from '@core/utils/class-names';
import { newsService, NewsArticle } from '@/services/news';

export default function RecentlyPlayed({ className }: { className?: string }) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService.listPublicArticles({ limit: 4 })
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard
      headerClassName="mb-6 items-baseline"
      title="Annonces récentes"
      action={
        <Link
          href={'/admin/news/articles'}
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          Voir tout
        </Link>
      }
      className={cn('@container', className)}
    >
      {loading ? (
        <Text className="py-8 text-center text-gray-400">Chargement…</Text>
      ) : articles.length === 0 ? (
        <Text className="py-8 text-center text-gray-400">Aucune annonce publiée.</Text>
      ) : (
        <Grid className="grid-cols-2 gap-5 @xl:grid-cols-4 @4xl:gap-7">
          {articles.map((article) => (
            <RecentNewsItem data={article} key={article.id} />
          ))}
        </Grid>
      )}
    </WidgetCard>
  );
}

export function RecentNewsItem({ data }: { data: NewsArticle }) {
  const thumb = data.thumbnail || 'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/recent-played-image-1.webp';
  const author = data.source?.name || '—';
  return (
    <Box className="group cursor-pointer">
      <Box className="relative mb-3 aspect-square overflow-hidden rounded-xl">
        <Image
          src={thumb}
          alt={data.title}
          fill
          className="size-full object-cover object-center transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw"
        />
        <Flex
          justify="center"
          align="center"
          className="invisible absolute inset-0 bg-black/40 opacity-0 transition duration-300 group-hover:visible group-hover:opacity-100"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900">
            Lire <PiArrowRightBold />
          </span>
        </Flex>
      </Box>
      <Title as="h6" className="font-inter line-clamp-2 text-sm font-semibold">
        {data.title}
      </Title>
      <Text className="mt-1 text-xs text-gray-500">{author}</Text>
    </Box>
  );
}
