// app/admin/newsletter/edit/[id]/page.tsx
import { NewsletterForm } from "../../components/NewsletterForm";
import { getNewsletter, updateNewsletter } from "../../actions";
import { notFound } from "next/navigation";

export default async function EditNewsletterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const newsletter = await getNewsletter(id);
  if (!newsletter) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Newsletter</h1>
      <NewsletterForm newsletter={newsletter} action={updateNewsletter} />
    </div>
  );
}
