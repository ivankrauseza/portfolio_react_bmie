import express from 'express'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { db, dbPath } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const app = express()
const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.PORT || 3001)
const extraDefinitions = {
  collisionProtection: {
    title: 'Collision Protection',
    pricePerDay: 12,
  },
  additionalDrivers: {
    title: 'Additional Drivers',
    pricePerDay: 10,
  },
  childSeat: {
    title: 'Child Seat',
    pricePerDay: 6,
  },
  prepaidFuel: {
    title: 'Pre-Paid Fuel',
    flatPrice: 75,
  },
  navigationDevice: {
    title: 'Navigation Device',
    pricePerDay: 8,
  },
  wifiOnTheMove: {
    title: 'Wifi on the Move',
    pricePerDay: 7,
  },
}

app.use(express.json())

app.get('/api/health', (_req, res) => {
  const result = db.prepare('SELECT 1 AS ok').get()

  res.json({
    ok: result.ok === 1,
    database: 'sqlite',
    path: dbPath,
  })
})

app.get('/api/settings', (_req, res) => {
  const rows = db.prepare('SELECT key, value FROM app_settings').all()
  const settings = Object.fromEntries(rows.map((row) => [row.key, row.value]))

  res.json(settings)
})

app.get('/api/rental/locations', (_req, res) => {
  const locations = db
    .prepare(
      `
        SELECT id, name, city, country
          , iata_code AS iataCode
          , icao_code AS icaoCode
          , county
        FROM rental_locations
        WHERE is_active = 1
        ORDER BY name
      `,
    )
    .all()

  res.json({ locations })
})

app.get('/api/rental/cars', (req, res) => {
  const pickupLocationId = Number(req.query.pickupLocationId)

  if (!pickupLocationId) {
    return res.status(400).json({
      error: 'Pickup location is required.',
    })
  }

  const cars = db
    .prepare(
      `
        SELECT
          rental_cars.id,
          rental_cars.name,
          rental_cars.category,
          rental_cars.seats,
          rental_cars.doors,
          rental_cars.transmission,
          rental_cars.daily_rate_eur AS dailyRateEur,
          rental_locations.name AS locationName
        FROM rental_cars
        INNER JOIN rental_locations
          ON rental_locations.id = rental_cars.location_id
        WHERE rental_cars.is_available = 1
          AND rental_cars.location_id = ?
        ORDER BY rental_cars.daily_rate_eur, rental_cars.name
      `,
    )
    .all(pickupLocationId)

  return res.json({ cars })
})

