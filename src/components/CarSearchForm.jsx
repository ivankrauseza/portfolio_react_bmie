import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  hasRequiredPickupDetails,
  hasValidRentalPeriod,
  loadTripSearch,
  missingRentalPeriodReason,
  saveTripSearch,
  todayDateInputValue,
  tomorrowDateInputValue,
  tripSearchToParams,
} from '../lib/tripSession.js'

function CarSearchForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [locations, setLocations] = useState([])
  const [form, setForm] = useState(loadTripSearch)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [loadError, setLoadError] = useState('')
  const today = todayDateInputValue()
  const tomorrow = tomorrowDateInputValue()
  const canShowCars = hasValidRentalPeriod(form)

  const fetchLocations = useCallback((active = () => true) => {
    return fetch('/api/rental/locations')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Locations could not be loaded.')
        }

        return response.json()
      })
      .then((data) => {
        if (active()) {
          setLocations(data.locations ?? [])
        }
      })
      .catch(() => {
        if (active()) {
          setLoadError('We could not load pickup locations. Please try again.')
        }
      })
      .finally(() => {
        if (active()) {
          setLoadingLocations(false)
        }
      })
  }, [])

  const retryLocations = () => {
    setLoadingLocations(true)
    setLoadError('')
    fetchLocations()
  }

  useEffect(() => {
    let active = true

    fetchLocations(() => active)

    return () => {
      active = false
    }
  }, [fetchLocations])

  const updateField = (event) => {
    const { name, value } = event.target
    updateFormValue(name, value)
  }

  const updateFormValue = (name, value) => {
    setForm((current) => {
      const nextForm = {
        ...current,
        [name]: value,
      }

      saveTripSearch(nextForm)
      return nextForm
    })

    setErrors((current) => ({
      ...current,
      [name]: '',
    }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.pickupLocationId) {
      nextErrors.pickupLocationId = 'Please choose a pickup location.'
    }

    if (!form.pickupDate) {
      nextErrors.pickupDate = 'Please choose a pickup date.'
    } else if (form.pickupDate < today) {
      nextErrors.pickupDate = 'Pickup date cannot be in the past.'
    }

    if (!form.pickupTime) {
      nextErrors.pickupTime = 'Please choose a pickup time.'
    }

    if (!form.dropoffDate) {
      nextErrors.dropoffDate =
        'Please choose a drop-off date so we can calculate your rental period.'
    } else if (form.dropoffDate < tomorrow) {
      nextErrors.dropoffDate = 'Drop-off date must be tomorrow or later.'
    }

    if (!form.dropoffTime) {
      nextErrors.dropoffTime =
        'Please choose a drop-off time so we can calculate your rental period.'
    }

    if (
      form.pickupDate &&
      form.pickupTime &&
      form.dropoffDate &&
      form.dropoffTime &&
      !hasValidRentalPeriod(form)
    ) {
      nextErrors.dropoffDate = 'Drop-off must be after pickup.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canShowCars || !validate()) {
      return
    }

    setLoading(true)

    try {
      const savedToSession = saveTripSearch(form)

      await fetch('/api/rental/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (savedToSession) {
        navigate('/cars')
      } else {
        navigate(`/cars?${tripSearchToParams(form).toString()}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-[1440px]"
      noValidate
      onSubmit={handleSubmit}
    >
      {loadError ? (
        <div className="mb-5 flex flex-col gap-3 rounded-md border border-red-300 bg-white px-4 py-3 text-left text-sm text-[#333333] sm:flex-row sm:items-center sm:justify-between">
          <p>{loadError}</p>
          <button
            className="min-h-10 rounded-md border border-red-300 bg-white px-4 font-semibold text-[#333333] transition hover:border-red-500"
            onClick={retryLocations}
            type="button"
          >
            Try again
          </button>
        </div>
      ) : null}

      {location.state?.tripSearchError ? (
        <p className="mb-5 rounded-md border border-amber-200 bg-white px-4 py-3 text-left text-sm font-semibold text-[#333333]">
          {location.state.tripSearchError}
        </p>
      ) : null}

      {missingRentalPeriodReason(form) && hasRequiredPickupDetails(form) ? (
        <p className="mb-5 rounded-md border border-amber-200 bg-white px-4 py-3 text-left text-sm font-semibold text-[#333333]">
          {missingRentalPeriodReason(form)}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr_1fr]">
        <Field
          error={errors.pickupLocationId}
          id="pickupLocationId"
          label="Pickup location"
          required
        >
          <select
            aria-invalid={Boolean(errors.pickupLocationId)}
            className={inputClass(errors.pickupLocationId)}
            id="pickupLocationId"
            name="pickupLocationId"
            onChange={updateField}
            disabled={loadingLocations}
            value={form.pickupLocationId}
          >
            <option value="">
              {loadingLocations
                ? 'Loading airport locations...'
                : 'Please choose a pickup location'}
            </option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {formatLocation(location)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          error={errors.pickupDate}
          id="pickupDate"
          label="Pickup date"
          required
        >
          <input
            aria-invalid={Boolean(errors.pickupDate)}
            className={inputClass(errors.pickupDate)}
            id="pickupDate"
            min={today}
            name="pickupDate"
            onChange={updateField}
            type="date"
            value={form.pickupDate}
          />
        </Field>

        <Field
          error={errors.pickupTime}
          id="pickupTime"
          label="Pickup time"
          required
        >
          <TimeTuner
            error={errors.pickupTime}
            id="pickupTime"
            name="pickupTime"
            onChange={updateFormValue}
            value={form.pickupTime}
          />
        </Field>

        <Field id="dropoffLocationId" label="Drop-off location">
          <select
            className={inputClass()}
            id="dropoffLocationId"
            name="dropoffLocationId"
            onChange={updateField}
            disabled={loadingLocations}
            value={form.dropoffLocationId}
          >
            <option value="">
              {loadingLocations
                ? 'Loading airport locations...'
                : 'Please choose a drop-off location'}
            </option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {formatLocation(location)}
              </option>
            ))}
          </select>
        </Field>

        <Field
          error={errors.dropoffDate}
          id="dropoffDate"
          label="Drop-off date"
          required
        >
          <input
            aria-invalid={Boolean(errors.dropoffDate)}
            className={inputClass(errors.dropoffDate)}
            id="dropoffDate"
            min={tomorrow}
            name="dropoffDate"
            onChange={updateField}
            type="date"
            value={form.dropoffDate}
          />
        </Field>

        <Field
          error={errors.dropoffTime}
          id="dropoffTime"
          label="Drop-off time"
          required
        >
          <TimeTuner
            error={errors.dropoffTime}
            id="dropoffTime"
            name="dropoffTime"
            onChange={updateFormValue}
            value={form.dropoffTime}
          />
        </Field>
      </div>

      <div className="mt-10 flex justify-center">
        <button
          className={showCarsButtonClass(canShowCars)}
          disabled={!canShowCars || loading}
          type="submit"
        >
          {loading ? 'Checking...' : 'Show cars!'}
        </button>
      </div>
    </form>
  )
}

function TimeTuner({ error, id, name, onChange, value }) {
  const selectedStep = timeToStep(value || '12:00')
  const selectedTime = stepToTime(selectedStep)
  const percentage = (selectedStep / 47) * 100

  return (
    <div
      className={`rounded-md border bg-white px-4 py-4 shadow-sm ${
        error ? 'border-red-500' : 'border-slate-300'
      }`}
    >
      <div className="mb-7 flex items-center justify-between text-sm font-medium">
        <span>00:00</span>
        <span className="text-3xl font-medium leading-tight">{selectedTime}</span>
        <span>23:30</span>
      </div>

      <div className="relative h-10">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-[#888888]" />
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500 shadow-md"
          style={{ left: `${percentage}%` }}
        />
        <input
          aria-invalid={Boolean(error)}
          aria-label={`${name === 'pickupTime' ? 'Pickup' : 'Drop-off'} time`}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          id={id}
          max="47"
          min="0"
          name={name}
          onChange={(event) => onChange(name, stepToTime(Number(event.target.value)))}
          step="1"
          type="range"
          value={selectedStep}
        />
      </div>
    </div>
  )
}

function timeToStep(value) {
  const [hours = '12', minutes = '00'] = value.split(':')
  const step = Number(hours) * 2 + (Number(minutes) >= 30 ? 1 : 0)

  return Number.isNaN(step) ? 24 : Math.min(47, Math.max(0, step))
}

function stepToTime(step) {
  const hours = Math.floor(step / 2)
  const minutes = step % 2 === 0 ? '00' : '30'

  return `${String(hours).padStart(2, '0')}:${minutes}`
}

function Field({ children, error, id, label, required = false }) {
  return (
    <div className="text-left">
      <label className="mb-1 block text-sm text-[#333333]" htmlFor={id}>
        {label}
        {required ? <span className="sr-only"> required</span> : null}
      </label>
      {children}
      {error ? <p className="mt-2 text-sm font-medium text-[#333333]">{error}</p> : null}
    </div>
  )
}

function inputClass(error) {
  return `h-12 w-full rounded-md border bg-white px-4 text-sm text-[#333333] shadow-sm outline-none transition placeholder:text-[#333333] focus:ring-2 ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-300 focus:border-slate-700 focus:ring-slate-200'
  }`
}

function showCarsButtonClass(canShowCars) {
  const baseClass =
    'min-h-16 min-w-72 rounded-md border px-10 py-4 text-xl font-bold uppercase tracking-normal shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-4'

  if (canShowCars) {
    return `${baseClass} border-pink-500 bg-pink-500 text-white shadow-pink-500/30 hover:border-pink-600 hover:bg-pink-600 focus-visible:outline-pink-600`
  }

  return `${baseClass} cursor-not-allowed border-slate-400 bg-white text-[#333333] opacity-70 focus-visible:outline-slate-500`
}

function formatLocation(location) {
  return location.iataCode
    ? `${location.name} (${location.iataCode})`
    : location.name
}

export default CarSearchForm
