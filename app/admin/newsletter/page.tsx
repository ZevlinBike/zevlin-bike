import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getNewsletters, getNewsletterSignupCount } from "./actions";
import { NewsletterList } from "./components/NewsletterList";

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const q = ((sp.q as string) || "").toLowerCase();
  const [newsletters, signupCount] = await Promise.all([
    getNewsletters(),
    getNewsletterSignupCount(),
  ]);
  const filtered = q
    ? newsletters.filter((n) => (n.subject || '').toLowerCase().includes(q))
    : newsletters;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Newsletters</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {signupCount.toLocaleString()} {signupCount === 1 ? "signup" : "signups"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/newsletter/new">New Newsletter</Link>
        </Button>
      </div>
      <NewsletterList newsletters={filtered} />
    </div>
  );
}
