"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/Button";
import { Field, Input, Select } from "@/components/Input";
import { AlertCircle, Loader2 } from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [role, setRole] = useState<"hosteller" | "day_scholar">("day_scholar");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "hosteller" || roleParam === "day_scholar") {
      setRole(roleParam);
      setMode("register");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, full_name: fullName, phone } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MessSwap" className="h-11 w-11 rounded-lg object-cover" />
          <span className="font-display text-2xl font-semibold tracking-tight">MessSwap</span>
        </Link>

        <div className="animate-in stub mt-8 p-6 sm:p-8">
          <div className="flex rounded-full border border-steelLight bg-paper p-1 text-sm">
            <button
              className={`focus-ring flex-1 rounded-full py-2 font-medium transition-colors ${
                mode === "signin" ? "bg-ink text-paper" : "text-steel hover:text-ink"
              }`}
              onClick={() => setMode("signin")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`focus-ring flex-1 rounded-full py-2 font-medium transition-colors ${
                mode === "register" ? "bg-ink text-paper" : "text-steel hover:text-ink"
              }`}
              onClick={() => setMode("register")}
              type="button"
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <Field>I am a</Field>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("day_scholar")}
                      className={`focus-ring rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        role === "day_scholar"
                          ? "border-ink bg-ink text-paper"
                          : "border-steelLight bg-white text-ink hover:border-ink/40"
                      }`}
                    >
                      Day scholar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("hosteller")}
                      className={`focus-ring rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        role === "hosteller"
                          ? "border-ink bg-ink text-paper"
                          : "border-steelLight bg-white text-ink hover:border-ink/40"
                      }`}
                    >
                      Hosteller
                    </button>
                  </div>
                </div>
                <div>
                  <Field htmlFor="fullName">Full name</Field>
                  <Input
                    id="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Field htmlFor="phone">Phone (optional)</Field>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="For coordinating handoffs"
                  />
                </div>
              </>
            )}

            <div>
              <Field htmlFor="email">Email</Field>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
              />
            </div>
            <div>
              <Field htmlFor="password">Password</Field>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-chili/5 px-3 py-2.5 text-sm text-chili">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm />
    </Suspense>
  );
}
