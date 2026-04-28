import { NavLink, Outlet } from 'react-router-dom'
import awardIcon from '../assets/award-svgrepo-com.svg'
import { supportedCurrencies, useCurrency } from '../lib/currency.js'
import MaterialIcon from './MaterialIcon.jsx'

const headerNavLinkClass = ({ isActive }) =>
  `transition hover:text-[#333333] ${
    isActive ? 'text-[#333333]' : 'text-[#333333]'
  }`

const footerNavLinkClass = ({ isActive }) =>
  `transition hover:text-[#333333] ${isActive ? 'text-[#333333]' : 'text-[#333333]'}`

const footerLinks = [
  { label: 'Corporate', to: '/about' },
  { label: 'Contact us', to: '/contact' },
  { label: 'Cookie policy', to: '/cookie-policy' },
  { label: 'Privacy policy', to: '/privacy-policy' },
  { label: 'Terms of service', to: '/terms-of-service' },
  { label: 'Accessibility policy', to: '/accessibility-policy' },
]

const footerPrimaryLinks = [
  { label: 'Find a car', to: '/' },
  { label: 'How it works', to: '/work' },
  { label: 'About us', to: '/about' },
  { label: 'Contact us', to: '/contact' },
]

function AppShell() {
  const { currency, isLoadingRate, rateError, setCurrency } = useCurrency()

  const updateCurrency = (event) => {
    setCurrency(event.target.value)
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#cccccc] text-[#333333]">
      <header className="w-full border-b border-slate-200 bg-white px-8 md:px-16 lg:px-24">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <NavLink className="text-2xl font-semibold tracking-normal text-[#333333]" to="/">
            sparrow
          </NavLink>

          <nav aria-label="Primary navigation">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold uppercase text-[#333333]">
              <li>
                <NavLink className={headerNavLinkClass} to="/" end>
                  Find a car
                </NavLink>
              </li>
              <li>
                <NavLink className={headerNavLinkClass} to="/work">
                  How it works
                </NavLink>
              </li>
              <li>
                <NavLink className={headerNavLinkClass} to="/about">
                  About us
                </NavLink>
              </li>
              <li>
                <NavLink className={headerNavLinkClass} to="/contact">
                  Contact
                </NavLink>
              </li>
              <li>
                <div className="relative">
                  <label className="sr-only" htmlFor="currency">
                    Currency
                  </label>
                  <select
                    className="h-10 appearance-none rounded-md border border-slate-200 bg-white py-0 pl-3 pr-9 text-sm font-semibold uppercase text-[#333333] outline-none transition hover:border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                    id="currency"
                    name="currency"
                    onChange={updateCurrency}
                    value={currency}
                  >
                    {supportedCurrencies.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.symbol} {item.code}
                      </option>
                    ))}
                  </select>
                  <MaterialIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xl leading-none text-[#333333]">
                    expand_more
                  </MaterialIcon>
                </div>
                {isLoadingRate || rateError ? (
                  <p className="mt-1 text-xs normal-case text-[#333333]">
                    {isLoadingRate ? 'Updating rates...' : rateError}
                  </p>
                ) : null}
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="w-full border-t border-[#cccccc] bg-white px-8 md:px-16 lg:px-24">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 py-14 text-left text-[#333333] md:grid-cols-[1.1fr_1fr_1fr] lg:py-20">
          <div className="flex flex-col items-start gap-8">
            <NavLink
              className="text-3xl font-bold tracking-normal text-[#333333]"
              to="/"
            >
              sparrow
            </NavLink>
            <img
              alt="Sparrow award emblem"
              className="h-28 w-28 object-contain"
              src={awardIcon}
            />
          </div>

          <nav aria-label="Primary footer navigation">
            <ul className="space-y-4 text-2xl font-medium leading-tight">
              {footerPrimaryLinks.map((link) => (
                <li key={link.to}>
                  <NavLink className={footerNavLinkClass} to={link.to}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Policy footer navigation">
            <ul className="space-y-4 text-sm font-medium">
              {footerLinks.map((link) => (
                <li key={`${link.to}-${link.label}`}>
                  <NavLink className={footerNavLinkClass} to={link.to}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 border-t border-[#cccccc] py-6 text-left text-sm font-bold uppercase text-[#333333] md:flex-row md:items-center md:justify-between">
          <p>
            <span className="mr-2 inline-block h-2 w-2 bg-pink-500" />
            Sparrow car rental ©2026
          </p>
          <button
            aria-label="Back to top"
            className="flex h-10 w-10 items-center justify-center bg-pink-500 text-white transition hover:bg-pink-600"
            onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}
            type="button"
          >
            <MaterialIcon className="text-2xl leading-none">
              keyboard_arrow_up
            </MaterialIcon>
          </button>
        </div>
      </footer>
    </div>
  )
}

export default AppShell
