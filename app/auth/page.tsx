"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/Button";
import { Field, Input, Select } from "@/components/Input";

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
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="font-display text-lg font-semibold tracking-tight">
        MessSwap
      </Link>

      <div className="mt-8 flex rounded-full border border-steelLight bg-white p-1 text-sm">
        <button
          className={`focus-ring flex-1 rounded-full py-2 font-medium transition-colors ${
            mode === "signin" ? "bg-ink text-paper" : "text-steel"
          }`}
          onClick={() => setMode("signin")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`focus-ring flex-1 rounded-full py-2 font-medium transition-colors ${
            mode === "register" ? "bg-ink text-paper" : "text-steel"
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
              <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                <option value="day_scholar">Day scholar (buying meals)</option>
                <option value="hosteller">Hosteller (listing meals)</option>
              </Select>
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

        {error && <p className="text-sm text-chili">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>
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
