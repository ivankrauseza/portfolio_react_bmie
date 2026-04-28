export const bookingSessionKey = 'sparrow.booking'

export const emptyDriver = {
  name: '',
  licenceNumber: '',
  phone: '',
  email: '',
  address: '',
  flightNumber: '',
  notes: '',
}

const testDriverDefaults = [
  {
    name: 'James May',
    phone: '+353 083 123 4567',
    email: 'name@email.com',
    address: '123 Levine Road\nCastleknock\nCo. Dublin\nD15 123',
    flightNumber: 'BK-12345678',
    notes: 'No special assistance required.',
  },
  {
    name: 'Sarah Kelly',
    phone: '+353 086 555 0182',
    email: 'sarah.kelly@email.com',
    address: '42 Harbour View\nDun Laoghaire\nCo. Dublin\nA96 4K20',
    flightNumber: 'EI-204',
    notes: 'Additional approved driver.',
  },
  {
    name: 'Michael Byrne',
    phone: '+353 087 555 0194',
    email: 'michael.byrne@email.com',
    address: '8 Market Street\nKillarney\nCo. Kerry\nV93 8R22',
    flightNumber: 'FR-9021',
    notes: 'Additional approved driver.',
  },
]

export const initialBooking = {
  selectedCar: null,
  extras: {},
  driverInfo: emptyDriver,
  drivers: [emptyDriver],
}

export const extraDefinitions = {
  collisionProtection: {
    id: 'collisionProtection',
    title: 'Collision Protection',
    subtitle: 'Click to find out more',
    icon: 'health_and_safety',
    pricePerDay: 12,
    description:
      'Adds extra cover for accidental vehicle damage during your rental period.',
  },
  additionalDrivers: {
    id: 'additionalDrivers',
    title: 'Additional Drivers',
    subtitle: 'Click to find out more',
    icon: 'person_add',
    pricePerDay: 10,
    description:
      'Add extra approved drivers to the booking. The fee is charged per driver per rental day.',
  },
  childSeat: {
    id: 'childSeat',
    title: 'Child Seat',
    subtitle: 'Click to find out more',
    icon: 'child_friendly',
    pricePerDay: 6,
    description: 'Reserve a child seat so it is ready when you collect the car.',
  },
  prepaidFuel: {
    id: 'prepaidFuel',
    title: 'Pre-Paid Fuel',
    subtitle: 'Click to find out more',
    icon: 'local_gas_station',
    flatPrice: 75,
    description:
      'Pre-pay for fuel and return the vehicle without refilling the tank.',
  },
  navigationDevice: {
    id: 'navigationDevice',
    title: 'Navigation Device',
    subtitle: 'Click to find out more',
    icon: 'map',
    pricePerDay: 8,
    description: 'Add a navigation device to help plan your route.',
  },
  wifiOnTheMove: {
    id: 'wifiOnTheMove',
    title: 'Wifi on the Move',
    subtitle: 'Click to find out more',
    icon: 'settings_input_antenna',
    pricePerDay: 7,
    description: 'Stay connected with portable in-car wifi during your trip.',
  },
}

export function loadBooking() {
  try {
    const storedBooking = window.sessionStorage.getItem(bookingSessionKey)

    if (!storedBooking) {
      return initialBooking
    }

    const parsedBooking = JSON.parse(storedBooking)

    return {
      ...initialBooking,
      ...parsedBooking,
      drivers: normalizeDrivers(parsedBooking),
    }
  } catch {
    return initialBooking
  }
}

export function saveBooking(booking) {
  try {
    window.sessionStorage.setItem(bookingSessionKey, JSON.stringify(booking))
    return true
  } catch {
    return false
  }
}

export function clearBookingSession() {
  try {
    window.sessionStorage.removeItem(bookingSessionKey)
    return true
  } catch {
    return false
  }
}

export function saveSelectedCar(car) {
  const booking = loadBooking()

  return saveBooking({
    ...booking,
    selectedCar: car,
  })
}

export function updateBookingExtras(extras) {
  const booking = loadBooking()
  const nextBooking = {
    ...booking,
    extras,
  }

  saveBooking(nextBooking)
  return nextBooking
}

