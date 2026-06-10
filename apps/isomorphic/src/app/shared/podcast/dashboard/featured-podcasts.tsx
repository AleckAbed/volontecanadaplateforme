'use client';

import { useEffect, useState } from 'react';
import cn from '@core/utils/class-names';
import Image from 'next/image';
import Link from 'next/link';
import { Box } from 'rizzui/box';
import { Button } from 'rizzui/button';
import { Flex } from 'rizzui/flex';
import { Grid } from 'rizzui/grid';
import { Title, Text } from 'rizzui/typography';
import { useSetAtom, useAtomValue } from 'jotai';
import { newsService, NewsArticle } from '@/services/news';
import { currentArticleAtom } from './current-article-atom';

export default function FeaturedPodcasts({
  className,
}: {
  className?: string;
}) {
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService.listPublicArticles({ featuredOnly: true, limit: 6 })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box className={cn('col-span-full @container', className)}>
      <Flex justify="between" align="center" className="mb-3 2xl:mb-5">
        <Title as="h3" className="text-lg font-semibold xl:text-xl">
          Articles à la une
        </Title>
        <Link
          href="/admin/news/articles"
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          Voir tout
        </Link>
      </Flex>

      {loading ? (
        <Text className="py-8 text-center text-gray-400">Chargement…</Text>
      ) : items.length === 0 ? (
        <Text className="py-8 text-center text-gray-400">Aucun article à la une.</Text>
      ) : (
        <Grid className="grid-cols-1 gap-6 @xl:grid-cols-2 @4xl:grid-cols-3">
          {items.map((article) => (
            <FeaturedArticleItem
              key={article.id}
              article={article}
              className="@xl:[&:nth-child(3)]:hidden @4xl:[&:nth-child(3)]:flex @4xl:[&:nth-child(n+4)]:hidden"
            />
          ))}
        </Grid>
      )}
    </Box>
  );
}

function FeaturedArticleItem({
  article,
  className,
}: {
  article: NewsArticle;
  className?: string;
}) {
  const setCurrent = useSetAtom(currentArticleAtom);
  const current = useAtomValue(currentArticleAtom);
  const isActive = current?.id === article.id;
  const thumb = article.thumbnail
    || 'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/featured-podcast-1.webp';

  const handlePreview = () => setCurrent(article);

  return (
    <Flex
      direction="col"
      gap="2"
      className={cn(
        'rounded-xl border bg-white p-3 transition dark:bg-gray-50',
        isActive ? 'border-primary ring-2 ring-primary/40' : 'border-muted hover:border-primary/40',
        className
      )}
    >
      <button
        type="button"
        onClick={handlePreview}
        className="relative block aspect-[309/200] w-full overflow-hidden rounded-[10px]"
        aria-label={`Prévisualiser ${article.title}`}
      >
        <Image
          src={thumb}
          alt={article.title}
          fill
          className="object-cover transition duration-500 hover:scale-105"
        />
        <span className="absolute left-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
          ★ À la une
        </span>
        {isActive && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
            En lecture
          </span>
        )}
      </button>
      <Flex direction="col" gap="2" className="mt-2 grow px-3">
        <Text
          as="span"
          className="block text-xs font-semibold uppercase text-primary"
        >
          {article.category?.name || 'Article'}
        </Text>
        <button
          type="button"
          onClick={handlePreview}
          className="block text-left"
        >
          <Title as="h4" className="line-clamp-2 text-base font-medium text-gray-900 hover:text-primary">
            {article.title}
          </Title>
        </button>
        <Flex align="end" justify="between" className="mt-auto flex-wrap pt-2">
          <Flex direction="col" className="w-auto gap-y-1">
            <Text as="span" className="block text-xs text-gray-600">
              {article.source?.name || '—'}
            </Text>
            {article.read_time && (
              <Text as="span" className="text-xs text-gray-400">
                ⏱ {article.read_time}
              </Text>
            )}
          </Flex>
          <Link href={`/admin/news/articles/${article.id}`}>
            <Button as="span" variant="outline" size="sm">
              Lire
            </Button>
          </Link>
        </Flex>
      </Flex>
    </Flex>
  );
}
