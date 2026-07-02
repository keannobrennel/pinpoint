// components/layout/ListSkeleton.jsx
//
// Skeleton loading state for the Incidents/Reports/Community-style routes
// — rendered by app/(app)/layout.js while useAuth() is still resolving.
// Mirrors that screen's actual shape: big title + subtitle + filter
// button, filter chips ("All" / "Pre-disaster" / "Post-disaster"), and
// cards with an image thumbnail, status pill, category badge, and
// metadata lines — as opposed to HomeSkeleton, which mirrors the
// map+overlay layout that's unique to /home.
//
// rows: how many placeholder cards to render — 2 matches what's usually
// visible above the fold on these screens before scrolling.
export default function ListSkeleton({ rows = 2 }) {
  return (
    <div className="list-skeleton" role="status" aria-label="Loading">
      <div className="list-skeleton__header">
        <div className="list-skeleton__title-row">
          <div className="skeleton list-skeleton__title" />
          <div className="skeleton list-skeleton__filter-btn" />
        </div>

        <div className="list-skeleton__subtitle-lines">
          <div className="skeleton skeleton-line list-skeleton__subtitle-line--wide" />
          <div className="skeleton skeleton-line list-skeleton__subtitle-line--narrow" />
        </div>

        <div className="list-skeleton__chips">
          <div className="skeleton list-skeleton__chip" style={{ width: 50 }} />
          <div className="skeleton list-skeleton__chip" style={{ width: 112 }} />
          <div className="skeleton list-skeleton__chip" style={{ width: 122 }} />
        </div>
      </div>

      <div className="list-skeleton__body">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="list-skeleton__card" key={i}>
            <div className="skeleton list-skeleton__card-thumb" />
            <div className="list-skeleton__card-body">
              <div className="list-skeleton__card-top-row">
                <div className="skeleton list-skeleton__card-status" />
                <div className="skeleton skeleton-circle list-skeleton__card-arrow" />
              </div>
              <div className="skeleton skeleton-line list-skeleton__card-title" />
              <div className="skeleton skeleton-line list-skeleton__card-location" />
              <div className="skeleton list-skeleton__card-category" />
              <div className="skeleton skeleton-line list-skeleton__card-meta" />
              <div className="skeleton skeleton-line list-skeleton__card-meta--narrow" />
            </div>
          </div>
        ))}
      </div>

      <div className="list-skeleton__nav-wrap">
        <div className="skeleton list-skeleton__nav-bar" />
        <div className="skeleton list-skeleton__nav-fab" />
      </div>
    </div>
  );
}