import Link from "next/link";
import Button from "@/components/Button";
import { MEAL_SLOTS, DAY_SCHOLAR_PRICE, HOSTELLER_PAYOUT } from "@/lib/constants";
import { QrCode, Search, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: QrCode,
    title: "Hostler uploads a QR",
    body: "Won't eat a meal? Upload its mess QR for one of four slots. It stays live for 12 hours, then auto-deletes.",
  },
  {
    icon: Search,
    title: "Day scholar browses & pays",
    body: `Browse available meals by slot, scan the owner's QR, pay ₹${DAY_SCHOLAR_PRICE}, and upload the payment screenshot.`,
  },
  {
    icon: ShieldCheck,
    title: "Owner verifies",
    body: "The request lands in the owner console as Pending, with the payment screenshot attached for review.",
  },
  {
    icon: CheckCircle2,
    title: "Approve & eat",
    body: `One click releases the meal QR straight to the day scholar's dashboard. The hostler is credited ₹${HOSTELLER_PAYOUT}.`,
  },
];

export default function Home() {
  return (
    <div>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MessSwap" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-display text-lg font-semibold tracking-tight">MessSwap</span>
        </span>
        <Link href="/auth">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-10 sm:pt-16">
        <div className="grid items-center gap-12 sm:grid-cols-2">
          <div className="animate-in">
            <p className="font-mono text-xs uppercase tracking-widest text-turmericDark">
              Hostel mess, sorted
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Skipping a meal?
              <br />
              Don't let it go to waste.
            </h1>
            <p className="mt-4 max-w-md text-base text-steel">
              Hostellers share the mess QR for meals they won't eat. Day scholars pay ₹{DAY_SCHOLAR_PRICE}
              to claim one. The owner verifies every payment before the QR is released — nobody loses out.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth?role=hosteller">
                <Button variant="primary">I'm a hosteller</Button>
              </Link>
              <Link href="/auth?role=day_scholar">
                <Button variant="secondary">I'm a day scholar</Button>
              </Link>
            </div>
          </div>

          <div className="stub stub-interactive animate-in mx-auto w-full max-w-xs p-6" style={{ animationDelay: "80ms" }}>
            <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Meal pass</p>
            <p className="mt-1 font-display text-2xl font-semibold">Lunch</p>
            <p className="text-sm text-steel">12:30 – 2:30 PM</p>
            <div className="mt-6 flex items-end justify-between">
              <span className="rounded-full bg-chutney/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-chutney">
                available
              </span>
              <span className="font-display text-xl font-semibold">₹{DAY_SCHOLAR_PRICE}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-steelLight bg-white/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold">How a swap happens</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="stub stub-interactive animate-in relative p-5"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-turmeric/15 text-turmericDark">
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <p className="mt-3 font-mono text-xs text-turmericDark">0{i + 1}</p>
                  <h3 className="mt-1 font-display text-base font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-steel">{s.body}</p>
                  {i < steps.length - 1 && (
                    <span className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-steelLight lg:block">
                      <ArrowRight size={16} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold">Meal slots</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {MEAL_SLOTS.map((s) => (
            <div key={s.value} className="stub stub-interactive p-4 text-center">
              <p className="font-display text-base font-semibold">{s.label}</p>
              <p className="mt-1 text-xs text-steel">{s.time}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-steel">
        MessSwap — built by students, for students.
      </footer>
    </div>
  );
}
