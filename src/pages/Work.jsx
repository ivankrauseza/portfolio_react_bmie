import MaterialIcon from '../components/MaterialIcon.jsx'

const processSteps = [
  {
    icon: 'travel_explore',
    title: 'Search by trip details',
    body: 'Choose a pickup airport, pickup date, pickup time, drop-off date, and drop-off time. The drop-off details let us calculate the rental period and show the right availability.',
  },
  {
    icon: 'directions_car',
    title: 'Pick a vehicle',
    body: 'Browse cars available at the selected airport. Use filters for gearbox, car type, doors, driver age, and price order. Selecting a car opens the offer details before you continue.',
  },
  {
    icon: 'add_circle',
    title: 'Choose optional extras',
    body: 'Add extras such as additional drivers, child seats, collision protection, prepaid fuel, navigation, or wifi. Extras are optional and update the booking total immediately.',
  },
  {
    icon: 'badge',
    title: 'Enter driver information',
    body: 'The main driver is required. If you add additional drivers, each driver must provide the required details so the loss damage waiver can apply.',
  },
  {
    icon: 'credit_card',
    title: 'Confirm and book',
    body: 'Review the booking summary, vehicle, dates, driver details, and extras. Pay now to complete a test card payment, or pay later and settle at the airport desk.',
  },
]

const paymentOptions = [
  {
    title: 'Pay now',
    body: 'The booking is confirmed after a successful test payment. The database records the payment method as pay now, the payment status as paid, and stores the Stripe payment reference when Stripe keys are configured.',
  },
  {
    title: 'Pay later',
    body: 'The vehicle is reserved without taking payment online. The database records the payment method as pay later and the booking status as reserved, ready for airport desk staff to complete collection payment.',
  },
]

function Work() {
  return (
    <section className="w-full flex-1 bg-slate-100 px-8 md:px-16 lg:px-24 py-12 text-[#333333]">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-normal text-[#333333]">
            How it works
          </p>
          <h1 className="mb-4 text-5xl font-bold text-[#333333]">
            Rental process
          </h1>
          <p className="text-lg leading-relaxed text-[#333333]">
            Sparrow keeps the booking flow simple: enter the trip, choose the
            car, add any extras, complete driver details, then confirm how the
            customer wants to pay.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {processSteps.map((step, index) => (
            <section
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              key={step.title}
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#cccccc] text-[#333333]">
                  <MaterialIcon className="text-2xl leading-none">
                    {step.icon}
                  </MaterialIcon>
                </span>
                <span className="text-sm font-bold uppercase text-[#333333]">
                  Step {index + 1}
                </span>
              </div>
              <h2 className="mb-3 text-xl font-bold text-[#333333]">
                {step.title}
              </h2>
              <p className="text-sm leading-relaxed text-[#333333]">
                {step.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-md bg-[#cccccc] p-7 text-[#333333]">
            <h2 className="mb-4 text-2xl font-bold uppercase">
              What gets stored
            </h2>
            <ul className="space-y-3 text-sm font-semibold text-[#333333]">
              <li>Trip dates, times, pickup airport, and drop-off airport</li>
              <li>Selected vehicle snapshot and optional extras snapshot</li>
              <li>Main driver and additional driver details</li>
              <li>Booking reference, booking status, totals, and payment status</li>
              <li>Stripe payment intent reference for pay-now bookings</li>
            </ul>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="mb-5 text-2xl font-bold uppercase text-[#333333]">
              Payment choices
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {paymentOptions.map((option) => (
                <div
                  className="border-l-4 border-pink-700 pl-4"
                  key={option.title}
                >
                  <h3 className="mb-2 text-xl font-bold text-[#333333]">
                    {option.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#333333]">
                    {option.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}

export default Work
