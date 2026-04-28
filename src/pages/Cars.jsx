import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import carDoorIcon from '../assets/car-door-left-1-svgrepo-com.svg'
import carPrimaryPlaceholder from '../assets/car-primary-placeholder.png'
import carRadioIcon from '../assets/car-radio-svgrepo-com.svg'
import carSeatIcon from '../assets/car-seat-svgrepo-com.svg'
import gearshiftIcon from '../assets/gearshift-shift-svgrepo-com.svg'
import MaterialIcon from '../components/MaterialIcon.jsx'
import { saveSelectedCar } from '../lib/bookingSession.js'
import { useCurrency } from '../lib/currency.js'
import {
  hasValidRentalPeriod,
  loadTripSearch,
  missingRentalPeriodReason,
  tripSearchFromParams,
  tripSearchToParams,
} from '../lib/tripSession.js'

function Cars() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedCar, setSelectedCar] = useState(null)
  const [openFilter, setOpenFilter] = useState('')
  const [filters, setFilters] = useState({
    driverAge: '30+',
    transmission: '',
    category: '',
    doors: '',
    order: 'lowest',
  })
  const [locations, setLocations] = useState([])
  const [cars, setCars] = useState([])
  const [error, setError] = useState('')
  const tripSearch = useMemo(() => getTripSearch(searchParams), [searchParams])
  const hasSearch = hasValidRentalPeriod(tripSearch)
  const [loading, setLoading] = useState(hasSearch)

  const query = useMemo(
    () => tripSearchToParams(tripSearch).toString(),
    [tripSearch],
  )

  useEffect(() => {
    let active = true

    if (!hasSearch) {
      return undefined
    }

    Promise.all([
      fetch('/api/rental/locations'),
      fetch(`/api/rental/cars?${query}`),
    ])
      .then(async ([locationsResponse, carsResponse]) => {
        if (!locationsResponse.ok || !carsResponse.ok) {
          throw new Error('Rental data could not be loaded.')
        }

        const locationsData = await locationsResponse.json()
        const carsData = await carsResponse.json()

        return {
          locations: locationsData.locations ?? [],
          cars: carsData.cars ?? [],
        }
      })
      .then((data) => {
        if (active) {
          setLocations(data.locations)
          setCars(data.cars)
          setError('')
        }
      })
      .catch(() => {
        if (active) {
          setError('We could not load cars for this search. Please try again.')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [hasSearch, query])

  const pickupLocation = findLocation(locations, tripSearch.pickupLocationId)
  const dropoffLocation = findLocation(locations, tripSearch.dropoffLocationId)
  const visibleCars = useMemo(
    () => filterAndSortCars(cars, filters),
    [cars, filters],
  )
  const missingSearchError = hasSearch ? '' : missingRentalPeriodReason(tripSearch)

  return (
    <section className="w-full flex-1 bg-slate-100 px-8 md:px-16 lg:px-24 py-10 text-[#333333]">
      <div className="mx-auto w-full max-w-[1440px]">
        <CheckoutProgress />

        <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-bold uppercase tracking-normal text-[#333333]">
            Pick a car:
          </h1>

          <TripSummary
            dropoffLocation={dropoffLocation}
            pickupLocation={pickupLocation}
            tripSearch={tripSearch}
          />
        </div>

        <FilterBar
          cars={cars}
          filters={filters}
          onChange={setFilters}
          onOpen={setOpenFilter}
          openFilter={openFilter}
        />

        <div className="min-h-[520px] rounded-b-md bg-white px-6 py-10 shadow-md">
          {loading ? <p className="text-[#333333]">Loading cars...</p> : null}

          {error || missingSearchError ? (
            <div className="rounded-md border border-red-200 bg-white px-4 py-3 text-[#333333]">
              {error || missingSearchError}
            </div>
          ) : null}

          {!loading && !error && !missingSearchError ? (
            <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleCars.map((car) => (
                <CarCard
                  car={car}
                  key={car.id}
                  onSelect={() => setSelectedCar(car)}
                />
              ))}
            </div>
          ) : null}

          {!loading && !error && !missingSearchError && visibleCars.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-white px-4 py-3 text-[#333333]">
              No cars match those filters. Try changing the filter values.
            </p>
          ) : null}
        </div>
      </div>

      {selectedCar ? (
        <CarDetailsModal
          car={selectedCar}
          onClose={() => setSelectedCar(null)}
          onContinue={() => {
            saveSelectedCar(selectedCar)
            navigate('/extras')
          }}
        />
      ) : null}
    </section>
  )
}

export function CheckoutProgress({ activeStep = 0 }) {
  const navigate = useNavigate()
  const steps = ['Pick a car', 'Optional extras', 'Driver info', 'Confirm & book']
  const routes = ['/cars', '/extras', '/driver-info', '/confirm']
  const completeClass = 'bg-green-600'
  const pendingClass = 'bg-[#999999]'

  return (
    <ol className="mx-auto mb-12 grid w-full max-w-[1440px] grid-cols-4 items-start">
      {steps.map((step, index) => {
        const isComplete = index <= activeStep
        const isConnectorComplete = index <= activeStep
        const canNavigateBack = index < activeStep

        return (
          <li className="relative text-center" key={step}>
            {index > 0 ? (
              <span
                className={`absolute left-[-50%] top-4 h-1 w-full ${
                  isConnectorComplete ? completeClass : pendingClass
                }`}
              />
            ) : null}
            {canNavigateBack ? (
              <button
                aria-label={`Go back to ${step}`}
                className={`relative z-10 mx-auto block h-8 w-8 rounded-full ${completeClass} transition hover:scale-110 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-pink-600 focus:ring-offset-2`}
                onClick={() => navigate(routes[index])}
                type="button"
              />
            ) : (
              <span
                className={`relative z-10 mx-auto block h-8 w-8 rounded-full ${
                  isComplete ? completeClass : pendingClass
                }`}
              />
            )}
            <span
              className={`mt-4 block text-sm font-bold uppercase ${
                isComplete ? 'text-[#333333]' : 'text-[#333333]'
              }`}
            >
              {step}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function TripSummary({ dropoffLocation, pickupLocation, tripSearch }) {
  return (
    <div className="flex min-h-10 w-full max-w-[1440px] items-center justify-between gap-4 rounded-full border border-slate-500 bg-white px-4 py-2 text-sm uppercase text-[#333333]">
      <p className="truncate">
        Pick up:{' '}
        <strong>
          {pickupLocation?.name ?? 'Selected airport'},{' '}
          {formatDate(tripSearch.pickupDate)} @ {formatTime(tripSearch.pickupTime)}
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
              {tripSearch.dropoffTime
                ? ` @ ${formatTime(tripSearch.dropoffTime)}`
                : ''}
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

function FilterBar({ cars, filters, onChange, onOpen, openFilter }) {
  const categories = uniqueValues(cars.map((car) => car.category))
  const transmissions = uniqueValues(cars.map((car) => car.transmission))
  const doors = uniqueValues(cars.map((car) => String(car.doors)))

  return (
    <div className="grid min-h-20 rounded-t-md bg-[#cccccc] text-[#333333] shadow-md lg:grid-cols-[1.3fr_1fr_1fr_1fr_0.8fr_1.2fr]">
      <div className="flex items-center px-7 text-sm font-bold uppercase">
        Filter vehicles
      </div>
      <FilterItem
        label="Driver age"
        name="driverAge"
        onChange={onChange}
        onOpen={onOpen}
        openFilter={openFilter}
        options={['25+', '30+', '45+']}
        value={filters.driverAge}
      />
      <FilterItem
        label="Gearbox type"
        name="transmission"
        onChange={onChange}
        onOpen={onOpen}
        openFilter={openFilter}
        options={transmissions}
        value={filters.transmission}
      />
      <FilterItem
        label="Car type"
        name="category"
        onChange={onChange}
        onOpen={onOpen}
        openFilter={openFilter}
        options={categories}
        value={filters.category}
      />
      <FilterItem
        label="Doors"
        name="doors"
        onChange={onChange}
        onOpen={onOpen}
        openFilter={openFilter}
        options={doors}
        value={filters.doors}
      />
      <FilterItem
        label="Order by"
        name="order"
        onChange={onChange}
        onOpen={onOpen}
        openFilter={openFilter}
        options={['lowest', 'highest']}
        value={filters.order}
      />
    </div>
  )
}

function FilterItem({ label, name, onChange, onOpen, openFilter, options, value }) {
  const isOpen = openFilter === name
  const displayValue = formatFilterValue(value, name)

  return (
    <div className="relative border-t border-slate-300 lg:border-l lg:border-t-0">
      <button
        className="flex min-h-20 w-full items-center justify-center px-4 text-left transition hover:bg-white"
        onClick={() => onOpen(isOpen ? '' : name)}
        type="button"
      >
        <span>
          <span className="block text-xs font-bold uppercase">{label}</span>
          <span className="mt-1 flex items-center gap-2 text-lg font-bold">
            <MaterialIcon className="text-2xl leading-none">arrow_drop_down</MaterialIcon>
            {displayValue || 'Any'}
          </span>
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-1/2 top-full z-20 w-48 -translate-x-1/2 bg-white p-4 text-[#333333] shadow-lg">
          <p className="mb-3 text-xs font-bold uppercase text-[#333333]">{label}</p>
          <FilterOption
            checked={!value}
            label="Any"
            onClick={() => {
              onChange((current) => ({ ...current, [name]: '' }))
              onOpen('')
            }}
          />
          {options.map((option) => (
            <FilterOption
              checked={value === option}
              key={option}
              label={formatFilterValue(option, name)}
              onClick={() => {
                onChange((current) => ({ ...current, [name]: option }))
                onOpen('')
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function FilterOption({ checked, label, onClick }) {
  return (
    <button
      className="flex min-h-9 w-full items-center gap-3 text-left text-sm uppercase transition hover:text-[#333333]"
      onClick={onClick}
      type="button"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border ${
          checked ? 'border-[#333333] bg-[#cccccc]' : 'border-slate-400 bg-white'
        }`}
      >
        {checked ? (
          <MaterialIcon className="text-base leading-none text-[#333333]">check</MaterialIcon>
        ) : null}
      </span>
      {label}
    </button>
  )
}

function formatFilterValue(value, name) {
  if (name === 'order') {
    return value === 'highest' ? 'Highest price' : 'Lowest price'
  }

  return value
}

function filterAndSortCars(cars, filters) {
  const filteredCars = cars.filter((car) => {
    if (filters.transmission && car.transmission !== filters.transmission) {
      return false
    }

    if (filters.category && car.category !== filters.category) {
      return false
    }

    if (filters.doors && String(car.doors) !== String(filters.doors)) {
      return false
    }

    return true
  })

  return filteredCars.toSorted((first, second) =>
    filters.order === 'highest'
      ? second.dailyRateEur - first.dailyRateEur
      : first.dailyRateEur - second.dailyRateEur,
  )
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].toSorted()
}

function IncludedIconBar({ car }) {
  const items = [
    { label: car.transmission, svg: gearshiftIcon },
    { label: 'Factory radio', svg: carRadioIcon },
    { label: `${car.seats} seats`, svg: carSeatIcon },
    { label: `${car.doors} doors`, svg: carDoorIcon },
  ]

  return (
    <div className="mt-5 grid grid-cols-4 border-t border-slate-200 pt-4 text-center text-xs font-bold uppercase text-[#333333]">
      {items.map((item) => (
        <div
          className="flex flex-col items-center justify-start border-l border-slate-200 text-center first:border-l-0"
          key={item.label}
        >
          {item.svg ? (
            <img
              alt=""
              aria-hidden="true"
              className="mb-2 h-9 w-9 object-contain"
              src={item.svg}
            />
          ) : (
            <MaterialIcon className="mb-2 block text-4xl leading-none text-[#333333]">
              {item.icon}
            </MaterialIcon>
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function SimilarStrip() {
  const images = [
    { label: 'Gear lever and steering wheel', variant: 'cockpit' },
    { label: 'Radio dashboard', variant: 'radio' },
    { label: 'Seat interior', variant: 'seat' },
    { label: 'Rear exterior angle', variant: 'rear' },
  ]

  return (
    <div className="mt-5 grid grid-cols-4 gap-3">
      {images.map((image) => (
        <CarPlaceholder
          ariaLabel={image.label}
          key={image.variant}
          small
          variant={image.variant}
        />
      ))}
    </div>
  )
}

function OfferDetails({ car, onContinue }) {
  const { formatMoney } = useCurrency()
  const total = car.dailyRateEur * 14

  return (
    <div className="flex flex-col justify-center bg-[#cccccc] px-10 py-10 text-center text-[#333333]">
      <h2 className="text-5xl font-bold uppercase tracking-normal">
        Offer details
      </h2>
      <div className="my-5 h-px bg-[#cccccc]" />
      <p className="text-2xl font-bold">
        Get this car for {formatMoney(car.dailyRateEur)} per day
      </p>
      <div className="my-5 h-px bg-[#cccccc]" />
      <p className="mb-4 text-sm font-bold uppercase text-[#333333]">Includes:</p>
      <ul className="space-y-2 text-sm font-semibold">
        <li>Loss damage waiver</li>
        <li>Unlimited miles</li>
        <li>All pricing includes tax</li>
        <li>Free cancellation</li>
      </ul>
      <p className="mt-6 text-4xl uppercase">
        Total <strong>{formatMoney(total)}</strong>
      </p>
      <p className="mt-2 text-sm font-semibold text-[#333333]">
        Excludes deposit fee {formatMoney(300)} when you collect your car.
      </p>
      <button
        className="mx-auto mt-5 min-h-16 rounded-md bg-pink-500 px-8 text-2xl font-bold uppercase text-white transition hover:bg-pink-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300"
        onClick={onContinue}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          I like it, let&apos;s go!
          <MaterialIcon className="text-3xl leading-none">arrow_forward</MaterialIcon>
        </span>
      </button>
      <p className="mt-4 text-xs text-[#333333]">
        You will be able to choose optional extras or add additional drivers in
        the next step.
      </p>
    </div>
  )
}

function CarDetailsModal({ car, onClose, onContinue }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-8 md:px-16 lg:px-24"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative grid w-full max-w-[1440px] bg-white text-[#333333] shadow-2xl lg:grid-cols-[1.25fr_0.95fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close car details"
          className="absolute -right-8 -top-8 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-5xl font-bold text-[#333333] shadow-lg transition hover:bg-white"
          onClick={onClose}
          type="button"
        >
          <MaterialIcon className="text-5xl leading-none">close</MaterialIcon>
        </button>
        <div className="px-12 py-8 text-center">
          <h2 className="text-5xl font-bold uppercase tracking-normal text-[#333333]">
            {car.name}
          </h2>
          <p className="mb-4 text-[#333333]">or similar</p>
          <CarPlaceholder large />
          <SimilarStrip />
          <IncludedIconBar car={car} />
        </div>
        <OfferDetails car={car} onContinue={onContinue} />
      </div>
    </div>
  )
}

function CarCard({ car, onSelect }) {
  const { formatMoney } = useCurrency()

  return (
    <button
      className="group block w-full rounded-md p-4 text-center transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#333333]"
      onClick={onSelect}
      type="button"
    >
      <h2 className="text-2xl font-bold uppercase tracking-normal text-[#333333] group-hover:text-[#333333]">
        {car.name}
      </h2>
      <p className="mb-6 text-sm text-[#333333]">or similar</p>
      <CarPlaceholder active={car.dailyRateEur <= 33} />
      <p className="mt-5 text-sm text-[#333333]">from</p>
      <p className="text-[#333333] group-hover:text-[#333333]">
        <span className="text-4xl font-bold">
          {formatMoney(car.dailyRateEur)}
        </span>{' '}
        <span className="text-lg font-semibold">per day</span>
      </p>
    </button>
  )
}

function CarPlaceholder({
  active,
  ariaLabel = 'Car exterior side profile',
  large = false,
  small = false,
  variant = 'exterior',
}) {
  const borderClass = active ? 'border-[#333333]' : 'border-slate-500'
  const sizeClass = large
    ? 'aspect-[2/1] max-w-md'
    : small
      ? 'aspect-[16/9] max-w-36'
      : 'aspect-[16/9] max-w-48'

  return (
    <div
      aria-label={ariaLabel}
      className={`relative mx-auto w-full overflow-hidden bg-white ${variant === 'exterior' ? '' : `border ${borderClass}`} ${sizeClass}`}
      role="img"
    >
      {variant === 'exterior' ? (
        <img
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
          src={carPrimaryPlaceholder}
        />
      ) : (
        <CarLineArt variant={variant} />
      )}
    </div>
  )
}

function CarLineArt({ variant }) {
  const commonProps = {
    className: 'h-full w-full',
    fill: 'none',
    stroke: '#333333',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '3.5',
    viewBox: '0 0 640 360',
  }
  const sketchProps = {
    fill: 'none',
    opacity: '0.35',
    stroke: '#333333',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeWidth: '1.5',
  }

  if (variant === 'cockpit') {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M74 87c90-24 205-28 344-11 58 8 105 22 142 43" />
        <path d="M94 236c50-73 114-114 190-123 67-8 134 2 202 31" />
        <path d="M84 246h214c30 0 54 16 72 48" />
        <path d="M413 112c43-28 99-16 127 27 27 43 15 100-28 127s-100 15-127-28c-28-43-15-99 28-126Z" />
        <path d="M437 149c24-15 57-8 72 17 15 24 8 56-17 71-24 16-57 8-72-16-15-25-8-57 17-72Z" />
        <path d="M216 285l51-118 62 20-52 121" />
        <path d="M260 169l72-48 45 61" />
        <path d="M300 206h53M288 230h49M277 254h38" />
        <path d="M105 303h430" />
        <path d="M104 242c28 18 56 42 85 71" />
        <path d="M368 292c22-23 41-46 58-70" />
        <path d="M87 90c54 87 95 151 123 192" {...sketchProps} />
        <path d="M220 280c-18-58-19-108-3-149" {...sketchProps} />
        <path d="M403 120c38-17 77-7 112 30" {...sketchProps} />
      </svg>
    )
  }

  if (variant === 'radio') {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M67 89c128-18 267-19 418-2 44 5 73 21 88 48l-28 153H93L67 89Z" />
        <path d="M113 134h269v75H113z" />
        <path d="M412 135h104v73H412z" />
        <path d="M137 165h213M137 184h151" />
        <path d="M130 239h53M206 239h53M282 239h53" />
        <path d="M130 263h53M206 263h53M282 263h53" />
        <circle cx="452" cy="248" r="27" />
        <circle cx="519" cy="248" r="18" />
        <path d="M438 171h52" />
        <path d="M85 304h472" />
        <path d="M96 105c146-9 299-7 459 7" {...sketchProps} />
        <path d="M117 212c88 6 177 6 267 0" {...sketchProps} />
        <path d="M414 211c36 6 72 6 108 0" {...sketchProps} />
      </svg>
    )
  }

  if (variant === 'seat') {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M58 72c95-19 204-22 327-9 80 9 141 35 183 79" />
        <path d="M135 279c31-96 67-166 108-211 16-18 39-18 67-1 34 62 43 133 27 212H135Z" />
        <path d="M322 279c33-105 71-178 116-219 18-16 40-14 66 5 31 62 37 134 17 214H322Z" />
        <path d="M167 279h361c23 0 41 15 54 46H88c9-30 36-46 79-46Z" />
        <path d="M231 107c28 12 57 12 86 0" />
        <path d="M421 103c29 13 59 13 91 0" />
        <path d="M196 160h118M188 207h137M385 160h125M374 209h139" />
        <path d="M108 102c-24 70-23 130 5 181" />
        <path d="M74 89c54 69 89 131 105 188" {...sketchProps} />
        <path d="M361 279c9-80 34-150 77-209" {...sketchProps} />
        <path d="M167 294c114 13 244 12 390-2" {...sketchProps} />
      </svg>
    )
  }

  if (variant === 'rear') {
    return (
      <svg {...commonProps} aria-hidden="true">
        <path d="M105 228c21-77 76-125 164-143 79-16 154-2 224 42 35 22 59 56 73 101" />
        <path d="M84 232h444c34 0 58 19 71 58H59c4-29 12-48 25-58Z" />
        <path d="M247 105l-60 94h309l-76-86" />
        <path d="M274 103l-38 96M402 112l48 87" />
        <path d="M174 234l-51 56M521 234l55 56" />
        <circle cx="193" cy="291" r="39" />
        <circle cx="498" cy="291" r="39" />
        <circle cx="193" cy="291" r="16" />
        <circle cx="498" cy="291" r="16" />
        <path d="M280 289h131" />
        <path d="M535 232l42-5" />
        <path d="M103 233l-45 7" />
        <path d="M117 222c101 11 242 11 423 2" {...sketchProps} />
        <path d="M227 112c93-19 168-12 226 21" {...sketchProps} />
      </svg>
    )
  }

  return (
    <svg {...commonProps} aria-hidden="true">
      <path d="M63 220c25-68 82-109 171-123 30-37 81-56 154-56 74 0 128 27 162 82 35 12 58 45 70 97" />
      <path d="M67 222h490c27 0 46 18 55 54H37c6-34 16-52 30-54Z" />
      <path d="M247 100l-67 89h296l-70-96" />
      <path d="M263 99l-28 90" />
      <path d="M394 95l39 94" />
      <circle cx="166" cy="279" r="42" />
      <circle cx="490" cy="279" r="42" />
      <circle cx="166" cy="279" r="16" />
      <circle cx="490" cy="279" r="16" />
      <path d="M209 278h238" />
      <path d="M96 219l58-22" />
      <path d="M527 199l43 23" />
      <path d="M305 213h50" />
      <path d="M71 213c122 13 302 14 541 2" {...sketchProps} />
      <path d="M226 102c104-20 189-12 255 26" {...sketchProps} />
      <path d="M236 189c70 10 151 9 242-1" {...sketchProps} />
    </svg>
  )
}

function getTripSearch(searchParams) {
  const storedSearch = loadTripSearch()

  if (hasValidRentalPeriod(storedSearch)) {
    return storedSearch
  }

  return tripSearchFromParams(searchParams)
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

function formatTime(value) {
  return value || ''
}

export default Cars
