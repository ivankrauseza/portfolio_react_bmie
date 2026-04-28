export const tripSessionKey = 'sparrow.tripSearch'

export const initialTripSearch = {
  pickupLocationId: '',
  pickupDate: '',
  pickupTime: '',
  dropoffLocationId: '',
  dropoffDate: '',
  dropoffTime: '',
}

export function loadTripSearch() {
  try {
    const storedForm = window.sessionStorage.getItem(tripSessionKey)

    if (!storedForm) {
      return initialTripSearch
    }

    return {
      ...initialTripSearch,
      ...JSON.parse(storedForm),
    }
  } catch {
    return initialTripSearch
  }
}

export function saveTripSearch(form) {
  try {
    window.sessionStorage.setItem(tripSessionKey, JSON.stringify(form))
    return true
  } catch {
    return false
  }
}

export function clearTripSearch() {
  try {
    window.sessionStorage.removeItem(tripSessionKey)
    return true
  } catch {
    return false
  }
}

export function hasRequiredPickupDetails(form) {
  return Boolean(form.pickupLocationId && form.pickupDate && form.pickupTime)
}

export function hasValidRentalPeriod(form) {
  if (
    !form.pickupLocationId ||
    !form.pickupDate ||
    !form.pickupTime ||
    !form.dropoffDate ||
    !form.dropoffTime
  ) {
    return false
  }

  if (
    form.pickupDate < todayDateInputValue() ||
    form.dropoffDate < tomorrowDateInputValue()
  ) {
    return false
  }

  const pickup = new Date(`${form.pickupDate}T${form.pickupTime}`)
  const dropoff = new Date(`${form.dropoffDate}T${form.dropoffTime}`)

  return (
    !Number.isNaN(pickup.getTime()) &&
    !Number.isNaN(dropoff.getTime()) &&
    dropoff.getTime() > pickup.getTime()
  )
}

export function missingRentalPeriodReason(form) {
  if (!form.pickupLocationId || !form.pickupDate || !form.pickupTime) {
    return 'Please choose a pickup location, date, and time.'
  }

  if (!form.dropoffDate || !form.dropoffTime) {
    return 'Please choose a drop-off date and time so we can calculate your rental period.'
  }

  if (form.pickupDate < todayDateInputValue()) {
    return 'Pickup date cannot be in the past.'
  }

  if (form.dropoffDate < tomorrowDateInputValue()) {
    return 'Drop-off date must be tomorrow or later.'
  }

  if (!hasValidRentalPeriod(form)) {
    return 'Drop-off must be after pickup.'
  }

  return ''
}

export function tripSearchFromParams(searchParams) {
  return {
    ...initialTripSearch,
    pickupLocationId: searchParams.get('pickupLocationId') ?? '',
    pickupDate: searchParams.get('pickupDate') ?? '',
    pickupTime: searchParams.get('pickupTime') ?? '',
    dropoffLocationId: searchParams.get('dropoffLocationId') ?? '',
    dropoffDate: searchParams.get('dropoffDate') ?? '',
    dropoffTime: searchParams.get('dropoffTime') ?? '',
  }
}

export function tripSearchToParams(form) {
  const params = new URLSearchParams({
    pickupLocationId: form.pickupLocationId,
    pickupDate: form.pickupDate,
    pickupTime: form.pickupTime,
  })

  for (const key of ['dropoffLocationId', 'dropoffDate', 'dropoffTime']) {
    if (form[key]) {
      params.set(key, form[key])
    }
  }

  return params
}

export function todayDateInputValue() {
  return dateInputValue(0)
}

export function tomorrowDateInputValue() {
  return dateInputValue(1)
}

function dateInputValue(offsetDays) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
