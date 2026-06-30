// components/report-list/ReportsHeader.jsx

const styles = {
  wrap: {
    padding: "24px 0 16px",
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
  },
};

export default function ReportsHeader({ isEngineer }) {
  return (
    <div style={styles.wrap}>
      <h1 style={styles.title}>Reports</h1>
      <p style={styles.subtext}>
        {isEngineer
          ? "Review reports submitted by the residents."
          : "Track the status of reports you submitted. See stats of reports in your community."}
      </p>
    </div>
  );
}