import { Inter, Lexend_Deca } from 'next/font/google';

// preload: false évite l'avertissement "preloaded resource was not used" (Next.js injecte un preload parfois non consommé à temps)
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  preload: false,
});

export const lexendDeca = Lexend_Deca({
  subsets: ['latin'],
  variable: '--font-lexend',
  preload: false,
});
