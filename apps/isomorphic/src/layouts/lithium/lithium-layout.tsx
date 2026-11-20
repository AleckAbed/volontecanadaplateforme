import Header from '@/layouts/lithium/lithium-header';
export default function LithiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-grow">
      <div className="flex w-full flex-col">
        <Header />
        <div className="flex flex-grow flex-col px-4 pb-6 md:px-5 lg:px-6 lg:pb-8 3xl:px-8 3xl:pt-4 4xl:px-10">
          {/* Bloc pleine largeur : une page centrée (mx-auto max-w-…) ne se rétrécit plus dans la colonne flexible. */}
          <div className="w-full min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
