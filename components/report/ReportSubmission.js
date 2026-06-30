"use client";

import { useAuthGuard } from "@/lib/use-auth-guard";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import imageCompression from "browser-image-compression";
import "@/styles/report/report.css";
import { getNcrCities, getBarangaysForCity } from "@/lib/psgc";

// Same key BottomNav writes to before navigating here.
const PENDING_PHOTO_KEY = "pendingReportPhoto";

// Turns the base64 dataUrl handed off via sessionStorage back into a real
// File object, so the rest of this component (which expects a File/Blob)
// doesn't need to know the photo came from the nav bar's camera capture.
function dataUrlToFile(dataUrl, mimeType, filename = "hazard-photo.jpg") {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType });
}

// Placard styling — background/text colors for the pill, matching the
// "RESTRICTED USE" orange treatment in the mockup.
const PLACARD_STYLES = {
  inspected: "bg-green-50 text-green-700",
  restricted_use: "bg-orange-50 text-orange-600",
  unsafe: "bg-red-50 text-red-700",
};

export default function ReportSubmission() {
  const { status } = useAuthGuard(["public", "engineer", "admin", "responder"]);
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [description, setDescription] = useState("");
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [barangays, setBarangays] = useState([]);
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [locationDataLoading, setLocationDataLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  function formatLabel(value) {
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  useEffect(() => {
    getNcrCities()
      .then(setCities)
      .catch((err) => console.error("Failed to load cities", err))
      .finally(() => setLocationDataLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCity) {
      setBarangays([]);
      setSelectedBarangay("");
      return;
    }
    getBarangaysForCity(selectedCity)
      .then(setBarangays)
      .catch((err) => console.error("Failed to load barangays", err));
    setSelectedBarangay("");
  }, [selectedCity]);

  // Pick up a photo handed off by the BottomNav camera FAB, if there is one.
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

  if (status !== "ready") return null;

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

  const getLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocationError(
          "Unable to retrieve your location. Please allow location access.",
        );
      },
    );
  };

  const handleSubmit = async () => {
    if (!image) return setError("Please select a photo.");
    if (!location) return setError("Please get your location first.");
    if (!selectedCity) return setError("Please select your city.");
    if (!selectedBarangay) return setError("Please select your barangay.");
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
          city: cities.find((c) => c.code === selectedCity)?.name ?? null,
          barangay:
            barangays.find((b) => b.code === selectedBarangay)?.name ?? null,
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
          {/* Mascot */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex flex-col items-center gap-1 text-center mb-5 mt-10">
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
            onClick={() => {
              setResult(null);
              setImage(null);
              setPreview(null);
              setLocation(null);
              setDescription("");
            }}
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
      <div className="report-content">
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
              className="border-2 border-dashed rounded-xl h-48 flex items-center justify-center cursor-pointer overflow-hidden"
            >
              <span className="text-sm text-gray-400">
                Tap to select or take a photo
              </span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleImageChange}
        />

        {/* Location */}
        <div className="flex flex-col gap-2 mb-5">
          <h3 className="text-xl font-bold text-[#01277C]">Pin a location</h3>
          <div className="space-y-1">
            <button
              onClick={getLocation}
              className="w-full py-2 rounded-lg bg-gray-100 text-sm font-medium"
            >
              {location
                ? `Location captured (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
                : "Get My Location"}
            </button>
            {locationError && (
              <p className="text-xs text-red-500">{locationError}</p>
            )}
          </div>
        </div>

        {/* City & Barangay */}
        <div className="flex flex-col gap-2 mb-5">
          <h3 className="text-xl font-bold text-[#01277C]">Location Area</h3>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={locationDataLoading}
            className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">
              {locationDataLoading ? "Loading cities..." : "Select city"}
            </option>
            {cities.map((city) => (
              <option key={city.code} value={city.code}>
                {city.name}
              </option>
            ))}
          </select>

          <select
            value={selectedBarangay}
            onChange={(e) => setSelectedBarangay(e.target.value)}
            disabled={!selectedCity || barangays.length === 0}
            className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">
              {selectedCity ? "Select barangay" : "Select a city first"}
            </option>
            {barangays.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
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
            className="
              w-full
              box-border
              rounded-xl
              border border-gray-200
              bg-gray-50
              px-4 py-3
              text-sm
              focus:border-blue-500
              focus:outline-none
              focus:ring-inset
              focus:ring-1
              focus:ring-blue-500
            "
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
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
