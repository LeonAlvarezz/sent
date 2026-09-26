import { LoginForm } from "./components/login-form";

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg relative">
        <LoginForm />
      </div>
    </div>
  );
}

export default LoginPage;
