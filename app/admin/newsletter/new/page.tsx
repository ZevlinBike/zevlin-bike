
import { NewsletterForm } from "../components/NewsletterForm";
import { createNewsletter } from "../actions";

export default function NewNewsletterPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">New Newsletter</h1>
      <NewsletterForm action={createNewsletter} />
    </div>
  );
}
