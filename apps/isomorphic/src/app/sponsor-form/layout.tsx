import Header from '@/app/sponsor-form/header';
import Footer from '@/app/sponsor-form/footer';

export default function SponsorFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-cover bg-fixed bg-center"
      style={{ backgroundImage: "url('/bg0.jpg')" }}
    >
      <div className="min-h-screen bg-gradient-to-r from-red-600/70 to-red-800/70 @container relative z-10">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  );
}

