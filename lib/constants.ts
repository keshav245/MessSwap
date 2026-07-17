export const MEAL_SLOTS = [
  { value: "breakfast", label: "Breakfast", time: "7:00 – 9:30 AM" },
  { value: "lunch", label: "Lunch", time: "12:30 – 2:30 PM" },
  { value: "snack", label: "Snack", time: "4:30 – 6:00 PM" },
  { value: "dinner", label: "Dinner", time: "7:30 – 9:30 PM" },
] as const;

export type MealSlot = (typeof MEAL_SLOTS)[number]["value"];

export function slotLabel(slot: string) {
  return MEAL_SLOTS.find((s) => s.value === slot)?.label ?? slot;
}

export function slotTime(slot: string) {
  return MEAL_SLOTS.find((s) => s.value === slot)?.time ?? "";
}

export const DAY_SCHOLAR_PRICE = 40;
export const HOSTELLER_PAYOUT = 30;
export const QR_LIFETIME_HOURS = 12;
