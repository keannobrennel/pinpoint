"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import { useState, useRef, useEffect, useCallback } from "react";
import { getNcrCities, getBarangaysForCity } from "@/lib/psgc";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import imageCompression from "browser-image-compression";
import "@/styles/report/report.css";

const PENDING_PHOTO_KEY = "pendingReportPhoto";

const METRO_MANILA_CENTER = { lat: 14.5995, lng: 120.9842 };

const PLACARD_STYLES = {
  inspected: "bg-green-50 text-green-700",
  restricted_use: "bg-orange-50 text-orange-600",
  unsafe: "bg-red-50 text-red-700",
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

export default function ReportSubmission() {
  const { status } = useAuthGuard(["public", "engineer", "admin", "responder"]);
  const router = useRouter();

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState(null);
  const [barangay, setBarangay] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [description, setDescription] = useState("");
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
    setBarangayLoading(true);
    getBarangaysForCity(selectedCityCode)
      .then(setBarangayOptions)
      .catch(console.error)
      .finally(() => setBarangayLoading(false));
  }, [selectedCityCode]);

  // Load Google Maps
  useEffect(() => {
    if (window.google?.maps) {
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
      setImage(file);
      setPreview(dataUrl);
    } catch (err) {
      console.error("Failed to load captured photo", err);
    }
  }, []);

  if (status !== "ready") {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
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
      <div className="fixed inset-0 z-50 bg-[#EEF2F9] flex flex-col items-center justify-center gap-4 px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/chick4.png"
          alt=""
          aria-hidden="true"
          className="w-70 object-contain"
        />
        <h1 className="text-[#01277C] text-2xl font-bold">Analyzing photo</h1>
      </div>
    );
  }

  if (result) {
    const { aiAssessment } = result;
    const placardColor =
      PLACARD_STYLES[aiAssessment.suggestedPlacard] ??
      "bg-gray-100 text-gray-700";

    return (
      <div className="report-shell">
        <div className="report-content">
          <div className="flex flex-col items-center gap-1 text-center mb-5 mt-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/chick3.png"
              alt=""
              aria-hidden="true"
              className="h-40 object-contain"
            />
            <h2 className="text-2xl font-extrabold text-[#01277C]">
              Report Submitted🎉
            </h2>
          </div>

          <p className="text-sm text-gray-500 mb-3 text-start">
            {"Here's the AI pre-assessment of your photo:"}
          </p>

          <span className="text-[#01277C] text-sm font-semibold mb-1">
            Suggested Placard:{" "}
          </span>
          <div
            className={`w-full rounded-full py-2 font-bold text-md ${placardColor} text-center`}
          >
            {formatLabel(aiAssessment.suggestedPlacard)}
          </div>

          <div className="w-full text-left rounded-2xl border border-[#D4E1EE] p-4 flex flex-col gap-2 text-sm my-3">
            <div>
              <span className="font-semibold">Damage: </span>
              {formatLabel(aiAssessment.damageClassification)}
            </div>
            <div>
              <span className="font-semibold">Severity: </span>
              {aiAssessment.severityScore} / 100
            </div>
            <div>
              <span className="font-semibold">Structure: </span>
              {aiAssessment.affectedStructureType}
            </div>
            <div>
              <span className="font-semibold">Summary: </span>
              {aiAssessment.placardReasoning}
            </div>
            <div>
              <span className="font-semibold">Recommended Action: </span>
              {formatLabel(aiAssessment.recommendedAction)}
            </div>
          </div>

          <p className="text-xs text-gray-400 italic">
            This is an AI pre-assessment only. An engineer will review and post
            an official verdict for your zone.
          </p>
        </div>

        <div className="submit-button">
          <button
            onClick={() => router.back()}
            className="w-full py-4 mt-3 rounded-xl bg-[#3474FD] text-white text-md font-medium"
          >
            Back to Home
          </button>
          <button
            onClick={resetForm}
            className="w-full py-4 mt-3 rounded-xl border border-[#3474FD] text-[#3474FD] text-md font-medium"
          >
            Submit another report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="report-shell">
      <div className="report-content pb-28">
        {/* Header */}
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 mb-4"
        >
          <i
            className="fa-solid fa-arrow-left text-[#2563EB]"
            aria-hidden="true"
          />
          <h2 className="text-[#01277C] font-semibold">Submit a Report</h2>
        </button>

        {/* Photo */}
        <div className="flex flex-col gap-2 mb-5">
          <h3 className="text-xl font-bold text-[#01277C]">Captured Photo</h3>
          {preview ? (
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Captured hazard"
                className="flex-1 h-48 rounded-xl object-cover border-2 border-[#D4E1EE]"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 rounded-xl border-2 border-blue-500 flex flex-col items-center justify-center gap-2 text-blue-600"
              >
                <i className="fa-solid fa-camera text-xl" aria-hidden="true" />
                <span className="text-xs font-medium">Retake</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl h-48 flex items-center justify-center cursor-pointer"
            >
              <span className="text-sm text-gray-400">
                Tap to select or take a photo
              </span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Map + Location */}
        <div className="flex flex-col gap-2 mb-5">
          <h3 className="text-xl font-bold text-[#01277C]">Pin a Location</h3>

          {/* Search input */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search a place in Metro Manila..."
              className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Map */}
          <div
            ref={mapRef}
            className="w-full rounded-xl overflow-hidden border border-gray-200"
            style={{ height: "240px" }}
          />

          {/* Use my location button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700"
          >
            <i
              className="fa-solid fa-location-crosshairs text-blue-500"
              aria-hidden="true"
            />
            Use my current location
          </button>

          {/* Location label */}
          {geocoding && (
            <p className="text-xs text-gray-400">Getting location details...</p>
          )}
          {locationLabel && !geocoding && (
            <p className="text-xs text-gray-600 font-medium">
              📍 {locationLabel}
            </p>
          )}

          {/* Barangay select — only shown once we have a pinned location */}
          {location && !geocoding && (
            <div className="flex flex-col gap-1">
              {barangayLoading ? (
                <p className="text-xs text-gray-400">Loading barangays...</p>
              ) : barangayOptions.length > 0 ? (
                <select
                  value={barangay ?? ""}
                  onChange={(e) => setBarangay(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 text-sm bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <p className="text-xs text-orange-500">
                  Couldn&apos;t auto-match barangay list for this city. Please
                  pin a location within a recognized NCR city.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-[#01277C]">
            Description (Optional)
          </h3>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional: describe what you see"
            className="w-full box-border rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-inset focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="submit-button w-full py-4 rounded-xl bg-[#3474FD] text-white text-lg font-medium shadow-lg shadow-[#3474FD]/30 disabled:opacity-50"
      >
        {loading ? "Analyzing photo..." : "Submit report"}
      </button>
    </div>
  );
}
