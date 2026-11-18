import { Metadata } from 'next';
import logoImg from '@public/logo.svg';
import { LAYOUT_OPTIONS } from '@/config/enums';
import logoIconImg from '@public/logo-short.svg';
import { OpenGraph } from 'next/dist/lib/metadata/types/opengraph-types';

enum MODE {
  DARK = 'dark',
  LIGHT = 'light',
}

// Nom commercial du produit — à confirmer (voir ROADMAP_SAAS.md, décision 2).
// Surchargeable par NEXT_PUBLIC_APP_NAME.
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || 'Volonté Canada';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.trim() || undefined;

export const siteConfig = {
  appName: APP_NAME,
  title: `${APP_NAME} — Gestion de cabinet d'immigration`,
  description: `${APP_NAME} : dossiers d'immigration, portail client, formulaires et documents pour les cabinets d'immigration canadiens.`,
  logo: logoImg,
  icon: logoIconImg,
  mode: MODE.LIGHT,
  layout: LAYOUT_OPTIONS.HYDROGEN,
  // TODO: favicon
};

export const metaObject = (
  title?: string,
  openGraph?: OpenGraph,
  description: string = siteConfig.description
): Metadata => {
  return {
    title: title ? `${title} — ${APP_NAME}` : siteConfig.title,
    description,
    openGraph: openGraph ?? {
      title: title ? `${title} — ${APP_NAME}` : siteConfig.title,
      description,
      url: APP_URL,
      siteName: APP_NAME,
      locale: 'fr_CA',
      type: 'website',
    },
  };
};
