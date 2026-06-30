import ListScreenShell from "@/components/ui/ListScreenShell";

const TABS = [
  { key: "all",      label: "All" },
  { key: "resolved", label: "Resolved" },
];

export default function CommunityPage() {
  return (
    <ListScreenShell
      title="Community"
      subtitle="Official updates and announcements from the engineering office."
      tabs={TABS}
      defaultTab="all"
    >
      {/* Announcement cards go here */}
    </ListScreenShell>
  );
}