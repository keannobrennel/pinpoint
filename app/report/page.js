// app/(app)/report/page.js
// Report submission screen. Moved here from
// components/report/ReportSubmission.js — this route only ever rendered
// that one component, so it lives directly in the route file now.
"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import { useState, useRef, useEffect, useCallback } from "react";
import { getNcrCities, getBarangaysForCity } from "@/lib/psgc";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import imageCompression from "browser-image-compression";
import "@/styles/report/report.css";
import "@/styles/detail.css";
import ScreenHeader from "@/components/layout/ScreenHeader";

const PENDING_PHOTO_KEY = "pendingReportPhoto";

const METRO_MANILA_CENTER = { lat: 14.5995, lng: 120.9842 };

const PLACARD_STYLES = {
  inspected: "verified",
  restricted_use: "restricted_use",
  unsafe: "unsafe",
};

const FINDING_STYLES = {
  no_further_action: "no_further_action",
  monitor_or_rescreen: "monitor_or_rescreen",
  refer_to_obo: "refer_to_obo",
};

const FINDING_LABELS = {
  no_further_action: "Looks Okay",
  monitor_or_rescreen: "Keep an Eye On It",
  refer_to_obo: "Needs Official Inspection",
};

const FINDING_DESCRIPTIONS = {
  no_further_action:
    "No visible signs of structural concern. No action needed for now.",
  monitor_or_rescreen:
    "Minor issue spotted. Not urgent, but worth checking again later.",
  refer_to_obo:
    "This has been flagged for your city's Office of the Building Official to send an inspector for a closer look.",
};

function dataUrlToFile(dataUrl, mimeType, filename = "hazard-photo.jpg") {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType });
}

function formatLabel(value) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Normalizes city names for matching between Google's reverse geocoder
// ("Makati City") and PSGC's naming conventions ("City of Makati", etc).
function normalizeCityName(name) {
  return name
    .toLowerCase()
    .replace(/^city of\s+/, "")
    .replace(/\s+city$/, "")
    .trim();
}

async function reverseGeocode(lat, lng) {
  const geocoder = new window.google.maps.Geocoder();
  const result = await geocoder.geocode({ location: { lat, lng } });
  const components = result.results[0]?.address_components ?? [];

  let city = null;

  for (const c of components) {
    if (
      c.types.includes("locality") ||
      c.types.includes("administrative_area_level_2")
    ) {
      city = city ?? c.long_name;
    }
  }

  return { city };
}

