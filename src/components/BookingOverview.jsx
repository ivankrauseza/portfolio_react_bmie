import { useState } from 'react'
import MaterialIcon from './MaterialIcon.jsx'
import {
  calculateBookingTotal,
  calculateExtraCost,
  extraDefinitions,
} from '../lib/bookingSession.js'
import { useCurrency } from '../lib/currency.js'
import { loadTripSearch } from '../lib/tripSession.js'

function BookingOverview({
  booking,
  continueDisabled = false,
  continueLabel = 'Continue',
  onContinue,
}) {
  const tripSearch = loadTripSearch()
  const [infoModal, setInfoModal] = useState(null)
  const { formatMoney } = useCurrency()
  const { days, total, vehicleTotal } = calculateBookingTotal(booking, tripSearch)
  const selectedCar = booking.selectedCar
  const extras = Object.values(booking.extras ?? {})

  return (
    <aside className="bg-[#cccccc] px-8 py-8 text-center text-[#333333]">
      <h2 className="text-3xl font-bold uppercase tracking-normal">
        Booking overview
      </h2>
      <div className="my-5 h-px bg-[#cccccc]" />

      <p className="text-lg font-bold">
        {days} {days === 1 ? 'Day' : 'Days'} driving a{' '}
        {selectedCar?.name ?? 'selected car'} or similar{' '}
        <span className="text-[#333333]">({formatMoney(vehicleTotal)})</span>
      </p>

      <p className="mt-4 text-sm font-bold uppercase text-[#333333]">Includes:</p>
      <ul className="mt-3 space-y-2 text-sm font-semibold">
        <OverviewInfo
          label="Loss damage waiver"
          onClick={() =>
            setInfoModal({
              title: 'Loss damage waiver',
              body: 'Loss damage waiver limits your financial responsibility for accidental vehicle damage, subject to the rental agreement.',
            })
          }
        />
        <OverviewInfo
          label="Unlimited miles"
          onClick={() =>
            setInfoModal({
              title: 'Unlimited miles',
              body: 'Unlimited miles means you can drive without a mileage cap during the rental period.',
            })
          }
        />
        <li>All pricing Includes Tax</li>
      </ul>

      <p className="mt-5 text-sm font-bold uppercase text-[#333333]">
        Optional extras:
      </p>
      {extras.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm font-semibold">
          {extras.map((extra) => (
            <li key={extra.id}>
              {extra.quantity ?? 1} x {extraDefinitions[extra.id]?.title}{' '}
              <span className="text-[#333333]">
                ({formatMoney(calculateExtraCost(extra, days))})
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm italic text-[#333333]">
          You have not added any Extras
        </p>
      )}

      <div className="my-6 h-px bg-[#cccccc]" />
      <p className="text-5xl uppercase">
        Total <strong>{formatMoney(total)}</strong>
      </p>

      <button
        className="mt-6 min-h-16 w-full rounded-md bg-pink-500 text-2xl font-bold uppercase text-white transition hover:bg-pink-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300 disabled:cursor-not-allowed disabled:bg-[#cccccc] disabled:text-[#333333]"
        disabled={continueDisabled}
        onClick={onContinue}
        type="button"
      >
        {continueLabel}
      </button>

      <p className="mt-5 text-xs font-semibold text-[#333333]">
        <strong className="block uppercase text-[#333333]">Important</strong>
        When you collect your car, a deposit fee of {formatMoney(300)} will be
        held on your credit/debit card. This fee will be refunded in full if the
        vehicle is returned as per rental agreement.
      </p>

      {infoModal ? (
        <InfoModal info={infoModal} onClose={() => setInfoModal(null)} />
      ) : null}
    </aside>
  )
}

function OverviewInfo({ label, onClick }) {
  return (
    <li className="flex items-center justify-center gap-2">
      {label}
      <button
        aria-label={`More information about ${label}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[#333333] transition hover:text-[#333333]"
        onClick={onClick}
        type="button"
      >
        <MaterialIcon className="text-base leading-none" filled>
          info
        </MaterialIcon>
      </button>
    </li>
  )
}

function InfoModal({ info, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#cccccc] px-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative min-h-96 w-full max-w-3xl bg-white px-10 py-12 text-left text-[#333333] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          aria-label="Close information"
          className="absolute -right-8 -top-8 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-[#333333] shadow-lg transition hover:bg-white"
          onClick={onClose}
          type="button"
        >
          <MaterialIcon className="text-5xl leading-none">close</MaterialIcon>
        </button>
        <h2 className="mb-10 text-3xl font-bold uppercase tracking-normal text-[#333333]">
          {info.title}
        </h2>
        <p className="max-w-2xl text-xl font-semibold leading-relaxed">
          {info.body}
        </p>
      </div>
    </div>
  )
}

export default BookingOverview
