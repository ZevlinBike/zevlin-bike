import { notFound } from "next/navigation";
import { getNotificationById, updateAnnouncement } from "../../actions";
import AnnouncementForm from "../../components/AnnouncementForm";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditAnnouncementPage({ params }: EditPageProps) {
  const { id } = await params;
  const notification = await getNotificationById(id);
  if (!notification) {
    notFound();
  }
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit Announcement</h1>
      <AnnouncementForm action={updateAnnouncement} notification={notification} />
    </div>
  );
}

