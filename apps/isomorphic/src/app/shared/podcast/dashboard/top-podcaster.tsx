'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import WidgetCard from '@core/components/cards/widget-card';
import cn from '@core/utils/class-names';
import Image from 'next/image';
import { Box } from 'rizzui/box';
import { Button } from 'rizzui/button';
import { Flex } from 'rizzui/flex';
import { Text, Title } from 'rizzui/typography';
import { newsService, NewsSource } from '@/services/news';

export default function TopPodcaster({ className }: { className?: string }) {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService.listSources()
      .then(setSources)
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleFollow = async (id: number, currentlyFollowing: boolean) => {
    try {
      if (currentlyFollowing) await newsService.unfollowSource(id);
      else await newsService.followSource(id);
      setSources((prev) => prev.map((s) =>
        s.id === id
          ? { ...s, is_following: !currentlyFollowing, followers_count: s.followers_count + (currentlyFollowing ? -1 : 1) }
          : s
      ));
    } catch (e: any) {
      toast.error(e?.message ?? 'Action impossible');
    }
  };

  return (
    <WidgetCard
      className={
        (cn(className),
        'flex max-h-[420px] flex-col @5xl/pod:max-h-[390px] @6xl/pod:max-h-[420px] 3xl:max-h-[500px] 4xl:!max-h-[600px] [@media(min-width:2300px)]:max-h-[550px]')
      }
      title="Sources officielles"
      headerClassName="mb-6"
    >
      <Box className="custom-scrollbar h-full flex-1 overflow-y-auto">
        {loading ? (
          <Text className="py-4 text-center text-gray-400">Chargement…</Text>
        ) : sources.length === 0 ? (
          <Text className="py-4 text-center text-gray-400">Aucune source.</Text>
        ) : (
          sources.map((source) => (
            <SourceItem
              data={source}
              key={source.id}
              onToggleFollow={() => toggleFollow(source.id, !!source.is_following)}
            />
          ))
        )}
      </Box>
    </WidgetCard>
  );
}

const formatNumber = (number: number) => {
  return new Intl.NumberFormat('fr-CA').format(number);
};

export function SourceItem({
  data: { avatar, followers_count, is_following, name },
  onToggleFollow,
}: {
  data: NewsSource;
  onToggleFollow?: () => void;
}) {
  const following = !!is_following;
  const followers = followers_count ?? 0;
  return (
    <Flex
      gap="3"
      justify="between"
      align="center"
      className="border-b border-dashed py-5 first:pt-0 last:border-b-0 last:pb-0"
    >
      <Box className="relative aspect-square size-12 flex-shrink-0 overflow-hidden rounded-lg">
        {avatar ? (
          <Image
            className="object-cover object-center"
            src={avatar}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-600">
            {name.charAt(0)}
          </div>
        )}
      </Box>
      <Box className="w-full">
        <Title
          as="h6"
          className="line-clamp-1 font-inter text-base font-medium"
        >
          {name}
        </Title>
        <Text className="text-sm">{formatNumber(followers)} abonnés</Text>
      </Box>
      <Button
        size="sm"
        variant={following ? 'solid' : 'outline'}
        className="min-w-20"
        onClick={onToggleFollow}
      >
        {following ? 'Suivi' : 'Suivre'}
      </Button>
    </Flex>
  );
}
