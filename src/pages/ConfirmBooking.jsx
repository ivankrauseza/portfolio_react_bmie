import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MaterialIcon from '../components/MaterialIcon.jsx'
import {
  calculateBookingTotal,
  calculateExtraCost,
  clearBookingSession,
  extraDefinitions,
  loadBooking,
  validateDrivers,
} from '../lib/bookingSession.js'
import { useCurrency } from '../lib/currency.js'
import { clearTripSearch, loadTripSearch } from '../lib/tripSession.js'
import { CheckoutProgress } from './Cars.jsx'

const paymentDefaults = {
  cardName: 'JAMES MAY',
  cardNumber: '0123 4567 8910 1112',
  expiry: '12 / 23',
  cvc: '123',
}

function ConfirmBooking() {
  const navigate = useNavigate()
  const [booking] = useState(loadBooking)
  const [tripSearch] = useState(loadTripSearch)
  const [locations, setLocations] = useState([])
  const [paymentMode, setPaymentMode] = useState('now')
  const [payment, setPayment] = useState(paymentDefaults)
  const [submitted, setSubmitted] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [isBooking, setIsBooking] = useState(false)
  const [infoModal, setInfoModal] = useState(null)
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const bookingTotals = calculateBookingTotal(booking, tripSearch)
  const driver = booking.drivers?.[0] ?? booking.driverInfo ?? {}
  const driverErrors = validateDrivers(booking.drivers ?? [driver])
  const hasValidDrivers = driverErrors.every(
    (errors) => Object.keys(errors).length === 0,
  )
  const paymentErrors = validatePayment(payment)
  const paymentValid = Object.keys(paymentErrors).length === 0
  const payableTotal =
    paymentMode === 'now'
      ? Math.round(bookingTotals.total * 0.95 * 100) / 100
      : bookingTotals.total
  const pickupLocation = findLocation(locations, tripSearch.pickupLocationId)
  const dropoffLocation =
    findLocation(locations, tripSearch.dropoffLocationId) ?? pickupLocation

  useEffect(() => {
    if (!booking.selectedCar || !hasValidDrivers) {
      navigate(!booking.selectedCar ? '/cars' : '/driver-info', { replace: true })
    }
  }, [booking.selectedCar, hasValidDrivers, navigate])

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

  const extras = useMemo(
    () =>
      Object.values(booking.extras ?? {}).map((extra) => ({
        ...extra,
        title: extraDefinitions[extra.id]?.title ?? 'Optional extra',
        cost: calculateExtraCost(extra, bookingTotals.days),
      })),
    [booking.extras, bookingTotals.days],
  )

  const submitBooking = async () => {
    setSubmitted(true)
    setBookingError('')

    if (paymentMode === 'now' && !paymentValid) {
      return
    }

    setIsBooking(true)

    try {
      const response = await fetch('/api/rental/bookings', {
        body: JSON.stringify({
          booking,
          paymentMethod: paymentMode === 'now' ? 'pay_now' : 'pay_later',
          tripSearch,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Booking could not be completed.')
      }

      setConfirmedBooking(data)
      clearBookingSession()
      clearTripSearch()
    } catch (error) {
      setBookingError(error.message)
    } finally {
      setIsBooking(false)
    }
  }

  if (confirmedBooking) {
    return (
      <BookingSuccess
        booking={booking}
        confirmedBooking={confirmedBooking}
        dropoffLocation={dropoffLocation}
        extras={extras}
        pickupLocation={pickupLocation}
        tripSearch={tripSearch}
      />
    )
  }

  return (
    <section className="w-full flex-1 bg-slate-100 px-8 md:px-16 lg:px-24 py-10 text-[#333333]">
      <div className="mx-auto w-full max-w-[1440px]">
        <CheckoutProgress activeStep={3} />

        <button
          className="mb-5 min-h-12 rounded-full bg-[#cccccc] px-4 text-lg font-bold uppercase text-[#333333] transition hover:bg-[#cccccc]"
          onClick={() => navigate('/driver-info')}
          type="button"
        >
          Go back
        </button>

        <div className="grid bg-slate-200 lg:grid-cols-[1fr_0.5fr]">
          <BookingRecap
            booking={booking}
            bookingTotals={bookingTotals}
            driver={driver}
            dropoffLocation={dropoffLocation}
            extras={extras}
            pickupLocation={pickupLocation}
            tripSearch={tripSearch}
          />

          <PaymentPanel
            errors={submitted ? paymentErrors : {}}
            onChange={setPayment}
            onInfo={() =>
              setInfoModal({
                title: 'Pay now discount',
                body: 'Pay now applies a 5% discount to the booking total. The payment is simulated for this prototype.',
              })
            }
            onSubmit={submitBooking}
            payment={payment}
            bookingError={bookingError}
            isBooking={isBooking}
            paymentMode={paymentMode}
            payableTotal={payableTotal}
            setPaymentMode={setPaymentMode}
            total={bookingTotals.total}
          />
        </div>
      </div>

      {infoModal ? (
        <InfoModal info={infoModal} onClose={() => setInfoModal(null)} />
      ) : null}
    </section>
  )
}

function BookingRecap({
  booking,
  bookingTotals,
  driver,
  dropoffLocation,
  extras,
  pickupLocation,
  tripSearch,
}) {
  const selectedCar = booking.selectedCar
  const { formatMoney } = useCurrency()

  return (
    <div className="px-8 py-12 text-[#333333]">
      <h1 className="mb-5 text-3xl font-bold uppercase tracking-normal">
        Booking overview
      </h1>
      <div className="mb-7 h-px bg-[#cccccc]" />

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-5 text-xl font-bold text-[#333333]">
            Location & Vehicle ({formatMoney(bookingTotals.vehicleTotal)})
          </h2>
          <Detail label="Vehicle Type">
            {selectedCar?.name ?? 'Selected car'} or similar
          </Detail>
          <Detail label="Pick Up Location (Date & Time)">
            <MapLocation location={pickupLocation} /> ({formatDate(tripSearch.pickupDate)} @{' '}
            {formatTime(tripSearch.pickupTime)})
          </Detail>
          <Detail label="Drop Off Location (Date & Time)">
            <MapLocation location={dropoffLocation} /> ({formatDate(tripSearch.dropoffDate)} @{' '}
            {formatTime(tripSearch.dropoffTime)})
          </Detail>

          <h2 className="mt-8 text-xl font-bold text-[#333333]">
            Optional Extras ({formatMoney(bookingTotals.extrasTotal)})
          </h2>
          {extras.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm font-bold">
              {extras.map((extra) => (
                <li key={extra.id}>
                  {extra.quantity ?? 1} x {extra.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm italic">No optional extras selected.</p>
          )}
        </section>

        <section>
          <h2 className="mb-5 text-xl font-bold uppercase text-[#333333]">
            Driver info
          </h2>
          <Detail label="Full Name">{driver.name}</Detail>
          <Detail label="Licence No">{driver.licenceNumber}</Detail>
          <Detail label="Contact Details">
            Email: {driver.email}
            <br />
            Phone: {driver.phone}
          </Detail>
          <Detail label="Physical Address">{driver.address}</Detail>
        </section>
      </div>

      <div className="my-7 border-t border-b border-dotted border-slate-400 py-4">
        <p className="text-4xl uppercase tracking-normal">
          Total : <strong>{formatMoney(bookingTotals.total)}</strong>
        </p>
      </div>

      <h2 className="mb-4 text-xl font-bold uppercase text-[#333333]">
        Terms & Conditions
      </h2>
      <p className="max-w-[1440px] text-sm leading-relaxed">
        Your booking is subject to licence verification, availability at the
        collection location, and the rental agreement signed at pickup. A{' '}
        {formatMoney(300)} deposit is held on your card and refunded when the
        vehicle is returned as agreed. Please review our{' '}
        <Link className="font-bold text-[#333333] hover:text-[#333333]" to="/terms-of-service">
          terms of service
        </Link>{' '}
        before booking.
      </p>
    </div>
  )
}

function PaymentPanel({
  bookingError,
  errors,
  isBooking,
  onChange,
  onInfo,
  onSubmit,
  payment,
  paymentMode,
  payableTotal,
  setPaymentMode,
  total,
}) {
  const { formatMoney } = useCurrency()

  const updateField = (event) => {
    const { name, value } = event.target
    onChange({
      ...payment,
      [name]: value,
    })
  }

  return (
    <aside className="bg-white text-[#333333] shadow-lg">
      <div className="grid grid-cols-2 text-center text-3xl font-bold uppercase">
        <button
          className={`min-h-24 transition ${
            paymentMode === 'now'
              ? 'bg-white text-[#333333]'
              : 'bg-[#cccccc] text-[#333333] hover:bg-[#cccccc]'
          }`}
          onClick={() => setPaymentMode('now')}
          type="button"
        >
          Pay now
        </button>
        <button
          className={`min-h-24 transition ${
            paymentMode === 'later'
              ? 'bg-white text-[#333333]'
              : 'bg-[#cccccc] text-[#333333] hover:bg-[#cccccc]'
          }`}
          onClick={() => setPaymentMode('later')}
          type="button"
        >
          Pay later
        </button>
      </div>

      <div className="px-8 py-8">
        {paymentMode === 'now' ? (
          <>
            <p className="mb-3 flex items-center justify-center gap-2 text-xl uppercase">
              Pay now and save 5%
              <button
                aria-label="More information about pay now discount"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#333333] transition hover:text-[#333333]"
                onClick={onInfo}
                type="button"
              >
                <MaterialIcon className="text-lg leading-none" filled>
                  info
                </MaterialIcon>
              </button>
            </p>
            <p className="mb-6 text-center text-4xl font-bold">
              <span className="mr-6 text-[#333333] line-through">
                {formatMoney(total)}
              </span>
              {formatMoney(payableTotal)}
            </p>

            <PaymentField
              error={errors.cardName}
              label="Name on card"
              name="cardName"
              onChange={updateField}
              value={payment.cardName}
            />
            <PaymentField
              error={errors.cardNumber}
              label="Card number"
              name="cardNumber"
              onChange={updateField}
              value={payment.cardNumber}
            />
            <div className="grid grid-cols-2">
              <PaymentField
                error={errors.expiry}
                label="Expiry"
                name="expiry"
                onChange={updateField}
                value={payment.expiry}
              />
              <PaymentField
                error={errors.cvc}
                help
                label="Security code (CVC)"
                name="cvc"
                onChange={updateField}
                value={payment.cvc}
              />
            </div>
          </>
        ) : (
          <div className="min-h-80 py-8 text-center">
            <h2 className="mb-5 text-3xl font-bold uppercase">Pay later</h2>
            <p className="mx-auto max-w-sm text-lg font-semibold leading-relaxed">
              No payment will be taken now. We will reserve the vehicle and
              payment instructions will be provided when you collect your car.
            </p>
            <p className="mt-8 text-4xl font-bold">{formatMoney(total)}</p>
          </div>
        )}

        <button
          className="mt-6 min-h-16 w-full rounded-md bg-pink-500 text-2xl font-bold uppercase text-white transition hover:bg-pink-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-300 disabled:cursor-not-allowed disabled:bg-[#cccccc] disabled:text-[#333333]"
          disabled={isBooking}
          onClick={onSubmit}
          type="button"
        >
          {isBooking
            ? 'Processing...'
            : paymentMode === 'now'
              ? 'Book my car'
              : 'Reserve my car'}
        </button>
        {bookingError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-bold text-[#333333]">
            {bookingError}
          </p>
        ) : null}
        <p className="mt-4 text-center text-xs font-semibold text-[#333333]">
          By making payment you accept our Terms & Conditions.
        </p>

        <div className="mt-10 border border-slate-300 px-4 py-4 text-center">
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-bold uppercase">
            <MaterialIcon className="text-2xl leading-none">lock</MaterialIcon>
            Secure payment
          </p>
          <p className="text-sm font-bold uppercase tracking-normal text-[#333333]">
            Mastercard · Visa · Discover · Amex · PayPal
          </p>
        </div>
      </div>
    </aside>
  )
}

function BookingSuccess({
  booking,
  confirmedBooking,
  dropoffLocation,
  extras,
  pickupLocation,
  tripSearch,
}) {
  const selectedCar = booking.selectedCar
  const isPayLater = confirmedBooking.paymentMethod === 'pay_later'
  const { formatMoney } = useCurrency()

  return (
    <section className="flex w-full flex-1 items-center justify-center bg-[#cccccc] px-8 md:px-16 lg:px-24 py-20 text-center text-[#333333]">
      <div className="w-full max-w-2xl rounded-md bg-white px-12 py-10 shadow-xl">
        <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-[#cccccc] text-[#333333]">
          <MaterialIcon className="text-7xl leading-none">check</MaterialIcon>
        </div>
        <h1 className="text-4xl uppercase tracking-normal text-[#333333]">
          Success
        </h1>
        <p className="mt-3 text-xl font-bold">Thank You!</p>
        <p>
          {isPayLater
            ? 'Your vehicle has been reserved!'
            : 'Your Booking has been confirmed!'}
        </p>
        <p className="mt-2 text-sm font-bold uppercase text-[#333333]">
          Booking ref: {confirmedBooking.reference}
        </p>
        <p className="mt-1 text-sm font-bold uppercase text-[#333333]">
          Payment:{' '}
          {isPayLater
            ? 'Pay later at airport desk'
            : `Paid ${formatMoney(confirmedBooking.payableTotal)}`}
        </p>

        <div className="my-7 h-px bg-slate-200" />
        <p className="mb-6 text-sm font-bold uppercase text-[#333333]">
          Booking summary
        </p>
        <h2 className="text-2xl uppercase">{selectedCar?.name}</h2>
        <p className="mb-6 text-sm italic">or similar</p>
        <SuccessLine
          label="Pick up:"
          location={pickupLocation}
          value={`${formatDate(tripSearch.pickupDate)} @ ${formatTime(
            tripSearch.pickupTime,
          )}`}
        />
        <SuccessLine
          label="Drop off:"
          location={dropoffLocation}
          value={`${formatDate(tripSearch.dropoffDate)} @ ${formatTime(
            tripSearch.dropoffTime,
          )}`}
        />

        {extras.length > 0 ? (
          <>
            <p className="mt-7 text-sm uppercase text-[#333333]">
              Optional extras:
            </p>
            <p className="font-bold uppercase">
              {extras
                .map((extra) => `${extra.quantity ?? 1} x ${extra.title}`)
                .join(', ')}
            </p>
          </>
        ) : null}

        <div className="my-7 h-px bg-slate-200" />
        <p className="mb-4 text-[#333333]">
          We have emailed you a copy of your booking summary.
        </p>
        <button
          className="rounded-full bg-pink-500 px-6 py-3 text-sm font-bold uppercase text-white transition hover:bg-pink-600"
          onClick={() =>
            downloadBookingPdf({
              booking,
              confirmedBooking,
              dropoffLocation,
              extras,
              formatMoney,
              pickupLocation,
              tripSearch,
            })
          }
          type="button"
        >
          Download PDF
        </button>

        <div className="my-7 h-px bg-slate-200" />
        <Link className="text-sm font-bold uppercase text-[#333333] hover:text-[#333333]" to="/">
          Click here to exit
        </Link>
      </div>
    </section>
  )
}

function Detail({ children, label }) {
  return (
    <div className="mb-5 text-sm">
      <p className="font-bold">{label}</p>
      <p className="whitespace-pre-line font-semibold">{children}</p>
    </div>
  )
}

function MapLocation({ location }) {
  const query = encodeURIComponent(`${location?.name ?? 'Ireland airport'} Ireland`)

  return (
    <a
      className="font-bold hover:text-[#333333]"
      href={`https://www.google.com/maps/search/?api=1&query=${query}`}
      rel="noreferrer"
      target="_blank"
    >
      {location?.name ?? 'Selected airport'}
    </a>
  )
}

function PaymentField({ error, help, label, name, onChange, value }) {
  return (
    <label className="mb-5 block text-sm font-bold uppercase text-[#333333]">
      {label}
      <span className="relative mt-1 block">
        <input
          aria-invalid={Boolean(error)}
          className={`min-h-14 w-full rounded-md border px-4 text-lg text-[#333333] outline-none transition focus:ring-2 ${
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-400 focus:border-pink-500 focus:ring-pink-100'
          }`}
          name={name}
          onChange={onChange}
          value={value}
        />
        {help ? (
          <span className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#cccccc] text-xs text-[#333333]">
            ?
          </span>
        ) : null}
      </span>
      {error ? <span className="text-xs normal-case text-[#333333]">{error}</span> : null}
    </label>
  )
}

function SuccessLine({ label, location, value }) {
  return (
    <p className="mt-4 uppercase">
      <span className="block text-sm text-[#333333]">{label}</span>
      <strong>{location?.name ?? 'Selected airport'}</strong> - {value}
    </p>
  )
}

function InfoModal({ info, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#cccccc] px-8 md:px-16 lg:px-24"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative min-h-72 w-full max-w-2xl bg-white px-10 py-12 text-left text-[#333333] shadow-2xl"
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
        <h2 className="mb-6 text-3xl font-bold uppercase tracking-normal text-[#333333]">
          {info.title}
        </h2>
        <p className="max-w-2xl text-xl font-semibold leading-relaxed">
          {info.body}
        </p>
      </div>
    </div>
  )
}

function validatePayment(payment) {
  const errors = {}
  const cardDigits = payment.cardNumber.replace(/\D/g, '')

  if (!payment.cardName.trim()) {
    errors.cardName = 'Enter the name on card.'
  }

  if (cardDigits.length < 12) {
    errors.cardNumber = 'Enter a valid card number.'
  }

  if (!/^\d{2}\s*\/\s*\d{2}$/.test(payment.expiry.trim())) {
    errors.expiry = 'Use MM / YY.'
  }

  if (!/^\d{3,4}$/.test(payment.cvc.trim())) {
    errors.cvc = 'Enter 3 or 4 digits.'
  }

  return errors
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
  if (!value) {
    return ''
  }

  return value
}

function downloadBookingPdf({
  booking,
  confirmedBooking,
  dropoffLocation,
  extras,
  formatMoney,
  pickupLocation,
  tripSearch,
}) {
  const lines = [
    `Sparrow booking ${confirmedBooking.reference}`,
    `Payment: ${confirmedBooking.paymentMethod === 'pay_later' ? 'Pay later at airport desk' : `Paid ${formatMoney(confirmedBooking.payableTotal)}`}`,
    `Vehicle: ${booking.selectedCar?.name ?? 'Selected car'} or similar`,
    `Pickup: ${pickupLocation?.name ?? 'Selected airport'} - ${formatDate(
      tripSearch.pickupDate,
    )} @ ${formatTime(tripSearch.pickupTime)}`,
    `Dropoff: ${dropoffLocation?.name ?? 'Selected airport'} - ${formatDate(
      tripSearch.dropoffDate,
    )} @ ${formatTime(tripSearch.dropoffTime)}`,
    `Optional extras: ${
      extras.length
        ? extras.map((extra) => `${extra.quantity ?? 1} x ${extra.title}`).join(', ')
        : 'None'
    }`,
  ]
  const pdf = createSimplePdf(lines)
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  const link = document.createElement('a')

  link.href = url
  link.download = `${confirmedBooking.reference}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

function createSimplePdf(lines) {
  const content = [
    'BT',
    '/F1 18 Tf',
    '72 760 Td',
    ...lines.flatMap((line, index) => [
      index === 0 ? '' : '0 -28 Td',
      `(${escapePdfText(line)}) Tj`,
    ]),
    'ET',
  ]
    .filter(Boolean)
    .join('\n')
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ]
  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(pdf.length)
    pdf += `${object}\n`
  }

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return pdf
}

function escapePdfText(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')
}

export default ConfirmBooking
