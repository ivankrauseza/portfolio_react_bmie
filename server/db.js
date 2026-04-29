import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(rootDir, 'data')
const dbPath = process.env.DATABASE_URL
  ? path.resolve(process.env.DATABASE_URL.replace('sqlite:', ''))
  : path.join(dataDir, 'app.sqlite')

mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rental_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    iata_code TEXT,
    icao_code TEXT,
    county TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS rental_cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    seats INTEGER NOT NULL,
    doors INTEGER NOT NULL DEFAULT 4,
    transmission TEXT NOT NULL,
    radio_spec TEXT NOT NULL DEFAULT 'CD/MP3/Bluetooth',
    daily_rate_eur INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    is_available INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (location_id) REFERENCES rental_locations(id)
  );

  CREATE TABLE IF NOT EXISTS rental_searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pickup_location_id INTEGER NOT NULL,
    pickup_date TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    dropoff_location_id INTEGER,
    dropoff_date TEXT,
    dropoff_time TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pickup_location_id) REFERENCES rental_locations(id),
    FOREIGN KEY (dropoff_location_id) REFERENCES rental_locations(id)
  );

  CREATE TABLE IF NOT EXISTS rental_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference TEXT NOT NULL UNIQUE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('pay_now', 'pay_later')),
    payment_status TEXT NOT NULL,
    booking_status TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    vehicle_total_cents INTEGER NOT NULL,
    extras_total_cents INTEGER NOT NULL,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    payable_total_cents INTEGER NOT NULL,
    stripe_payment_intent_id TEXT,
    stripe_payment_status TEXT,
    pickup_location_id INTEGER NOT NULL,
    pickup_date TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    dropoff_location_id INTEGER,
    dropoff_date TEXT NOT NULL,
    dropoff_time TEXT NOT NULL,
    car_id INTEGER NOT NULL,
    driver_snapshot TEXT NOT NULL,
    drivers_snapshot TEXT NOT NULL,
    extras_snapshot TEXT NOT NULL,
    trip_snapshot TEXT NOT NULL,
    car_snapshot TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pickup_location_id) REFERENCES rental_locations(id),
    FOREIGN KEY (dropoff_location_id) REFERENCES rental_locations(id),
    FOREIGN KEY (car_id) REFERENCES rental_cars(id)
  );
`)

const rentalLocationColumns = db
  .prepare('PRAGMA table_info(rental_locations)')
  .all()
  .map((column) => column.name)

for (const column of [
  ['iata_code', 'TEXT'],
  ['icao_code', 'TEXT'],
  ['county', 'TEXT'],
]) {
  if (!rentalLocationColumns.includes(column[0])) {
    db.exec(`ALTER TABLE rental_locations ADD COLUMN ${column[0]} ${column[1]}`)
  }
}

const rentalCarColumns = db
  .prepare('PRAGMA table_info(rental_cars)')
  .all()
  .map((column) => column.name)

if (!rentalCarColumns.includes('doors')) {
  db.exec('ALTER TABLE rental_cars ADD COLUMN doors INTEGER NOT NULL DEFAULT 4')
}

if (!rentalCarColumns.includes('radio_spec')) {
  db.exec(
    "ALTER TABLE rental_cars ADD COLUMN radio_spec TEXT NOT NULL DEFAULT 'CD/MP3/Bluetooth'",
  )
}

const seedSetting = db.prepare(`
  INSERT INTO app_settings (key, value)
  VALUES (@key, @value)
  ON CONFLICT(key) DO NOTHING
`)

seedSetting.run({ key: 'site_name', value: 'BMIE portfolio' })

const seedLocation = db.prepare(`
  INSERT INTO rental_locations (
    name,
    city,
    country,
    iata_code,
    icao_code,
    county
  )
  VALUES (
    @name,
    @city,
    @country,
    @iata_code,
    @icao_code,
    @county
  )
  ON CONFLICT(name) DO UPDATE SET
    city = excluded.city,
    country = excluded.country,
    iata_code = excluded.iata_code,
    icao_code = excluded.icao_code,
    county = excluded.county,
    is_active = 1
`)

const seedCar = db.prepare(`
  INSERT INTO rental_cars (
    name,
    category,
    seats,
    doors,
    transmission,
    radio_spec,
    daily_rate_eur,
    location_id
  )
  SELECT
    @name,
    @category,
    @seats,
    @doors,
    @transmission,
    @radio_spec,
    @daily_rate_eur,
    rental_locations.id
  FROM rental_locations
  WHERE rental_locations.name = @location
    AND NOT EXISTS (
      SELECT 1
      FROM rental_cars
      WHERE rental_cars.name = @name
        AND rental_cars.location_id = rental_locations.id
    )
