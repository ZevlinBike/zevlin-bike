import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-neutral-950 p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}