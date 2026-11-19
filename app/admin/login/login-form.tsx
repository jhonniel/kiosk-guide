"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLoginForm({ accessRevoked }: { accessRevoked: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (accessRevoked) await signOut({ redirect: false });
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Incorrect email or password, or the account has been deactivated.");
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check the connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-kiosk-navy via-kiosk-navy to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Kiosk Administration</h1>
          <p className="mt-1 text-sm text-white/70">Province of Camiguin</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          {accessRevoked ? (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Your account no longer has admin access. Contact an administrator, or sign in with another account.
            </p>
          ) : null}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={loading} className="h-10 w-full bg-kiosk-navy hover:bg-kiosk-navy/90">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-white/70 hover:text-white hover:underline">
            Back to the kiosk
          </Link>
        </p>
      </div>
    </div>
  );
}
