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
        <div className="container-page flex items-center gap-3 py-4 lg:gap-10 lg:py-5">
          <MobileMenu />
          <Logo className="shrink-0" />
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
