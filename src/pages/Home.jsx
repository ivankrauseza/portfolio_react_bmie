import MaterialIcon from '../components/MaterialIcon.jsx'
import CarSearchForm from '../components/CarSearchForm.jsx'

const usps = [
  {
    icon: 'flight_takeoff',
    label: 'Airport only',
    title: 'All Irish airports covered',
    body: 'Pick up and drop off at supported airport desks across Ireland.',
  },
  {
    icon: 'directions_car',
    label: 'Flexible fleet',
    title: 'From city cars to family SUVs',
    body: 'Compare compact, hatchback, SUV, estate, saloon, and people carrier options.',
  },
  {
    icon: 'verified_user',
    label: 'Clear booking',
    title: 'No surprises before checkout',
    body: 'See dates, extras, driver requirements, totals, and pay-now or pay-later choices.',
  },
]

const topLocations = [
  'Dublin Airport',
  'Cork Airport',
  'Shannon Airport',
  'Ireland West Airport Knock',
  'Kerry Airport',
  'Donegal Airport',
  'Waterford Airport',
  'Galway Airport',
  'Sligo Airport',
  'Weston Airport',
]

function Home() {
  return (
    <section className="flex w-full flex-1 flex-col bg-slate-200 text-[#333333]">
      <div className="flex w-full flex-1 flex-col items-center px-8 md:px-16 lg:px-24 py-14">
        <div className="mb-10 text-center text-[#333333]">
          <h1 className="mb-3 text-4xl font-bold uppercase text-[#333333]">
            Let&apos;s find you some wheels!
          </h1>
          <p className="text-lg font-medium text-[#333333]">
            Please enter your trip details below to view our cars, even if you
            are just browsing.
          </p>
        </div>

        <CarSearchForm />
      </div>

      <section className="w-full bg-[#cccccc] px-8 md:px-16 lg:px-24 py-12 text-center text-[#333333]">
        <h2 className="mx-auto w-full max-w-[1440px] text-5xl font-black uppercase leading-tight tracking-normal">
          Rent first class.
          <br />
          Pay economy.
        </h2>
        <p className="mt-5 text-lg font-bold">
          Premium-feeling car rental at practical airport prices.
        </p>
      </section>

      <section className="w-full bg-white px-8 md:px-16 lg:px-24 py-14">
        <div className="mx-auto grid w-full max-w-[1440px] gap-8 text-left md:grid-cols-3">
          {usps.map((usp) => (
            <article key={usp.title}>
              <p className="mb-5 flex items-center gap-3 text-sm font-bold">
                <MaterialIcon className="text-3xl leading-none">
                  {usp.icon}
                </MaterialIcon>
                {usp.label}
              </p>
              <h3 className="mb-3 text-2xl font-black leading-tight">
                {usp.title}
              </h3>
              <p className="text-base font-medium leading-relaxed">
                {usp.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full bg-white px-8 md:px-16 lg:px-24 py-16">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 text-left lg:grid-cols-[0.8fr_1.4fr]">
          <div>
            <h2 className="mb-6 text-5xl font-black uppercase leading-tight tracking-normal">
              Sparrow car hire in Ireland
            </h2>
            <p className="text-lg font-medium leading-relaxed">
              Start with your airport, dates, and times, then Sparrow shows the
              cars available for that trip. Choose extras only if you need them,
              complete driver details, and decide whether to pay now or reserve
              the car for payment at the airport desk.
            </p>
          </div>

          <div>
            <div className="mb-8 flex flex-wrap gap-3">
              <span className="rounded-full bg-pink-500 px-5 py-2 text-sm font-bold text-white">
                Top locations
              </span>
              <span className="rounded-full bg-[#cccccc] px-5 py-2 text-sm font-bold">
                Irish airports
              </span>
              <span className="rounded-full bg-[#cccccc] px-5 py-2 text-sm font-bold">
                Pay now or later
              </span>
            </div>

            <ul className="grid gap-x-10 gap-y-5 text-base font-bold md:grid-cols-2 lg:grid-cols-3">
              {topLocations.map((location) => (
                <li key={location}>{location}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </section>
  )
}

export default Home
