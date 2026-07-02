import ListScreenShell from "@/components/ui/ListScreenShell";
import AnnouncementCard from "@/components/community/AnnouncementCard";

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
    photoUrl: "/uploads/mabini-crack.jpg", // optional — omit or set null for no photo
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
        <AnnouncementCard key={item.id} {...item} />
      ))}
    </ListScreenShell>
  );
}