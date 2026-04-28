import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookingOverview from '../components/BookingOverview.jsx'
import MaterialIcon from '../components/MaterialIcon.jsx'
import TripSummaryPill from '../components/TripSummaryPill.jsx'
import {
  calculateBookingTotal,
  calculateExtraCost,
  extraDefinitions,
  loadBooking,
  updateBookingExtras,
} from '../lib/bookingSession.js'
import { useCurrency } from '../lib/currency.js'
import { loadTripSearch } from '../lib/tripSession.js'
import { CheckoutProgress } from './Cars.jsx'

const optionalExtraIds = [
  'collisionProtection',
  'additionalDrivers',
  'childSeat',
  'prepaidFuel',
  'navigationDevice',
  'wifiOnTheMove',
]

function OptionalExtras() {
  const navigate = useNavigate()
  const tripSearch = loadTripSearch()
  const [booking, setBooking] = useState(loadBooking)
  const [openExtra, setOpenExtra] = useState(null)
  const selectedExtra = openExtra ? extraDefinitions[openExtra] : null

  const updateExtras = (extras) => {
    setBooking(updateBookingExtras(extras))
  }

  const toggleSimpleExtra = (id) => {
    const extras = { ...(booking.extras ?? {}) }

    if (extras[id]) {
      delete extras[id]
    } else {
      extras[id] = { id, quantity: 1 }
    }

    updateExtras(extras)
  }

  const saveAdditionalDrivers = (quantity) => {
    const extras = { ...(booking.extras ?? {}) }

    if (quantity > 0) {
      extras.additionalDrivers = {
        id: 'additionalDrivers',
        quantity,
      }
    } else {
      delete extras.additionalDrivers
    }

    updateExtras(extras)
    setOpenExtra(null)
  }

  return (
    <section className="w-full flex-1 bg-slate-100 px-8 md:px-16 lg:px-24 py-10 text-[#333333]">
      <div className="mx-auto w-full max-w-[1440px]">
        <CheckoutProgress activeStep={1} />

        <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <button
              className="min-h-12 rounded-full bg-[#cccccc] px-4 text-lg font-bold uppercase text-[#333333] transition hover:bg-[#cccccc]"
              onClick={() => navigate('/cars')}
              type="button"
            >
              Go back
            </button>
            <h1 className="text-3xl font-bold uppercase tracking-normal text-[#333333]">
              Optional extras
            </h1>
          </div>

          <TripSummaryPill />
        </div>

        <div className="grid bg-[#cccccc] lg:grid-cols-[1fr_0.5fr]">
          <div className="px-9 py-8">
            <p className="font-bold uppercase text-[#333333]">
              We offer a variety of optional extras to help make your trip.
            </p>
            <p className="italic text-[#333333]">
              You are NOT required to purchase any optional extras.
            </p>
            <p className="mt-6 font-bold text-[#333333]">
              Click on any of the optional extra&apos;s below to find out more.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {optionalExtraIds.map((id) => (
                <ExtraCard
                  extra={extraDefinitions[id]}
                  isSelected={Boolean(booking.extras?.[id])}
                  key={id}
                  onClick={() => {
                    if (id === 'additionalDrivers') {
                      setOpenExtra(id)
                    } else {
                      toggleSimpleExtra(id)
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <BookingOverview
            booking={booking}
            continueLabel="Continue"
            onContinue={() => navigate('/driver-info')}
          />
        </div>
      </div>

      {selectedExtra?.id === 'additionalDrivers' ? (
        <AdditionalDriversModal
          booking={booking}
          initialQuantity={booking.extras?.additionalDrivers?.quantity ?? 1}
          onClose={() => setOpenExtra(null)}
          onSave={saveAdditionalDrivers}
          tripSearch={tripSearch}
        />
      ) : null}
    </section>
  )
}

function ExtraCard({ extra, isSelected, onClick }) {
  return (
    <button
      className={`grid min-h-28 grid-cols-[96px_1fr] items-center border px-6 text-left transition ${
        isSelected
          ? 'border-amber-400 bg-[#cccccc] text-[#333333]'
          : 'border-slate-500 bg-white text-[#333333] hover:border-pink-500'
      }`}
      onClick={onClick}
      type="button"
    >
      <MaterialIcon className="text-6xl leading-none text-[#333333]">
        {extra.icon}
      </MaterialIcon>
      <span>
        <span className="block text-2xl font-bold">{extra.title}</span>
        <span className="mt-1 block font-semibold">
          {isSelected ? 'Click to edit or remove' : extra.subtitle}
        </span>
      </span>
    </button>
  )
}

function AdditionalDriversModal({
  booking,
  initialQuantity,
  onClose,
  onSave,
  tripSearch,
}) {
  const [quantity, setQuantity] = useState(initialQuantity)
  const { formatMoney } = useCurrency()
  const { total: previousTotal } = calculateBookingTotal(booking, tripSearch)
  const extra = {
    id: 'additionalDrivers',
    quantity,
  }
  const additionalCost = calculateExtraCost(
    extra,
    calculateBookingTotal(booking, tripSearch).days,
  )
  const nextTotal =
    previousTotal -
    calculateExtraCost(
      booking.extras?.additionalDrivers ?? { id: 'additionalDrivers', quantity: 0 },
      calculateBookingTotal(booking, tripSearch).days,
    ) +
    additionalCost

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#cccccc] px-8 md:px-16 lg:px-24"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-[1440px] bg-white px-12 py-10 text-[#333333] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close additional driver"
          className="absolute -right-8 -top-8 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-[#333333] shadow-lg transition hover:bg-white"
          onClick={onClose}
          type="button"
        >
          <MaterialIcon className="text-5xl leading-none">close</MaterialIcon>
        </button>

        <div className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <h2 className="text-5xl font-bold uppercase text-[#333333]">
            Add additional driver
          </h2>
          <MaterialIcon className="text-6xl leading-none text-[#333333]">
            person_add
          </MaterialIcon>
        </div>

        <p className="mb-8 text-center text-xl font-semibold">
          How many drivers would you like to add?
        </p>

        <div className="grid gap-10 border-b border-slate-200 pb-8 lg:grid-cols-2 lg:items-center">
          <div className="flex items-center justify-center">
            <button
              className="flex h-14 w-20 items-center justify-center rounded-l-full bg-[#cccccc] text-[#333333] disabled:opacity-40"
              disabled={quantity === 0}
              onClick={() => setQuantity((current) => Math.max(0, current - 1))}
              type="button"
            >
              <MaterialIcon className="text-4xl leading-none">remove</MaterialIcon>
            </button>
            <div className="flex h-20 w-20 items-center justify-center rounded border border-slate-400 bg-white text-5xl font-bold">
              {quantity}
            </div>
            <button
              className="flex h-14 w-20 items-center justify-center rounded-r-full bg-[#cccccc] text-[#333333]"
              onClick={() => setQuantity((current) => current + 1)}
              type="button"
            >
              <MaterialIcon className="text-4xl leading-none">add</MaterialIcon>
            </button>
          </div>

          <p className="text-3xl uppercase text-[#333333]">
            Driver/s @ <strong>{formatMoney(10)} per day</strong>
          </p>
        </div>

        <div className="grid gap-8 pt-8 lg:grid-cols-2">
          <div>
            <p className="text-4xl text-[#333333]">
              Additional Driver Cost: <strong>{formatMoney(additionalCost)}</strong>
            </p>
            <div className="mt-10 text-sm text-[#333333]">
              <p className="font-bold">Terms &amp; Conditions</p>
              <p>Each additional driver will cost {formatMoney(10)} per day.</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xl uppercase text-[#333333]">
              Previous booking total: <strong>{formatMoney(previousTotal)}</strong>
            </p>
            <p className="mt-3 text-4xl uppercase text-[#333333]">
              Booking total: <strong>{formatMoney(nextTotal)}</strong>
            </p>
            <button
              className="mt-12 min-h-16 rounded-md bg-pink-500 px-12 text-2xl font-bold uppercase text-white transition hover:bg-pink-600"
              onClick={() => onSave(quantity)}
              type="button"
            >
              + Add driver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptionalExtras
