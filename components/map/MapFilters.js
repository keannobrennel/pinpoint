'use client';

/**
 * MapFilters.js
 *
 * Plain UI overlay (NOT a child of <Map> — no Google Maps dependency) with
 * two cascading selects: City, then Barangay within it, plus a toggle to
 * show/hide the boundary polygon overlay entirely (useful once a city is
 * selected but the person wants an unobstructed view of the heatmap/pins
 * underneath). Scoped to NCR, matching lib/psgc.js's current coverage
 * (getNcrCities/getBarangaysForCity).
 *
 * State is lifted: the parent (app/(public)/map/page.js) owns
 * selectedCity/selectedBarangay/boundariesEnabled and feeds them into
 * <MapView>, which mounts <BoundaryOverlay> to actually draw + highlight
 * the polygons and fly the camera there. This component's only job is
 * turning user input into { code, name } objects and a boolean.
 *
 * lib/psgc.js already caches both the city list and each city's barangay
 * list in module scope, so switching back to a previously-viewed city is
 * instant and makes no network call.
 */

import { useEffect, useState, useCallback } from 'react';
import { getNcrCities, getBarangaysForCity } from '@/lib/psgc';

/**
 * MapFilters
 *
 * @param {{
 *   selectedCity: { code: string, name: string } | null,
 *   selectedBarangay: { code: string, name: string } | null,
 *   onCityChange: (city: Object | null) => void,
 *   onBarangayChange: (barangay: Object | null) => void,
 *   boundariesEnabled: boolean,
 *   onToggleBoundaries: (enabled: boolean) => void,
 * }} props
 */
export default function MapFilters({
  selectedCity,
  selectedBarangay,
  onCityChange,
  onBarangayChange,
  boundariesEnabled = true,
  onToggleBoundaries,
}) {
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

  // Load the NCR city list once on mount.
  useEffect(() => {
    let cancelled = false;
    setLoadingCities(true);
    getNcrCities()
      .then((data) => {
        if (!cancelled) setCities(data);
      })
      .catch((err) => console.error('[MapFilters] Failed to load cities:', err))
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load barangays whenever the selected city changes.
  useEffect(() => {
    if (!selectedCity) {
      setBarangays([]);
      return;
    }
    let cancelled = false;
    setLoadingBarangays(true);
    getBarangaysForCity(selectedCity.code)
      .then((data) => {
        if (!cancelled) setBarangays(data);
      })
      .catch((err) => console.error('[MapFilters] Failed to load barangays:', err))
      .finally(() => {
        if (!cancelled) setLoadingBarangays(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCity]);

  const handleCitySelect = useCallback(
    (e) => {
      const code = e.target.value;
      if (!code) {
        onCityChange(null);
        onBarangayChange(null);
        return;
      }
      const city = cities.find((c) => String(c.code) === code) ?? null;
      onCityChange(city);
      onBarangayChange(null); // reset barangay every time the city changes
    },
    [cities, onCityChange, onBarangayChange]
  );

  const handleBarangaySelect = useCallback(
    (e) => {
      const code = e.target.value;
      if (!code) {
        onBarangayChange(null);
        return;
      }
      const barangay = barangays.find((b) => String(b.code) === code) ?? null;
      onBarangayChange(barangay);
    },
    [barangays, onBarangayChange]
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 200,
      }}
    >
      <select
        value={selectedCity?.code ?? ''}
        onChange={handleCitySelect}
        disabled={loadingCities}
        aria-label="Filter by city"
        style={selectStyle}
      >
        <option value="">{loadingCities ? 'Loading cities…' : 'All Cities (NCR)'}</option>
        {cities.map((city) => (
          <option key={city.code} value={city.code}>
            {city.name}
          </option>
        ))}
      </select>

      <select
        value={selectedBarangay?.code ?? ''}
        onChange={handleBarangaySelect}
        disabled={!selectedCity || loadingBarangays}
        aria-label="Filter by barangay"
        style={selectStyle}
      >
        <option value="">
          {!selectedCity
            ? 'Select a city first'
            : loadingBarangays
            ? 'Loading barangays…'
            : 'All Barangays'}
        </option>
        {barangays.map((brgy) => (
          <option key={brgy.code} value={brgy.code}>
            {brgy.name}
          </option>
        ))}
      </select>

      {/* Boundary overlay toggle — only meaningful once a city is picked,
          since BoundaryOverlay never mounts without one, but the switch
          itself stays visible/interactive regardless so its state is
          predictable when a city IS selected. */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          fontSize: 12,
          fontWeight: 600,
          color: '#374151',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: '7px 10px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span>Show boundaries</span>
        <span
          role="switch"
          aria-checked={boundariesEnabled}
          onClick={() => onToggleBoundaries?.(!boundariesEnabled)}
          style={{
            position: 'relative',
            flexShrink: 0,
            width: 32,
            height: 18,
            borderRadius: 9999,
            background: boundariesEnabled ? '#2a6697' : '#d1d5db',
            transition: 'background 0.15s ease',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 2,
              left: boundariesEnabled ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
              transition: 'left 0.15s ease',
            }}
          />
        </span>
      </label>
    </div>
  );
}

const selectStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#374151',
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '8px 10px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.12)',
  cursor: 'pointer',
};