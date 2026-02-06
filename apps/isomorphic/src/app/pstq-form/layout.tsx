import Header from '@/app/pstq-form/header';
import Footer from '@/app/pstq-form/footer';

export default function PSTQFormLayout({
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

