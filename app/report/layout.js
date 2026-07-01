// app/(app)/report/layout.js
// page.js under this route is a client component (it needs hooks, refs,
// Google Maps, etc.), and client components can't export `metadata`.
// This tiny server layout carries the title instead — same pattern Next.js
// recommends whenever a route's page.js has to be "use client".

export const metadata = {
  title: "Report a Hazard — PinPoint",
};

export default function ReportLayout({ children }) {
  return children;
}