import Link from "next/link";
import Button from "@/components/Button";
import { MEAL_SLOTS, DAY_SCHOLAR_PRICE, HOSTELLER_PAYOUT } from "@/lib/constants";

const steps = [
  {
    step: "01",
    title: "Hostler uploads a QR",
    body: "Won't eat a meal? Upload its mess QR for one of four slots. It stays live for 12 hours, then auto-deletes.",
  },
  {
    step: "02",
    title: "Day scholar browses & pays",
    body: `Browse available meals by slot, scan the owner's QR, pay ₹${DAY_SCHOLAR_PRICE}, and upload the payment screenshot.`,
  },
  {
    step: "03",
    title: "Owner verifies",
    body: "The request lands in the owner console as Pending, with the payment screenshot attached for review.",
  },
  {
    step: "04",
    title: "Approve & eat",
    body: `One click releases the meal QR straight to the day scholar's dashboard. The hostler is credited ₹${HOSTELLER_PAYOUT}.`,
  },
];

export default function Home() {
  return (
    <div>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-semibold tracking-tight">MessSwap</span>
        <Link href="/auth">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-10 sm:pt-16">
        <div className="grid items-center gap-12 sm:grid-cols-2">
          <div>
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

          <div className="stub mx-auto w-full max-w-xs p-6">
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
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className="group relative rounded-xl border border-steelLight bg-paper p-5 transition-transform hover:-translate-y-1"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="font-mono text-xs text-turmericDark">{s.step}</span>
                <h3 className="mt-2 font-display text-base font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-steel">{s.body}</p>
                {i < steps.length - 1 && (
                  <span className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-steelLight lg:block">
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold">Meal slots</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {MEAL_SLOTS.map((s) => (
            <div key={s.value} className="stub p-4 text-center">
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
