// components/ui/Toast.jsx
// Minimal self-dismissing toast. No external dependency (none exists in
// package.json), so this is a small custom implementation.
//
// Usage:
//   const { toast, showToast } = useToast();
//   showToast("Report has been verified");
//   ...
//   <Toast message={toast?.message} show={!!toast} />

"use client";

import { useCallback, useRef, useState } from "react";

const DEFAULT_DURATION = 3000;

export function useToast() {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  const showToast = useCallback((message, duration = DEFAULT_DURATION) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message, id: Date.now() });
    timeoutRef.current = setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, duration);
  }, []);

  return { toast, showToast };
}

export default function Toast({ message, show }) {
  if (!show || !message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <i className="fa-solid fa-circle-check" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}