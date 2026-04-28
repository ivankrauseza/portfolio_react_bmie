import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadTripSearch } from '../lib/tripSession.js'

function TripSummaryPill() {
  const tripSearch = loadTripSearch()
  const [locations, setLocations] = useState([])

  useEffect(() => {
    let active = true

    fetch('/api/rental/locations')
      .then((response) => response.json())
      .then((data) => {
        if (active) {
          setLocations(data.locations ?? [])
        }
      })
      .catch(() => {
        if (active) {
          setLocations([])
        }
      })

    return () => {
      active = false
    }
  }, [])

  const pickupLocation = findLocation(locations, tripSearch.pickupLocationId)
  const dropoffLocation = findLocation(locations, tripSearch.dropoffLocationId)

  return (
    <div className="flex min-h-10 w-full max-w-[1440px] items-center justify-between gap-4 rounded-full border border-slate-500 bg-white px-4 py-2 text-sm uppercase text-[#333333]">
      <p className="truncate">
        Pick up:{' '}
        <strong>
          {pickupLocation?.name ?? 'Selected airport'},{' '}
          {formatDate(tripSearch.pickupDate)} @ {tripSearch.pickupTime}
        </strong>
        {dropoffLocation || tripSearch.dropoffDate || tripSearch.dropoffTime ? (
          <>
            <span className="px-3">-</span>
            Drop off:{' '}
            <strong>
              {dropoffLocation?.name ?? pickupLocation?.name ?? 'Selected airport'}
              {tripSearch.dropoffDate
                ? `, ${formatDate(tripSearch.dropoffDate)}`
                : ''}
              {tripSearch.dropoffTime ? ` @ ${tripSearch.dropoffTime}` : ''}
            </strong>
          </>
        ) : null}
      </p>
      <Link
        className="shrink-0 font-semibold text-[#333333] transition hover:text-[#333333]"
        to="/"
      >
        Edit
      </Link>
    </div>
  )
}

function findLocation(locations, id) {
  return locations.find((location) => String(location.id) === String(id))
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  return new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

export default TripSummaryPill