export function updateDriverInfo(driverInfo) {
  const booking = loadBooking()
  const nextBooking = {
    ...booking,
    driverInfo,
    drivers: [
      {
        ...emptyDriver,
        ...driverInfo,
      },
      ...normalizeDrivers(booking).slice(1),
    ],
  }

  saveBooking(nextBooking)
  return nextBooking
}

export function updateDrivers(drivers) {
  const normalizedDrivers = drivers.map((driver) => ({
    ...emptyDriver,
    ...driver,
  }))
  const booking = loadBooking()
  const nextBooking = {
    ...booking,
    driverInfo: normalizedDrivers[0] ?? emptyDriver,
    drivers: normalizedDrivers.length > 0 ? normalizedDrivers : [emptyDriver],
  }

  saveBooking(nextBooking)
  return nextBooking
}

export function requiredDriverCount(booking) {
  return 1 + (booking.extras?.additionalDrivers?.quantity ?? 0)
}

export function normalizeDrivers(booking) {
  const currentDrivers = Array.isArray(booking.drivers)
    ? booking.drivers
    : [booking.driverInfo ?? emptyDriver]
  const count = requiredDriverCount(booking)
  const drivers = Array.from({ length: count }, (_, index) => ({
    ...emptyDriver,
    ...(currentDrivers[index] ?? {}),
  }))

  return drivers
}

export function preloadTestDriverData(drivers) {
  return drivers.map((driver, index) => {
    const defaults = testDriverDefaults[index] ?? {
      name: `Additional Driver ${index}`,
      phone: '+353 087 555 0100',
      email: `driver${index}@email.com`,
      address: `${index} Airport Road\nDublin\nIreland`,
      flightNumber: '',
      notes: 'Additional approved driver.',
    }
    const preloadedDriver = {
      ...emptyDriver,
      ...defaults,
    }

    return {
      ...preloadedDriver,
      ...Object.fromEntries(
        Object.entries(driver).filter(([, value]) => value?.trim?.() || value),
      ),
      licenceNumber: driver.licenceNumber ?? '',
    }
  })
}

export function validateDrivers(drivers) {
  return drivers.map((driver) => {
    const errors = {}

    if (!driver.name?.trim() || driver.name.trim().length < 2) {
      errors.name = 'Enter the driver name.'
    }

    if (!driver.licenceNumber?.trim() || driver.licenceNumber.trim().length < 6) {
      errors.licenceNumber = 'Enter a valid licence number.'
    }

    const phoneDigits = driver.phone?.replace(/\D/g, '') ?? ''
    if (phoneDigits.length < 7) {
      errors.phone = 'Enter a valid phone number.'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email?.trim() ?? '')) {
      errors.email = 'Enter a valid email address.'
    }

    if (!driver.address?.trim() || driver.address.trim().length < 8) {
      errors.address = 'Enter the driver address.'
    }

    return errors
  })
}

export function calculateRentalDays(tripSearch) {
  if (!tripSearch.pickupDate || !tripSearch.dropoffDate) {
    return 1
  }

  const pickup = new Date(`${tripSearch.pickupDate}T${tripSearch.pickupTime || '00:00'}`)
  const dropoff = new Date(`${tripSearch.dropoffDate}T${tripSearch.dropoffTime || '00:00'}`)
  const diff = dropoff.getTime() - pickup.getTime()

  if (Number.isNaN(diff) || diff <= 0) {
    return 1
  }

  return Math.max(1, Math.ceil(diff / 86_400_000))
}

export function calculateExtraCost(extra, days) {
  const definition = extraDefinitions[extra.id]

  if (!definition) {
    return 0
  }

  const quantity = extra.quantity ?? 1

  if (definition.flatPrice) {
    return definition.flatPrice * quantity
  }

  return (definition.pricePerDay ?? 0) * days * quantity
}

export function calculateBookingTotal({ selectedCar, extras }, tripSearch) {
  const days = calculateRentalDays(tripSearch)
  const vehicleTotal = selectedCar ? selectedCar.dailyRateEur * days : 0
  const extrasTotal = Object.values(extras ?? {}).reduce(
    (total, extra) => total + calculateExtraCost(extra, days),
    0,
  )

  return {
    days,
    extrasTotal,
    total: vehicleTotal + extrasTotal,
    vehicleTotal,
  }
}