`)

const seedRentalData = db.transaction(() => {
  const locations = [
    {
      name: 'Cork Airport',
      city: 'Cork',
      country: 'Ireland',
      county: 'County Cork',
      iata_code: 'ORK',
      icao_code: 'EICK',
    },
    {
      name: 'Donegal Airport',
      city: 'Dungloe',
      country: 'Ireland',
      county: 'County Donegal',
      iata_code: 'CFN',
      icao_code: 'EIDL',
    },
    {
      name: 'Dublin Airport',
      city: 'Dublin',
      country: 'Ireland',
      county: 'Fingal',
      iata_code: 'DUB',
      icao_code: 'EIDW',
    },
    {
      name: 'Weston Airport',
      city: 'Leixlip',
      country: 'Ireland',
      county: 'South Dublin / County Kildare',
      iata_code: null,
      icao_code: 'EIWT',
    },
    {
      name: 'Galway Airport',
      city: 'Carnmore',
      country: 'Ireland',
      county: 'County Galway',
      iata_code: 'GWY',
      icao_code: 'EICM',
    },
    {
      name: 'Kerry Airport',
      city: 'Farranfore',
      country: 'Ireland',
      county: 'County Kerry',
      iata_code: 'KIR',
      icao_code: 'EIKY',
    },
    {
      name: 'Ireland West Airport Knock',
      city: 'Charlestown',
      country: 'Ireland',
      county: 'County Mayo',
      iata_code: 'NOC',
      icao_code: 'EIKN',
    },
    {
      name: 'Shannon Airport',
      city: 'Shannon',
      country: 'Ireland',
      county: 'County Clare',
      iata_code: 'SNN',
      icao_code: 'EINN',
    },
    {
      name: 'Sligo Airport',
      city: 'Strandhill',
      country: 'Ireland',
      county: 'County Sligo',
      iata_code: 'SXL',
      icao_code: 'EISG',
    },
    {
      name: 'Waterford Airport',
      city: 'Waterford',
      country: 'Ireland',
      county: 'County Waterford',
      iata_code: 'WAT',
      icao_code: 'EIWF',
    },
  ]

  db.prepare('DELETE FROM rental_cars').run()
  db.prepare('UPDATE rental_locations SET is_active = 0').run()

  for (const location of locations) {
    seedLocation.run(location)
  }

  const carTemplates = [
    {
      name: 'Fiat 500',
      category: 'Mini',
      seats: 4,
      doors: 2,
      transmission: 'Manual',
      radio_spec: 'CD/MP3/Bluetooth',
      daily_rate_eur: 33,
    },
    {
      name: 'Ford Fiesta',
      category: 'Hatchback',
      seats: 5,
      doors: 4,
      transmission: 'Manual',
      radio_spec: 'Bluetooth/USB/DAB',
      daily_rate_eur: 36,
    },
    {
      name: 'Volkswagen Golf',
      category: 'Hatchback',
      seats: 5,
      doors: 4,
      transmission: 'Manual',
      radio_spec: 'DAB/Bluetooth/USB-C',
      daily_rate_eur: 39,
    },
    {
      name: 'Mercedes A-Class',
      category: 'Hatchback',
      seats: 5,
      doors: 4,
      transmission: 'Automatic',
      radio_spec: 'Bluetooth/DAB/CarPlay',
      daily_rate_eur: 42,
    },
    {
      name: 'Toyota Yaris',
      category: 'Economy',
      seats: 5,
      doors: 4,
      transmission: 'Manual',
      radio_spec: 'CD/MP3/AUX',
      daily_rate_eur: 45,
    },
    {
      name: 'Nissan Qashqai',
      category: 'SUV',
      seats: 5,
      doors: 4,
      transmission: 'Automatic',
      radio_spec: 'Bluetooth/USB/Android Auto',
      daily_rate_eur: 48,
    },
    {
      name: 'Skoda Superb',
      category: 'Saloon',
      seats: 5,
      doors: 4,
      transmission: 'Automatic',
      radio_spec: 'DAB/Bluetooth/CarPlay',
      daily_rate_eur: 51,
    },
    {
      name: 'Hyundai Tucson',
      category: 'SUV',
      seats: 5,
      doors: 4,
      transmission: 'Automatic',
      radio_spec: 'Bluetooth/DAB/USB',
      daily_rate_eur: 86,
    },
    {
      name: 'Skoda Octavia Estate',
      category: 'Estate',
      seats: 5,
      doors: 4,
      transmission: 'Automatic',
      radio_spec: 'DAB/USB/SmartLink',
      daily_rate_eur: 74,
    },
    {
      name: 'Ford Puma',
      category: 'Crossover',
      seats: 5,
      doors: 4,
      transmission: 'Manual',
      radio_spec: 'Bluetooth/DAB/USB-C',
      daily_rate_eur: 66,
    },
    {
      name: 'Mercedes Vito',
      category: 'People Carrier',
      seats: 8,
      doors: 4,
      transmission: 'Automatic',
      radio_spec: 'Bluetooth/USB/DAB',
      daily_rate_eur: 129,
    },
    {
      name: 'BMW 3 Series',
      category: 'Saloon',
      seats: 5,
      doors: 4,
      transmission: 'Automatic',
      radio_spec: 'DAB/Bluetooth/CarPlay',
      daily_rate_eur: 95,
    },
  ]

  for (const location of locations) {
    const airportOffset = location.name.length % 9

    for (const car of carTemplates) {
      seedCar.run({
        ...car,
        daily_rate_eur: car.daily_rate_eur + airportOffset,
        location: location.name,
      })
    }
  }
})

seedRentalData()

export { db, dbPath }
