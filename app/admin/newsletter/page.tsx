import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getNewsletters } from "./actions";
import { NewsletterList } from "./components/NewsletterList";

export default async function NewsletterPage() {
  const newsletters = await getNewsletters();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Newsletters</h1>
        <Button asChild>
          <Link href="/admin/newsletter/new">New Newsletter</Link>
        </Button>
      </div>
      <NewsletterList newsletters={newsletters} />
    </div>
  );
}