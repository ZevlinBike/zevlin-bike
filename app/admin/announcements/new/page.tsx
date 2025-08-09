import AnnouncementForm from "../components/AnnouncementForm";
import { createAnnouncement } from "../actions";

export default function NewAnnouncementPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Create Announcement</h1>
      <AnnouncementForm action={createAnnouncement} />
    </div>
  );
}