app.post('/api/rental/searches', (req, res) => {
  const {
    pickupLocationId,
    pickupDate = '',
    pickupTime = '',
    dropoffLocationId = null,
    dropoffDate = '',
    dropoffTime = '',
  } = req.body ?? {}

  if (
    !pickupLocationId ||
    !pickupDate.trim() ||
    !pickupTime.trim() ||
    !dropoffDate.trim() ||
    !dropoffTime.trim()
  ) {
    return res.status(400).json({
      error: 'Pickup location, pickup date/time, and drop-off date/time are required.',
    })
  }

  const pickupAt = new Date(`${pickupDate.trim()}T${pickupTime.trim()}`)
  const dropoffAt = new Date(`${dropoffDate.trim()}T${dropoffTime.trim()}`)

  if (
    Number.isNaN(pickupAt.getTime()) ||
    Number.isNaN(dropoffAt.getTime()) ||
    dropoffAt.getTime() <= pickupAt.getTime()
  ) {
    return res.status(400).json({
      error: 'Drop-off must be after pickup.',
    })
  }

  if (
    pickupDate.trim() < todayDateInputValue() ||
    dropoffDate.trim() < tomorrowDateInputValue()
  ) {
    return res.status(400).json({
      error: 'Pickup must be today or later, and drop-off must be tomorrow or later.',
    })
  }

  const result = db
    .prepare(
      `
        INSERT INTO rental_searches (
          pickup_location_id,
          pickup_date,
          pickup_time,
          dropoff_location_id,
          dropoff_date,
          dropoff_time
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      Number(pickupLocationId),
      pickupDate.trim(),
      pickupTime.trim(),
      dropoffLocationId ? Number(dropoffLocationId) : null,
      dropoffDate.trim() || null,
      dropoffTime.trim() || null,
    )

  return res.status(201).json({ id: result.lastInsertRowid })
})

app.post('/api/rental/bookings', async (req, res) => {
  try {
    const { booking = {}, tripSearch = {}, paymentMethod = 'pay_later' } = req.body ?? {}

    if (!['pay_now', 'pay_later'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Payment method is not valid.' })
    }

    const selectedCar = booking.selectedCar
    const drivers = Array.isArray(booking.drivers) ? booking.drivers : []
    const driverErrors = validateDrivers(drivers)

    if (!selectedCar?.id) {
      return res.status(400).json({ error: 'A selected vehicle is required.' })
    }

    if (driverErrors.some((errors) => Object.keys(errors).length > 0)) {
      return res.status(400).json({ error: 'Complete driver details are required.' })
    }

    if (!hasValidRentalPeriod(tripSearch)) {
      return res.status(400).json({
        error: 'Valid pickup and drop-off dates are required.',
      })
    }

    const car = db
      .prepare(
        `
          SELECT
            id,
            name,
            category,
            seats,
            doors,
            transmission,
            daily_rate_eur AS dailyRateEur,
            location_id AS locationId
          FROM rental_cars
          WHERE id = ?
            AND is_available = 1
        `,
      )
      .get(Number(selectedCar.id))

    if (!car) {
      return res.status(400).json({ error: 'The selected vehicle is not available.' })
    }

    const totals = calculateBookingTotal(car, booking.extras ?? {}, tripSearch)
    const discountCents =
      paymentMethod === 'pay_now' ? Math.round(totals.grossTotalCents * 0.05) : 0
    const payableTotalCents = totals.grossTotalCents - discountCents
    const reference = createBookingReference()
    const paymentResult =
      paymentMethod === 'pay_now'
        ? await createStripeTestPaymentIntent({
            amountCents: payableTotalCents,
            reference,
          })
        : {
            id: null,
            status: 'pay_later',
            stripeStatus: null,
          }

    if (paymentMethod === 'pay_now' && paymentResult.status !== 'paid') {
      return res.status(402).json({
        error: 'Payment could not be completed.',
        paymentStatus: paymentResult.status,
      })
    }

    const bookingStatus = paymentMethod === 'pay_now' ? 'confirmed' : 'reserved'
    const paymentStatus = paymentMethod === 'pay_now' ? 'paid' : 'pay_later'

    db.prepare(
      `
        INSERT INTO rental_bookings (
          reference,
          payment_method,
          payment_status,
          booking_status,
          vehicle_total_cents,
          extras_total_cents,
          discount_cents,
          payable_total_cents,
          stripe_payment_intent_id,
          stripe_payment_status,
          pickup_location_id,
          pickup_date,
          pickup_time,
          dropoff_location_id,
          dropoff_date,
          dropoff_time,
          car_id,
          driver_snapshot,
          drivers_snapshot,
          extras_snapshot,
          trip_snapshot,
          car_snapshot
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      reference,
      paymentMethod,
      paymentStatus,
      bookingStatus,
      totals.vehicleTotalCents,
      totals.extrasTotalCents,
      discountCents,
      payableTotalCents,
      paymentResult.id,
      paymentResult.stripeStatus,
      Number(tripSearch.pickupLocationId),
      tripSearch.pickupDate,
      tripSearch.pickupTime,
      tripSearch.dropoffLocationId ? Number(tripSearch.dropoffLocationId) : null,
      tripSearch.dropoffDate,
      tripSearch.dropoffTime,
      car.id,
      JSON.stringify(drivers[0]),
      JSON.stringify(drivers),
      JSON.stringify(booking.extras ?? {}),
      JSON.stringify(tripSearch),
      JSON.stringify(car),
    )

    return res.status(201).json({
      bookingStatus,
      discount: centsToEuro(discountCents),
      paymentMethod,
      paymentStatus,
      payableTotal: centsToEuro(payableTotalCents),
      reference,
      stripePaymentIntentId: paymentResult.id,
      total: centsToEuro(totals.grossTotalCents),
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: 'Booking could not be completed. Please try again.',
    })
  }
})

