import ListScreenShell from "@/components/ui/ListScreenShell";

const TABS = [
  { key: "all",      label: "All" },
  { key: "resolved", label: "Resolved" },
];

// Placeholder announcements — replace with Firestore data when ready.
const MOCK_ANNOUNCEMENTS = [
  {
    id: "1",
    type: "INSPECTION IN PROGRESS",
    title: "Mabini Elementary School",
    location: "San Jose del Monte, Bulacan",
    body: "Inspection in progress. Please avoid the area and follow the safety protocol.",
    postedBy: "San Jose Engineering Office",
    postedAt: "1min ago",
    resolved: false,
  },
];

export default function CommunityPage() {
  return (
    <ListScreenShell
      title="Community"
      subtitle="Official updates and announcements from the engineering office."
      tabs={TABS}
      defaultTab="all"
    >
      {MOCK_ANNOUNCEMENTS.map((item) => (
        <div key={item.id} className="announcement-card">
          <div className="announcement-card__type">{item.type}</div>
          <div className="announcement-card__time">{item.postedAt}</div>
          <p className="announcement-card__title">{item.title}</p>
          <p className="announcement-card__location">
            <i className="fa-solid fa-location-dot" aria-hidden="true" />
            {item.location}
          </p>
          <p className="announcement-card__body">{item.body}</p>
          <p className="announcement-card__posted-by">
            <i className="fa-solid fa-circle-check" aria-hidden="true" />
            Posted by {item.postedBy}
          </p>
        </div>
      ))}
    </ListScreenShell>
  );
}