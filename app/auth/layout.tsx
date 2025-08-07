import Container from "@/components/shared/Container";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="flex min-h-screen items-center justify-center py-12">
        {children}
      </Container>
    </div>
  );
} 