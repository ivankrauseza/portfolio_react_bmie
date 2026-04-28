import { Navigate, useSearchParams } from 'react-router-dom'
import {
  hasValidRentalPeriod,
  loadTripSearch,
  tripSearchFromParams,
} from './tripSession.js'

export function RequireValidRentalPeriod({ children }) {
  const [searchParams] = useSearchParams()
  const sessionTrip = loadTripSearch()
  const queryTrip = tripSearchFromParams(searchParams)
  const hasValidTrip =
    hasValidRentalPeriod(sessionTrip) || hasValidRentalPeriod(queryTrip)

  return hasValidTrip ? (
    children
  ) : (
    <Navigate
      replace
      state={{
        tripSearchError:
          'Please choose valid pickup and drop-off dates before continuing.',
      }}
      to="/"
    />
  )
}
