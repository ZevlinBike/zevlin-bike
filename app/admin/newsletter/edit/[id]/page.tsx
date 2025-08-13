
import { NewsletterForm } from "../../components/NewsletterForm";
import { getNewsletter, updateNewsletter } from "../../actions";
import { notFound } from "next/navigation";

export default async function EditNewsletterPage({
  params,
}: {
  params: { id: string };
}) {
  const newsletter = await getNewsletter(params.id);

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
