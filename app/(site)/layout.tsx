import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollToTop from "@/components/ScrollToTop";
import DemoBookingDrawer from "@/components/DemoBookingDrawer";
import Preloader from "@/components/Preloader";

// The site's pages: header, footer, smooth scrolling, the demo booking drawer
// and the preloader that covers them on a full page load.
// The demo confirmation page (app/book-demo/confirmed) sits outside this group
// with its own slim header, as in its design.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SmoothScroll />
      <Header />
      {children}
      <Footer />
      <ScrollToTop />
      <DemoBookingDrawer />
      <Preloader />
    </>
  );
}
