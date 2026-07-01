import Link from "next/link";
import Image from "next/image";

// Text is identical for every role — public, responder, engineer, admin
// all see the same "Help keep your community safe" message.
export default function Greeting({ userName }) {
  return (
    <div className="greeting-card">
      <div className="greeting-content">
        <p className="greeting-text">Good morning,</p>
        <p className="greeting-subtext">
          Help keep your<br />community <span className="greeting-highlight">safe</span>
        </p>
      </div>

      {/*
        Mascot now scales with the card instead of rendering at a fixed
        220x220px regardless of viewport width. .greeting-mascot (in
        home.css) sizes this wrapper as a percentage of the card, clamped
        between a floor and ceiling — the wrapper IS the box the image
        fills, via Next's `fill` prop + object-fit: contain, so the artwork
        stays proportional (no stretching, no cropping) at any card size.
      */}
      <div className="greeting-mascot">
        <Image
          src="/images/chick1.png"
          alt=""
          fill
          sizes="(max-width: 480px) 110px, 170px"
          style={{ objectFit: "contain" }}
          priority
        />
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