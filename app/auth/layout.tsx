import PageShell from "@/app/components/layouts/PageShell";


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell>
      <div className="min-h-screen bg-gray-50 dark:bg-black pt-20">
          {children}
      </div>
    </PageShell>
  );
} 
