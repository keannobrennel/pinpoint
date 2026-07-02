// components/layout/HomeSkeleton.jsx
//
// Skeleton loading state shown by app/(app)/layout.js while useAuth() is
// still resolving (replaces the old plain "Loading..." text). Mirrors the
// shape of the home page — header, greeting card, map, nearby alerts card,
// bottom nav — so there's no pop/jump once real content swaps in.
//
// Building blocks (.skeleton, .skeleton-circle, .skeleton-line) and the
// .home-skeleton__* layout classes live in styles/skeleton.css.
export default function HomeSkeleton() {
  return (
    <div className="home-skeleton" role="status" aria-label="Loading">
      <div className="home-skeleton__header">
        <div className="home-skeleton__logo-group">
          <div className="skeleton home-skeleton__logo-pin" />
          <div className="home-skeleton__logo-text">
            <div className="skeleton skeleton-line" style={{ width: 100 }} />
            <div className="skeleton skeleton-line" style={{ width: 70, height: 8 }} />
          </div>
        </div>
        <div className="home-skeleton__icons">
          <div className="skeleton skeleton-circle home-skeleton__icon" />
          <div className="skeleton skeleton-circle home-skeleton__avatar" />
        </div>
      </div>

      <div className="home-skeleton__body">
        <div className="home-skeleton__greeting">
          <div className="skeleton skeleton-line home-skeleton__greeting-line--narrow" />
          <div className="skeleton skeleton-line home-skeleton__greeting-line--wide" />
          <div className="skeleton home-skeleton__greeting-btn" />
        </div>

        <div className="skeleton home-skeleton__map" />

        <div className="home-skeleton__alerts">
          <div className="home-skeleton__alerts-header">
            <div className="home-skeleton__alerts-title">
              <div className="skeleton skeleton-circle home-skeleton__alerts-icon" />
              <div className="skeleton skeleton-line home-skeleton__alerts-title-line" />
            </div>
            <div className="skeleton skeleton-line home-skeleton__alerts-see-all" />
          </div>

          <div className="skeleton home-skeleton__alerts-pill" />
          <div className="skeleton skeleton-line home-skeleton__alerts-place" />
          <div className="skeleton skeleton-line home-skeleton__alerts-meta" />
          <div className="home-skeleton__alerts-actions">
            <div className="skeleton home-skeleton__alerts-btn" />
            <div className="skeleton home-skeleton__alerts-btn" />
          </div>
        </div>
      </div>

      <div className="skeleton home-skeleton__bottom-nav" />
    </div>
  );
}