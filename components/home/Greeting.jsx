import Link from "next/link";
import Image from "next/image";

export default function Greeting({ isEngineer, userName }) {
  return (
    <div className="greeting-card">
      <div className="greeting-content">
        <p className="greeting-text">Good morning,</p>
        <p className="greeting-subtext">
          {isEngineer
            ? "Oversee your community's safety"
            : <>Help keep your<br />community <span className="greeting-highlight">safe</span></>}
        </p>
      </div>

      <div className="greeting-mascot">
        <Image src="/images/chick1.png" alt="" width={220} height={220} priority />
      </div>

      <Link href="/report/new" className="report-hazard-link">
        <button className="report-hazard-btn">
          <i className="fa-regular fa-camera fa-xl"></i>
          Report Hazard
        </button>
      </Link>
    </div>
  );
}