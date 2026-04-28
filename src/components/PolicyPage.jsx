function PolicyPage({ title, updated, intro, sections }) {
  return (
    <section className="w-full flex-1 bg-[#cccccc] px-8 md:px-16 lg:px-24 py-12 text-[#333333]">
      <article className="mx-auto w-full max-w-[1440px] text-left">
        <p className="mb-3 text-sm font-semibold uppercase tracking-normal text-[#333333]">
          Policy
        </p>
        <h1 className="mb-3 text-5xl font-bold text-[#333333]">{title}</h1>
        <p className="mb-8 text-sm text-[#333333]">Last updated: {updated}</p>
        <p className="mb-10 max-w-3xl text-lg text-[#333333]">{intro}</p>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-2xl font-semibold text-[#333333]">
                {section.title}
              </h2>
              <p className="max-w-3xl text-[#333333]">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </section>
  )
}

export default PolicyPage
