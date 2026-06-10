'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Badge } from 'rizzui';
import {
  PiArrowLeftBold,
  PiPencilDuotone,
  PiCalendarDuotone,
  PiEyeDuotone,
  PiClockDuotone,
  PiStarFill,
} from 'react-icons/pi';
import { newsService, NewsArticle } from '@/services/news';

export default function ViewArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation();
  const { id } = use(params);
  const router = useRouter();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    newsService.getArticle(Number(id))
      .then(setArticle)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-gray-400">{t('common.loading')}</div>;
  }

  if (!article) {
    return <div className="p-6 text-center text-red-500">{t('news.not_found')}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800"
        >
          <PiArrowLeftBold className="h-4 w-4" /> {t('clients.back')}
        </button>
        <div className="flex items-center gap-3">
          <Badge
            variant="flat"
            color={article.is_published ? 'success' : 'secondary'}
            rounded="lg"
          >
            {article.is_published ? t('news.published') : t('news.draft')}
          </Badge>
          <Link
            href={`/admin/news/articles/${article.id}/edit`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <PiPencilDuotone className="h-4 w-4" />
            {t('common.edit')}
          </Link>
        </div>
      </div>

      <article className="overflow-hidden rounded-xl bg-white shadow-sm">
        {article.thumbnail && (
          <div className="relative h-72 w-full bg-gray-100">
            <Image
              src={article.thumbnail}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="p-8">
          <div className="mb-4 flex items-center gap-3">
            {article.category?.name && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
                {article.category.name}
              </span>
            )}
            {article.is_featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <PiStarFill className="h-3 w-3" /> {t('news.featured')}
              </span>
            )}
          </div>

          <h1 className="mb-3 text-3xl font-bold leading-tight text-gray-900">
            {article.title}
          </h1>

          {article.summary && (
            <p className="mb-6 text-lg italic leading-relaxed text-gray-600">
              {article.summary}
            </p>
          )}

          <div className="mb-6 flex flex-wrap items-center gap-4 border-y border-gray-100 py-3 text-sm text-gray-500">
            {article.source && (
              <div className="flex items-center gap-2">
                {article.source.avatar && (
                  <div className="relative h-6 w-6 overflow-hidden rounded-full">
                    <Image src={article.source.avatar} alt={article.source.name} fill className="object-cover" />
                  </div>
                )}
                <span className="font-medium text-gray-700">{article.source.name}</span>
              </div>
            )}
            {article.published_at && (
              <div className="flex items-center gap-1">
                <PiCalendarDuotone className="h-4 w-4" />
                <span>{article.published_at}</span>
              </div>
            )}
            {article.read_time && (
              <div className="flex items-center gap-1">
                <PiClockDuotone className="h-4 w-4" />
                <span>{article.read_time}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <PiEyeDuotone className="h-4 w-4" />
              <span>{t(article.views_count !== 1 ? 'news.views_other' : 'news.views_one', { count: article.views_count })}</span>
            </div>
          </div>

          {article.content ? (
            <div
              className="prose prose-sm max-w-none text-gray-800
                         prose-headings:font-bold prose-headings:text-gray-900
                         prose-p:leading-relaxed
                         prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                         prose-strong:text-gray-900
                         prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <p className="text-sm italic text-gray-400">{t('news.no_content')}</p>
          )}

          {article.audio_url && (
            <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                {t('news.audio_version')}
              </p>
              <audio controls src={article.audio_url} className="w-full" />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-8 py-4 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>
              {article.created_by && <>{t('news.created_by')} <strong>{article.created_by}</strong></>}
              {article.created_at && <> · {article.created_at}</>}
            </span>
            <Link
              href="/admin/news/articles"
              className="text-blue-600 hover:underline"
            >
              {t('news.back_all')}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
