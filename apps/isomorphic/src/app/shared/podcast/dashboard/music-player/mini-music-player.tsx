'use client';

import cn from '@core/utils/class-names';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import Image from 'next/image';
import { PiX, PiXBold, PiArrowRightBold } from 'react-icons/pi';
import { Box } from 'rizzui/box';
import { Flex } from 'rizzui/flex';
import { Text, Title } from 'rizzui/typography';
import MusicPlayer from './music-player';
import { Modal } from '@core/modal-views/modal';
import { useEffect } from 'react';
import { currentArticleAtom } from '../current-article-atom';

export const miniMusicPlayerAtom = atom(false);
export const miniMusicPlayerFullAtom = atom(false);

/**
 * Mobile/compact preview bar for the Nouvelles dashboard.
 * Appears at the bottom of the screen when an article is selected.
 */
export default function MiniMusicPlayer({ className }: { className?: string }) {
  const article = useAtomValue(currentArticleAtom);
  const setCurrent = useSetAtom(currentArticleAtom);

  const [visible, setVisible] = useAtom(miniMusicPlayerAtom);
  const [fullOpen, setFullOpen] = useAtom(miniMusicPlayerFullAtom);

  // Show the mini-bar whenever an article is selected
  useEffect(() => {
    if (article) setVisible(true);
  }, [article, setVisible]);

  if (!article) return null;

  const thumb = article.thumbnail
    ?? 'https://isomorphic-furyroad.s3.amazonaws.com/public/podcast/recent-played-image-2.webp';

  return (
    <>
      {visible && (
        <Flex
          className={cn(
            'fixed inset-x-0 bottom-0 top-auto z-50 h-[60px] items-center gap-3 overflow-hidden rounded-none bg-gray-0 px-4 py-2 shadow-lg',
            className
          )}
        >
          <Box className="relative inline-block aspect-square size-10 shrink-0 overflow-hidden rounded-md border bg-primary">
            <Image src={thumb} alt={article.title} fill className="object-cover" />
          </Box>
          <button
            className="relative flex-1 text-left"
            onClick={() => setFullOpen(true)}
          >
            <Title as="h6" className="line-clamp-1 font-inter text-xs font-semibold">
              {article.title}
            </Title>
            <Flex gap="0" className="line-clamp-1 text-gray-400">
              <Text as="span" className="text-xs">
                {article.source?.name ?? 'Volonté Canada'}
              </Text>
            </Flex>
          </button>
          <Flex className="w-auto shrink-0 items-center gap-3">
            <button
              onClick={() => setFullOpen(true)}
              className="text-primary transition hover:text-primary-dark"
              aria-label="Voir l'article"
            >
              <PiArrowRightBold className="size-5" />
            </button>
            <button
              onClick={() => { setVisible(false); setCurrent(null); }}
              aria-label="Fermer"
            >
              <PiXBold className="size-5" />
            </button>
          </Flex>
        </Flex>
      )}
      <Modal
        isOpen={fullOpen}
        onClose={() => setFullOpen(false)}
        overlayClassName="opacity-0"
        size="full"
        containerClassName="backdrop-blur-lg bg-opacity-90 data-[closed]:translate-y-1/2"
      >
        <Flex
          align="center"
          justify="center"
          className="relative size-full min-h-screen"
        >
          <button
            className="absolute left-auto right-3 top-3 transition hover:text-gray-950"
            onClick={() => setFullOpen(false)}
            aria-label="Fermer"
          >
            <PiX className="size-5" />
          </button>
          <MusicPlayer className="w-full max-w-sm rounded-none border-none" />
        </Flex>
      </Modal>
    </>
  );
}
