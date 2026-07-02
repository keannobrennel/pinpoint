import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";

// Text is identical for every role — public, responder, engineer, admin
// all see the same "Help keep your community safe" message.
export default function Greeting({ userName }) {
  const cameraInputRef = useRef(null);
  const handleCameraCapture = async (e) => {
    const file = e.target.files[0];
    // Reset so selecting the same file again later still fires onChange.
    e.target.value = "";
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });
      const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
      sessionStorage.setItem(
        PENDING_PHOTO_KEY,
        JSON.stringify({ dataUrl, mimeType: compressed.type }),
      );
    } catch (err) {
      console.error("Failed to process captured photo", err);
      // Fall through and still navigate — ReportUpload will just show
      // its empty upload state if nothing made it into sessionStorage.
    }

    router.push("/report");
  };
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

      <div href="/report" className="report-hazard-link">
        <button className="report-hazard-btn" onClick={() => cameraInputRef.current?.click()}>
          <i className="fa-solid fa-camera fa-lg"></i>
          Report Hazard
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraCapture}
        />
      </div>
    </div>
  );
}