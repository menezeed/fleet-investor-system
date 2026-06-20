import { LoginForm } from '@/components/forms/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
            F
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Fleet Investor Management</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
