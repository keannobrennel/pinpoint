// components/home/Greeting.jsx
import Link from "next/link";

export default function Greeting({ isEngineer, userName }) {
  return (
    <div className="greeting-card">
      <p className="greeting-text">
        {isEngineer
          ? "Good morning, Engineer!"
          : `Good morning, ${userName}!`}
      </p>
      <p className="greeting-subtext">Help keep your community safe</p>

      <Link href="/report/new">
        <button className="report-hazard-btn">📷 Report Hazard</button>
      </Link>
    </div>
  );
}