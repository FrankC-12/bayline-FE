import LoginForm from "@/components/auth/LoginForm";
import LoginBranding from "@/components/auth/LoginBranding";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <LoginBranding />
      <LoginForm />
    </main>
  );
}