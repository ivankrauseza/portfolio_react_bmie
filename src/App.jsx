import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import CurrencyProvider from './lib/CurrencyProvider.jsx'
import { RequireValidRentalPeriod } from './lib/routeGuards.jsx'
import About from './pages/About.jsx'
import AccessibilityPolicy from './pages/AccessibilityPolicy.jsx'
import Cars from './pages/Cars.jsx'
import ConfirmBooking from './pages/ConfirmBooking.jsx'
import Contact from './pages/Contact.jsx'
import CookiePolicy from './pages/CookiePolicy.jsx'
import Home from './pages/Home.jsx'
import DriverInfo from './pages/DriverInfo.jsx'
import OptionalExtras from './pages/OptionalExtras.jsx'
import PrivacyPolicy from './pages/PrivacyPolicy.jsx'
import TermsOfService from './pages/TermsOfService.jsx'
import Work from './pages/Work.jsx'

function App() {
  return (
    <CurrencyProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route
            path="cars"
            element={
              <RequireValidRentalPeriod>
                <Cars />
              </RequireValidRentalPeriod>
            }
          />
          <Route
            path="extras"
            element={
              <RequireValidRentalPeriod>
                <OptionalExtras />
              </RequireValidRentalPeriod>
            }
          />
          <Route
            path="driver-info"
            element={
              <RequireValidRentalPeriod>
                <DriverInfo />
              </RequireValidRentalPeriod>
            }
          />
          <Route
            path="confirm"
            element={
              <RequireValidRentalPeriod>
                <ConfirmBooking />
              </RequireValidRentalPeriod>
            }
          />
          <Route path="work" element={<Work />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="cookie-policy" element={<CookiePolicy />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
          <Route path="accessibility-policy" element={<AccessibilityPolicy />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </CurrencyProvider>
  )
}

export default App
