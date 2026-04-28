function About() {
  return (
    <section className="w-full flex-1 bg-slate-100 px-8 md:px-16 lg:px-24 py-12 text-[#333333]">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-normal text-emerald-700">
            About us
          </p>
          <h1 className="mb-5 text-5xl font-bold text-[#333333]">
            Simple car rental for Irish journeys
          </h1>
          <p className="mb-5 max-w-3xl text-lg text-[#333333]">
            Sparrow helps travellers compare airport pickup options across
            Ireland and get moving without burying the essentials in a long
            booking flow.
          </p>
          <p className="max-w-3xl text-[#333333]">
            We start with what matters: where you want to pick up the car, when
            you need it, and whether your return plans are already confirmed.
            From there, we show suitable cars and keep the process calm,
            transparent, and easy to change.
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-[#333333]">
            What we care about
          </h2>
          <ul className="space-y-4 text-[#333333]">
            <li>Airport-only pickup and drop-off locations for Irish travel.</li>
            <li>Clear search requirements before showing available cars.</li>
            <li>Flexible drop-off details when plans are still forming.</li>
            <li>A booking experience that feels fast, readable, and direct.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default About
