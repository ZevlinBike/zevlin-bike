import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getNewsletters, getNewsletterSignupCount } from "./actions";
import { NewsletterList } from "./components/NewsletterList";

export default async function NewsletterPage() {
  const [newsletters, signupCount] = await Promise.all([
    getNewsletters(),
    getNewsletterSignupCount(),
  ]);

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
      <NewsletterList newsletters={newsletters} />
    </div>
  );
}
