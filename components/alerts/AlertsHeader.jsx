// components/alerts/AlertsHeader.jsx

const styles = {
  wrap: {
    padding: "24px 0 16px",
  },
  top: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 500,
    color: "#01277C",
    margin: "0 0 4px",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  subtext: {
    fontSize: 12,
    color: "#7a8aab",
    lineHeight: 1.4,
    margin: 0,
    maxWidth: 220,
  },
  filterBtn: {
    background: "#ffffff",
    border: "0.5px solid #d9e2f3",
    borderRadius: 10,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 500,
    color: "#01277C",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 6px rgba(26, 43, 94, 0.08)",
    cursor: "pointer",
  },
  search: {
    width: "100%",
    marginTop: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#ffffff",
    border: "0.5px solid #d9e2f3",
    borderRadius: 10,
    padding: "10px 14px",
    boxSizing: "border-box",
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: 13,
    color: "#01277C",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    width: "100%",
    background: "transparent",
  },
};

export default function AlertsHeader({ onFilterClick, search, onSearchChange }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.top}>
        <div>
          <h1 style={styles.title}>Alerts</h1>
          <p style={styles.subtext}>
            Official updates and announcements from the engineering office
          </p>
        </div>

        <button style={styles.filterBtn} onClick={onFilterClick}>
          Filter
        </button>
      </div>

      <div style={styles.search}>
        <i className="ti ti-search" style={{ fontSize: 16, color: "#7a8aab" }} />
        <input
          type="text"
          placeholder="Search for location, severity, date..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={styles.searchInput}
        />
      </div>
    </div>
  );
}