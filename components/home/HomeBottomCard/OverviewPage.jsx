// components/home/HomeBottomCard/OverviewPage.jsx
export default function OverviewPage({ stats, isEngineer }) {
  return (
    <div className="overview-grid">
      {/* same branching pattern as Community tab — different stats per role */}
      {isEngineer ? (
        <>...engineer stats...</>
      ) : (
        <>...resident stats...</>
      )}
    </div>
  );
}