
export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-400">
            About the Project
          </p>

          <h1 className="text-3xl font-bold">MediLocate</h1>

          <p className="mt-3 leading-7 text-slate-300">
            A location-based hospital discovery prototype that helps users
            explore nearby hospitals through interactive maps and
            multi-criteria recommendations.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-xl font-semibold">What MediLocate Does</h2>

          <p className="leading-7 text-slate-600">
            Users can detect their current location or enter an area manually,
            select a search radius, and view nearby hospitals on a map and in
            a ranked list. Recommendations prioritise distance and, where
            demo review data is available, incorporate ratings and sentiment.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-xl font-semibold">How It Works</h2>

          <ol className="list-inside list-decimal space-y-2 leading-7 text-slate-600">
            <li>Choose your current location or enter an area manually.</li>
            <li>Select a search radius to find nearby hospitals.</li>
            <li>Explore hospital locations on the map and in the ranked list.</li>
            <li>
              Switch between Normal and Emergency modes to apply different
              recommendation priorities.
            </li>
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-xl font-semibold">Data & Transparency</h2>

          <p className="leading-7 text-slate-600">
            Hospital locations are retrieved from OpenStreetMap through the
            Overpass API. Rating and sentiment signals currently use a
            simulated demo review dataset for the supported VESIT-area
            prototype. These reviews are not actual patient feedback.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-xl font-semibold">Current Scope</h2>

          <p className="leading-7 text-slate-600">
            MediLocate currently focuses on hospital discovery, map-based
            exploration, and multi-criteria recommendations. Surgery-cost
            comparison and a complete end-to-end appointment-booking
            experience are not currently implemented.
          </p>
        </section>
      </div>
    </main>
  );
}