export default function ReportPage() {
  const { status } = useAuthGuard(["public", "engineer", "admin", "responder"]);
  const router = useRouter();

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState(null);
  const [barangay, setBarangay] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("pre_disaster");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const fileInputRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [ncrCities, setNcrCities] = useState([]);
  const [barangayOptions, setBarangayOptions] = useState([]);
  const [selectedCityCode, setSelectedCityCode] = useState(null);
  const [barangayLoading, setBarangayLoading] = useState(false);

  // load NCR cities once on mount
  useEffect(() => {
    getNcrCities().then(setNcrCities).catch(console.error);
  }, []);

  // when reverse-geocoded city changes, try to auto-match a PSGC city
  useEffect(() => {
    if (!city || ncrCities.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedCityCode(null);
      setBarangayOptions([]);
      return;
    }

    const target = normalizeCityName(city);
    const match = ncrCities.find((c) => normalizeCityName(c.name) === target);

    if (match) {
      setSelectedCityCode(match.code);
    } else {
      setSelectedCityCode(null);
      setBarangayOptions([]);
    }
  }, [city, ncrCities]);

  // when selectedCityCode changes, fetch barangays for it
  useEffect(() => {
    if (!selectedCityCode) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBarangayLoading(true);
    getBarangaysForCity(selectedCityCode)
      .then(setBarangayOptions)
      .catch(console.error)
      .finally(() => setBarangayLoading(false));
  }, [selectedCityCode]);

  // Load Google Maps
  useEffect(() => {
    if (window.google?.maps) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMapReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapReady(true);
    script.onerror = () => console.error("Failed to load Google Maps");
    document.head.appendChild(script);
  }, []);

  const updatePinLocation = useCallback(async (lat, lng) => {
    setGeocoding(true);
    setLocation({ lat, lng });
    setBarangay(null); // reset — user must reselect for new pin

    try {
      const { city: c } = await reverseGeocode(lat, lng);
      setCity(c);
      setLocationLabel(c ?? "");
    } catch {
      setCity(null);
      setLocationLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  }, []);

  // Init map once Maps is loaded, the div is mounted, and auth is ready
  useEffect(() => {
    if (status !== "ready" || !mapReady || !mapRef.current) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: METRO_MANILA_CENTER,
      zoom: 12,
      disableDefaultUI: true,
      zoomControl: true,
      restriction: {
        latLngBounds: {
          north: 14.8,
          south: 14.3,
          east: 121.2,
          west: 120.7,
        },
        strictBounds: false,
      },
    });

    const marker = new window.google.maps.Marker({
      map,
      draggable: true,
      visible: false,
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      updatePinLocation(pos.lat(), pos.lng());
    });

    map.addListener("click", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      marker.setVisible(true);
      updatePinLocation(lat, lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Autocomplete restricted to Metro Manila
    if (searchInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: "ph" },
          bounds: new window.google.maps.LatLngBounds(
            { lat: 14.3, lng: 120.7 },
            { lat: 14.8, lng: 121.2 },
          ),
          strictBounds: true,
          fields: ["geometry", "name", "formatted_address"],
        },
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        map.panTo({ lat, lng });
        map.setZoom(16);
        marker.setPosition({ lat, lng });
        marker.setVisible(true);
        updatePinLocation(lat, lng);
      });

      autocompleteRef.current = autocomplete;
    }
  }, [status, mapReady, updatePinLocation]);

  // Pick up photo handed off by BottomNav camera FAB
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_PHOTO_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_PHOTO_KEY);
      const { dataUrl, mimeType } = JSON.parse(raw);
      const file = dataUrlToFile(dataUrl, mimeType);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImage(file);
      setPreview(dataUrl);
    } catch (err) {
      console.error("Failed to load captured photo", err);
    }
  }, []);

  if (status !== "ready") {
    return (
      <div className="report-loading-screen">
        <p className="report-loading-screen__text">Loading...</p>
      </div>
    );
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setError("Image must be under 20MB.");
      return;
    }
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    });
    setImage(compressed);
    setPreview(URL.createObjectURL(compressed));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      mapInstanceRef.current?.panTo({ lat, lng });
      mapInstanceRef.current?.setZoom(17);
      markerRef.current?.setPosition({ lat, lng });
      markerRef.current?.setVisible(true);
      updatePinLocation(lat, lng);
    });
  };

  const handleSubmit = async () => {
    if (!image) return setError("Please select a photo.");
    if (!location) return setError("Please pin your location on the map.");
    if (!barangay) return setError("Please select your barangay.");
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await imageCompression.getDataUrlFromFile(image);
      const base64Data = base64.split(",")[1];
      const mimeType = image.type;
      const token = await auth.currentUser.getIdToken();

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          base64Image: base64Data,
          mimeType,
          location,
          city,
          barangay,
          description,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed.");
      } else {
        setResult(data);
      }
    } catch (err) {
      console.error("[handleSubmit] error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setImage(null);
    setPreview(null);
    setLocation(null);
    setCity(null);
    setBarangay(null);
    setLocationLabel("");
    setDescription("");
    setMode("pre_disaster");
    setSelectedCityCode(null);
    setBarangayOptions([]);
    if (markerRef.current) markerRef.current.setVisible(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(METRO_MANILA_CENTER);
      mapInstanceRef.current.setZoom(12);
    }
  };

  if (loading) {
    return (
      <div className="report-analyzing-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/chick4.png"
          alt=""
          aria-hidden="true"
          className="report-analyzing-screen__img"
        />
        <h1 className="report-analyzing-screen__title">Analyzing photo</h1>
      </div>
    );
  }

  if (result) {
    const { aiAssessment } = result;
    const isPre = aiAssessment.mode === "pre_disaster";

    const verdictKey = isPre
      ? aiAssessment.suggestedFinding
      : aiAssessment.suggestedPlacard;
    const verdictLabel = isPre
      ? (FINDING_LABELS[verdictKey] ?? formatLabel(verdictKey))
      : formatLabel(verdictKey);
    const verdictColor = isPre
      ? (FINDING_STYLES[verdictKey] ?? "default")
      : (PLACARD_STYLES[verdictKey] ?? "default");

    return (
      <div className="report-shell">
        <div className="report-content">
          <div className="report-result-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/chick3.png"
              alt=""
              aria-hidden="true"
              className="report-result-header__img"
            />
            <h2 className="report-result-header__title">
              Report Submitted🎉
            </h2>
          </div>

          <p className="report-result-intro">
            {isPre
              ? "Here's the AI screening result for your photo:"
              : "Here's the AI pre-assessment of your photo:"}
          </p>

          <span className="report-result-label">
            {isPre ? "Screening Finding: " : "Suggested Placard: "}
          </span>
          <div className={`report-result-verdict report-result-verdict--${verdictColor}`}>
            {verdictLabel}
          </div>

          {isPre && (
            <p className="report-result-finding-desc">
              {FINDING_DESCRIPTIONS[verdictKey]}
            </p>
          )}

          <div className="report-result-details">
            <div>
              <span className="report-result-details__label">Damage: </span>
              {formatLabel(aiAssessment.damageClassification)}
            </div>
            <div>
              <span className="report-result-details__label">
                {isPre ? "Screening Priority: " : "Severity: "}
              </span>
              {aiAssessment.severityScore} / 100
            </div>
            <div>
              <span className="report-result-details__label">Structure: </span>
              {aiAssessment.affectedStructureType}
            </div>
            {isPre && aiAssessment.visibleIrregularities?.length > 0 && (
              <div>
                <span className="report-result-details__label">Irregularities: </span>
                {aiAssessment.visibleIrregularities.map(formatLabel).join(", ")}
              </div>
            )}
            <div>
              <span className="report-result-details__label">Summary: </span>
              {aiAssessment.reasoning ?? aiAssessment.placardReasoning}
            </div>
            <div>
              <span className="report-result-details__label">Recommended Action: </span>
              {formatLabel(aiAssessment.recommendedAction)}
            </div>
          </div>

          <p className="report-result-disclaimer">
            {isPre
              ? "This is an AI pre-disaster screening only. It is not a placard or occupancy determination. An engineer or your LGU OBO may refer this for detailed evaluation."
              : "This is an AI pre-assessment only. An engineer will review and post an official verdict for your zone."}
          </p>
        </div>

        <div className="submit-button">
          <button
            onClick={() => router.push("/home")}
            className="report-result-btn"
          >
            Back to Home
          </button>
          <button
            onClick={resetForm}
            className="report-result-btn report-result-btn--outline"
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-shell">
      <div className="report-content">
        {/* Header */}
        <ScreenHeader title="Submit a report" />

        {/* Report Type toggle */}
        <div className="report-section">
          <h3 className="report-section__heading">Report Type</h3>
          <div className="report-type-toggle">
            <button
              type="button"
              onClick={() => setMode("pre_disaster")}
              className={`report-type-toggle__btn${
                mode === "pre_disaster" ? " report-type-toggle__btn--active" : ""
              }`}
            >
              Pre-Disaster Screening
            </button>
            <button
              type="button"
              onClick={() => setMode("post_disaster")}
              className={`report-type-toggle__btn${
                mode === "post_disaster" ? " report-type-toggle__btn--active" : ""
              }`}
            >
              Post-Disaster Damage
            </button>
          </div>
          <p className="report-section__hint">
            {mode === "pre_disaster"
              ? "For everyday hazards you notice — cracks, leaning walls, loose parts. No active disaster."
              : "For damage observed after an earthquake, typhoon, or other disaster event."}
          </p>
        </div>

        {/* Photo */}
        <div className="report-section">
          <h3 className="report-section__heading">Captured Photo</h3>
          {preview ? (
            <div className="report-photo-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Captured hazard"
                className="report-photo-preview"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="report-photo-retake"
              >
                <i className="fa-solid fa-camera" aria-hidden="true" />
                <span>Retake</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="report-photo-placeholder"
            >
              <span>Tap to select or take a photo</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="report-photo-input"
            onChange={handleImageChange}
          />
        </div>

        {/* Map + Location */}
        <div className="report-section">
          <h3 className="report-section__heading">Pin a Location</h3>

          {/* Search input */}
          <div className="report-search-wrap">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search a place in Metro Manila..."
              className="report-search-input"
            />
          </div>

          {/* Map */}
          <div ref={mapRef} className="report-map" />

          {/* Use my location button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="report-locate-btn"
          >
            <i className="fa-solid fa-location-crosshairs" aria-hidden="true" />
            Use my current location
          </button>

          {/* Location label */}
          {geocoding && (
            <p className="report-location-status">Getting location details...</p>
          )}
          {locationLabel && !geocoding && (
            <p className="report-location-label">📍 {locationLabel}</p>
          )}

          {/* Barangay select — only shown once we have a pinned location */}
          {location && !geocoding && (
            <div className="report-barangay-wrap">
              {barangayLoading ? (
                <p className="report-location-status">Loading barangays...</p>
              ) : barangayOptions.length > 0 ? (
                <select
                  value={barangay ?? ""}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="report-barangay-select"
                >
                  <option value="" disabled>
                    Select barangay
                  </option>
                  {barangayOptions.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="report-barangay-warning">
                  Couldn&apos;t auto-match barangay list for this city. Please
                  pin a location within a recognized NCR city.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="report-section">
          <h3 className="report-section__heading--sm">Description (Optional)</h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional: describe what you see"
            className="report-textarea"
          />
        </div>

        {error && <p className="report-error">{error}</p>}
      </div>

      <div className="submit-button">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="report-submit-btn"
        >
          {loading ? "Analyzing photo..." : "Submit report"}
        </button>
      </div>
    </div>
  );
}