app.post('/api/contact', (req, res) => {
  const { name = '', email = '', message = '' } = req.body ?? {}

  if (!name.trim() || !email.trim() || !message.trim()) {
    return res.status(400).json({
      error: 'Name, email, and message are required.',
    })
  }

  const result = db
    .prepare(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
    )
    .run(name.trim(), email.trim(), message.trim())

  return res.status(201).json({ id: result.lastInsertRowid })
})

if (existsSync(distDir)) {
  app.use(express.static(distDir))

  app.use((req, res, next) => {
    if (req.method !== 'GET' || !req.accepts('html')) {
      return next()
    }

    return res.sendFile(path.join(distDir, 'index.html'))
  })
}

const server = app.listen(port, host, () => {
  console.log(`API server running at http://${host}:${port}`)
  console.log(`SQLite database: ${dbPath}`)
})

server.on('error', (error) => {
  console.error(error)
  process.exit(1)
})

function hasValidRentalPeriod(form) {
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

function validateDrivers(drivers) {
  if (!drivers.length) {
    return [{ name: 'Required' }]
  }

  return drivers.map((driver) => {
    const errors = {}

    if (!driver.name?.trim() || driver.name.trim().length < 2) {
      errors.name = 'Required'
    }

    if (!driver.licenceNumber?.trim() || driver.licenceNumber.trim().length < 6) {
      errors.licenceNumber = 'Required'
    }

    if ((driver.phone?.replace(/\D/g, '') ?? '').length < 7) {
      errors.phone = 'Required'
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email?.trim() ?? '')) {
      errors.email = 'Required'
    }

    if (!driver.address?.trim() || driver.address.trim().length < 8) {
      errors.address = 'Required'
    }

    return errors
  })
}

function calculateBookingTotal(car, extras, tripSearch) {
  const days = calculateRentalDays(tripSearch)
  const vehicleTotalCents = car.dailyRateEur * days * 100
  const extrasTotalCents = Object.values(extras).reduce(
    (total, extra) => total + calculateExtraCostCents(extra, days),
    0,
  )

  return {
    days,
    extrasTotalCents,
    grossTotalCents: vehicleTotalCents + extrasTotalCents,
    vehicleTotalCents,
  }
}

function calculateRentalDays(tripSearch) {
  const pickup = new Date(`${tripSearch.pickupDate}T${tripSearch.pickupTime}`)
  const dropoff = new Date(`${tripSearch.dropoffDate}T${tripSearch.dropoffTime}`)
  const diff = dropoff.getTime() - pickup.getTime()

  if (Number.isNaN(diff) || diff <= 0) {
    return 1
  }

  return Math.max(1, Math.ceil(diff / 86_400_000))
}

function calculateExtraCostCents(extra, days) {
  const definition = extraDefinitions[extra.id]

  if (!definition) {
    return 0
  }

  const quantity = extra.quantity ?? 1

  if (definition.flatPrice) {
    return definition.flatPrice * quantity * 100
  }

  return (definition.pricePerDay ?? 0) * days * quantity * 100
}

async function createStripeTestPaymentIntent({ amountCents, reference }) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      id: `sim_${reference.toLowerCase()}`,
      status: 'paid',
      stripeStatus: 'simulated_no_stripe_key',
    }
  }

  const body = new URLSearchParams({
    amount: String(amountCents),
    currency: 'eur',
    confirm: 'true',
    payment_method: process.env.STRIPE_TEST_PAYMENT_METHOD || 'pm_card_visa',
    'metadata[booking_reference]': reference,
    description: `Sparrow car rental booking ${reference}`,
  })

  const response = await fetch('https://api.stripe.com/v1/payment_intents', {
    body,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  })
  const data = await response.json()

  if (!response.ok) {
    console.error('Stripe payment failed', data)
    return {
      id: data.payment_intent?.id ?? null,
      status: 'failed',
      stripeStatus: data.error?.code ?? 'stripe_error',
    }
  }

  return {
    id: data.id,
    status: data.status === 'succeeded' ? 'paid' : data.status,
    stripeStatus: data.status,
  }
}

function createBookingReference() {
  return `SPR-${Date.now().toString(36).toUpperCase().slice(-6)}`
}

function centsToEuro(cents) {
  return Number((cents / 100).toFixed(2))
}

function todayDateInputValue() {
  return dateInputValue(0)
}

function tomorrowDateInputValue() {
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
