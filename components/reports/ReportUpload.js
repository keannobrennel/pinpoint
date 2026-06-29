"use client";

import { useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import imageCompression from "browser-image-compression";

export default function ReportUpload() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const { aiAssessment } = result;
    const placardColor =
      {
        inspected: "bg-green-100 text-green-800",
        restricted_use: "bg-yellow-100 text-yellow-800",
        unsafe: "bg-red-100 text-red-800",
      }[aiAssessment.suggestedPlacard] ?? "bg-gray-100 text-gray-800";

    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <h2 className="text-xl font-semibold">Report Submitted</h2>
        <p className="text-sm text-gray-500">
          {"Here's the AI pre-assessment of your photo:"}
        </p>

        <div className={`rounded-lg p-4 font-medium text-sm ${placardColor}`}>
          Suggested Placard:{" "}
          {aiAssessment.suggestedPlacard.replace("_", " ").toUpperCase()}
        </div>

        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div>
            <span className="font-medium">Damage: </span>
            {aiAssessment.damageClassification}
          </div>
          <div>
            <span className="font-medium">Severity: </span>
            {aiAssessment.severityScore} / 100
          </div>
          <div>
            <span className="font-medium">Structure: </span>
            {aiAssessment.affectedStructureType}
          </div>
          <div>
            <span className="font-medium">Summary: </span>
            {aiAssessment.placardReasoning}
          </div>
          <div>
            <span className="font-medium">Recommended Action: </span>
            {aiAssessment.recommendedAction}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          This is an AI pre-assessment only. An engineer will review and post an
          official verdict for your zone.
        </p>

        <button
          onClick={() => {
            setResult(null);
            setImage(null);
            setPreview(null);
            setLocation(null);
            setDescription("");
          }}
          className="w-full py-2 rounded-lg border text-sm"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Report a Hazard</h2>

      {/* Photo Upload */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-lg h-48 flex items-center justify-center cursor-pointer overflow-hidden"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Preview"
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-sm text-gray-400">
            Tap to select or take a photo
          </span>
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

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional: describe what you see"
        className="w-full border rounded-lg p-3 text-sm resize-none h-24"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-lg bg-black text-white text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Analyzing photo..." : "Submit Report"}
      </button>
    </div>
  );
}
