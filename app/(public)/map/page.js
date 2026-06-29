"use client";

import { useEffect, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  HeatmapLayer,
  Polygon,
} from "@react-google-maps/api";
import { getZoneCentroid } from "@/lib/triage";

const libraries = ["visualization"];

const containerStyle = { width: "100%", height: "100vh" };

const defaultCenter = { lat: 14.5995, lng: 120.9842 }; // Manila fallback

export default function MapPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    async function fetchZones() {
      try {
        const res = await fetch("/api/zones");
        const data = await res.json();
        setZones(data);
      } finally {
        setLoading(false);
      }
    }
    fetchZones();
  }, []);

  if (!isLoaded || loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        Loading map...
      </div>
    );
  }

  const heatmapPoints = zones
    .map((zone) => {
      const centroid = getZoneCentroid(zone.boundaries);
      if (!centroid) return null;
      return {
        location: new google.maps.LatLng(centroid.lat, centroid.lng),
        weight: zone.reportCount ?? 1,
      };
    })
    .filter(Boolean);

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10 rounded-md bg-white px-4 py-2 shadow-sm">
        <h1 className="text-sm font-semibold text-gray-900">
          PinPoint Hazard Map
        </h1>
        <p className="text-xs text-gray-500">{zones.length} zones reporting</p>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={12}
      >
        {heatmapPoints.length > 0 && (
          <HeatmapLayer data={heatmapPoints} options={{ radius: 40 }} />
        )}

        {zones.map((zone) => {
          if (!zone.boundaries) return null;
          const isUnsafe = zone.officialVerdict === "unsafe";
          const isRestricted = zone.officialVerdict === "restricted_use";
          return (
            <Polygon
              key={zone.id}
              paths={zone.boundaries}
              options={{
                fillColor: isUnsafe
                  ? "#dc2626"
                  : isRestricted
                    ? "#f59e0b"
                    : "#3b82f6",
                fillOpacity: 0.15,
                strokeColor: isUnsafe
                  ? "#dc2626"
                  : isRestricted
                    ? "#f59e0b"
                    : "#3b82f6",
                strokeWeight: 1.5,
              }}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
}
