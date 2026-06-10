'use client';

import React, { SVGProps } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { PiArrowRightBold, PiCalendarDuotone, PiEyeDuotone, PiPencilDuotone, PiBookOpenDuotone } from 'react-icons/pi';
import { Box } from 'rizzui/box';
import { Flex } from 'rizzui/flex';
import { Text, Title } from 'rizzui/typography';
import { Button } from 'rizzui/button';
import cn from '@core/utils/class-names';
import { currentArticleAtom } from '../current-article-atom';

/**
 * Right-side preview panel for the Nouvelles dashboard.
 * Displays the article currently selected from "Annonces récentes" or other
 * lists. Falls back to a default placeholder when nothing is selected.
 */
export default function MusicPlayer({ className }: { className?: string }) {
  const article = useAtomValue(currentArticleAtom);

  const title = article?.title ?? 'Sélectionnez un article';
  const sourceName = article?.source?.name ?? 'Volonté Canada';
  const thumb = article?.thumbnail
    ?? 'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/recent-played-image-2.webp';
  const summary = article?.summary
    ?? 'Cliquez sur une annonce récente pour la prévisualiser ici.';

  return (
    <Box
      className={cn(
        'relative overflow-hidden rounded-xl border px-5 py-5 2xl:px-6 2xl:py-7',
        className
      )}
    >
      {/* Thumb */}
      <Box className="relative">
        <Box className="relative inline-flex w-full items-center justify-center">
          <Box className="relative aspect-square w-[152px] overflow-hidden rounded-xl border bg-primary">
            <Image src={thumb} alt={title} fill className="object-cover object-center" />
          </Box>
          <ThumbBorder className="pointer-events-none absolute size-[200px] text-gray-900/15" />
        </Box>

        <Box className="relative mt-4 text-center">
          {article?.category?.name && (
            <Text className="text-[10px] font-semibold uppercase tracking-wide text-primary">
              {article.category.name}
            </Text>
          )}
          <Title as="h5" className="mt-1 font-inter text-base font-bold leading-tight line-clamp-3">
            {title}
          </Title>
          <Text className="mt-2 text-xs text-gray-500">{sourceName}</Text>
        </Box>

        <BackgroundShapes className="absolute inset-5 -z-[1] max-h-full w-[calc(100%-40px)] object-cover text-gray-900" />
      </Box>

      {/* Metadata */}
      <Flex gap="3" justify="center" className="mt-4 text-[11px] text-gray-500">
        {article?.published_at && (
          <Flex gap="1" align="center">
            <PiCalendarDuotone className="h-4 w-4" />
            <span>{article.published_at}</span>
          </Flex>
        )}
        {article && (
          <Flex gap="1" align="center">
            <PiEyeDuotone className="h-4 w-4" />
            <span>{article.views_count}</span>
          </Flex>
        )}
        {article?.read_time && (
          <span>{article.read_time}</span>
        )}
      </Flex>

      {/* Summary */}
      <Box className="mt-4 border-t border-gray-200 pt-4">
        <Text className="line-clamp-4 text-center text-sm text-gray-600">
          {summary}
        </Text>
      </Box>

      {/* Actions */}
      {article && (
        <Box className="mt-5 grid grid-cols-2 gap-2">
          <Link href={`/admin/news/articles/${article.id}`}>
            <Button as="span" className="w-full gap-1.5 px-2">
              <PiBookOpenDuotone className="h-4 w-4 shrink-0" />
              <span className="truncate text-xs">Lire</span>
            </Button>
          </Link>
          <Link href={`/admin/news/articles/${article.id}/edit`}>
            <Button as="span" variant="outline" className="w-full gap-1.5 px-2">
              <PiPencilDuotone className="h-4 w-4 shrink-0" />
              <span className="truncate text-xs">Modifier</span>
            </Button>
          </Link>
        </Box>
      )}
    </Box>
  );
}

/** Decorative background — kept from the original podcast player design. */
const BackgroundShapes = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={437}
    height={244}
    viewBox="0 0 437 244"
    fill="none"
    {...props}
  >
    <circle cx="50" cy="50" r="2" fill="currentColor" fillOpacity={0.15} />
    <circle cx="380" cy="80" r="2" fill="currentColor" fillOpacity={0.15} />
    <circle cx="200" cy="180" r="2" fill="currentColor" fillOpacity={0.15} />
    <circle cx="100" cy="200" r="2" fill="currentColor" fillOpacity={0.15} />
    <circle cx="350" cy="200" r="2" fill="currentColor" fillOpacity={0.15} />
  </svg>
);

const ThumbBorder = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={200}
    height={200}
    viewBox="0 0 200 200"
    fill="none"
    {...props}
  >
    <circle
      cx="100"
      cy="100"
      r="98"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="3 5"
    />
  </svg>
);
