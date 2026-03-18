import { Header } from '@/components/Header';
import { PromoStrip } from '@/components/PromoStrip';
import { Footer } from '@/components/Footer';
import { ChatWidget } from '@/components/ChatWidget';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Outlet } from 'react-router-dom';
import { CookieConsent } from '@/components/CookieConsent';

export const Layout = () => {
  return (
    <>
      <div className="min-h-screen bg-background flex flex-col">
        <ScrollToTop />
        <PromoStrip />
        <Header />
        <div
          className="flex flex-1 flex-col transition-[padding-top] duration-300 ease-out"
          style={{ paddingTop: 'calc(var(--header-height, 72px) + var(--promo-strip-height, 0px))' }}
        >
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
      <CookieConsent />
      <ChatWidget />
    </>
  );
};
