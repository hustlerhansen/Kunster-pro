import { Logo } from "./logo";
import { SearchForm } from "./search-form";
import { HeaderActions } from "./header-actions";
import { MainNav } from "./main-nav";
import { MobileMenu } from "./mobile-menu";
import { TopBanner } from "./top-banner";
import { CartSheet } from "./cart/cart-sheet";
import { DemoNotice } from "./demo-notice";

export function SiteHeader() {
  return (
    <header>
      <DemoNotice />
      <TopBanner />
      <div className="bg-white">
        <div className="container-page flex items-center gap-2 py-4 sm:gap-3 lg:gap-10 lg:py-5">
          <MobileMenu />
          <Logo className="min-w-0 shrink" />
          <SearchForm className="mx-auto hidden max-w-xl md:flex" />
          <div className="ml-auto md:ml-0">
            <HeaderActions />
          </div>
        </div>
        <div className="container-page pb-3 md:hidden">
          <SearchForm id="sok-mobil" />
        </div>
      </div>
      <MainNav />
      <CartSheet />
    </header>
  );
}
