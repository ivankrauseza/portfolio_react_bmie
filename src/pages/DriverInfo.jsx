import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookingOverview from '../components/BookingOverview.jsx'
import TripSummaryPill from '../components/TripSummaryPill.jsx'
import {
  loadBooking,
  normalizeDrivers,
  preloadTestDriverData,
  updateDrivers,
  validateDrivers,
} from '../lib/bookingSession.js'
import { CheckoutProgress } from './Cars.jsx'

function DriverInfo() {
  const navigate = useNavigate()
  const initialState = useMemo(() => {
    const loadedBooking = loadBooking()
    const preloadedDrivers = preloadTestDriverData(normalizeDrivers(loadedBooking))
    const preloadedBooking = updateDrivers(preloadedDrivers)

    return {
      booking: preloadedBooking,
      drivers: preloadedDrivers,
    }
  }, [])
  const [booking, setBooking] = useState(initialState.booking)
  const [drivers, setDrivers] = useState(initialState.drivers)
  const [errors, setErrors] = useState(() => drivers.map(() => ({})))
  const requiredCount = drivers.length
  const allDriversValid = useMemo(
    () => validateDrivers(drivers).every((driverErrors) => Object.keys(driverErrors).length === 0),
    [drivers],
  )

  const updateField = (driverIndex, event) => {
    const { name, value } = event.target
    const nextDrivers = drivers.map((driver, index) =>
      index === driverIndex
        ? {
            ...driver,
            [name]: value,
          }
        : driver,
    )

    setDrivers(nextDrivers)
    setBooking(updateDrivers(nextDrivers))
    setErrors((current) =>
      current.map((driverErrors, index) =>
        index === driverIndex
          ? {
              ...driverErrors,
              [name]: '',
            }
          : driverErrors,
      ),
    )
  }

  const continueToConfirm = () => {
    const nextErrors = validateDrivers(drivers)
    setErrors(nextErrors)

    if (nextErrors.some((driverErrors) => Object.keys(driverErrors).length > 0)) {
      return
    }

    navigate('/confirm')
  }

  return (
    <section className="w-full flex-1 bg-slate-100 px-8 md:px-16 lg:px-24 py-10 text-[#333333]">
      <div className="mx-auto w-full max-w-[1440px]">
        <CheckoutProgress activeStep={2} />

        <div className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <button
              className="min-h-12 rounded-full bg-[#cccccc] px-4 text-lg font-bold uppercase text-[#333333] transition hover:bg-[#cccccc]"
              onClick={() => navigate('/extras')}
              type="button"
            >
              Go back
            </button>
            <h1 className="text-3xl font-bold uppercase tracking-normal text-[#333333]">
              Main driver info
            </h1>
          </div>

          <TripSummaryPill />
        </div>

        <div className="grid bg-[#cccccc] lg:grid-cols-[1fr_0.5fr]">
          <div className="px-6 py-6">
            <p className="mb-5 text-lg font-semibold text-[#333333]">
              Please enter your information below as accurately as possible to
              prevent any delays when collecting your car.
            </p>
            {requiredCount > 1 ? (
              <p className="mb-6 rounded-md border border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-[#333333]">
                Loss damage waiver protection requires details for every
                approved driver. You have {requiredCount} drivers on this
                booking.
              </p>
            ) : null}

            <div className="space-y-10">
              {drivers.map((driver, index) => (
                <DriverForm
                  driver={driver}
                  errors={errors[index] ?? {}}
                  index={index}
                  key={index}
                  onChange={updateField}
                />
              ))}
            </div>
          </div>

          <BookingOverview
            booking={booking}
            continueDisabled={!allDriversValid}
            continueLabel="Continue"
            onContinue={continueToConfirm}
          />
        </div>
      </div>
    </section>
  )
}

function DriverForm({ driver, errors, index, onChange }) {
  return (
    <section className="border-t border-slate-400 pt-6 first:border-t-0 first:pt-0">
      <h2 className="mb-5 text-xl font-bold uppercase text-[#333333]">
        {index === 0 ? 'Main driver' : `Additional driver ${index}`}
      </h2>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <DriverField
            error={errors.name}
            label="Name (As displayed on your licence)"
            name="name"
            onChange={(event) => onChange(index, event)}
            value={driver.name}
          />
          <DriverField
            error={errors.licenceNumber}
            label="Drivers licence number:"
            name="licenceNumber"
            onChange={(event) => onChange(index, event)}
            value={driver.licenceNumber}
          />
          <DriverField
            error={errors.phone}
            label="Phone number"
            name="phone"
            onChange={(event) => onChange(index, event)}
            value={driver.phone}
          />
          <DriverField
            error={errors.email}
            label="Email address"
            name="email"
            onChange={(event) => onChange(index, event)}
            type="email"
            value={driver.email}
          />
          <DriverField
            error={errors.address}
            label="Address"
            name="address"
            onChange={(event) => onChange(index, event)}
            rows={6}
            value={driver.address}
          />
        </div>

        <div className={index === 0 ? 'pt-0 lg:pt-8' : ''}>
          {index === 0 ? (
            <>
              <p className="mb-4 text-sm font-bold uppercase text-[#333333]">
                Other information:
              </p>
              <p className="mb-4 text-sm font-semibold text-[#333333]">
                You have the option of adding your flight number to your booking
                which can help us better prepare your vehicle in the case of
                delayed or cancelled flights.
              </p>
              <p className="mb-8 text-sm font-semibold text-[#333333]">
                Please let us know if you require any special assistance due to
                a physical disability for either yourself or travel partners.
              </p>
              <p className="mb-10 text-sm font-semibold text-[#333333]">
                We will do our best to accommodate your needs.
              </p>
            </>
          ) : (
            <p className="mb-8 text-sm font-semibold text-[#333333]">
              Additional drivers must provide complete driver details before
              they can be covered by the loss damage waiver.
            </p>
          )}
          <DriverField
            label="Flight No. (Optional)"
            name="flightNumber"
            onChange={(event) => onChange(index, event)}
            value={driver.flightNumber}
          />
          <DriverField
            label="Notes/Comments/Requests: (Optional)"
            name="notes"
            onChange={(event) => onChange(index, event)}
            rows={8}
            value={driver.notes}
          />
        </div>
      </div>
    </section>
  )
}

function DriverField({
  error,
  label,
  name,
  onChange,
  rows,
  type = 'text',
  value,
}) {
  const inputClass = `mb-2 mt-1 w-full rounded-md border bg-white px-3 py-3 text-[#333333] outline-none transition focus:ring-2 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'border-transparent focus:border-pink-500 focus:ring-pink-100'
  }`

  return (
    <label className="mb-3 block text-sm font-bold text-[#333333]">
      {label}
      {rows ? (
        <textarea
          aria-invalid={Boolean(error)}
          className={inputClass}
          name={name}
          onChange={onChange}
          rows={rows}
          value={value}
        />
      ) : (
        <input
          aria-invalid={Boolean(error)}
          className={inputClass}
          name={name}
          onChange={onChange}
          type={type}
          value={value}
        />
      )}
      {error ? <span className="text-xs font-bold text-[#333333]">{error}</span> : null}
    </label>
  )
}

export default DriverInfo
