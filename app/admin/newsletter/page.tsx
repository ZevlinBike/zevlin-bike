import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Newsletters</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {signupCount.toLocaleString()} {signupCount === 1 ? "signup" : "signups"}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/newsletter/new">New Newsletter</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Newsletters</CardTitle>
        </CardHeader>
        <CardContent>
          <NewsletterList newsletters={filtered} />
        </CardContent>
      </Card>
    </div>
  );
}
