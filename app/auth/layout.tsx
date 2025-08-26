import MainLayout from "@/app/components/layouts/MainLayout";


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-black pt-20">
          {children}
      </div>
    </MainLayout>
  );
} 
