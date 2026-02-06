import Header from '@/app/client-form/header';

export default function ClientFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen @container">
      {/* Image de fond */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bg0.jpg)',
        }}
      />
      {/* Overlay dégradé rouge avec opacité */}
      <div className="fixed inset-0 bg-gradient-to-r from-red-600/70 to-red-800/70" />
      {/* Contenu */}
      <div className="relative z-10">
        <Header />
        {children}
      </div>
    </div>
  );
}

