import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper shadow-sm hover:bg-turmericDark hover:shadow disabled:bg-steelLight disabled:shadow-none",
  secondary: "bg-transparent text-ink border border-ink/20 hover:border-ink/50 hover:bg-ink/5",
  ghost: "bg-transparent text-steel hover:text-ink hover:bg-ink/5",
  danger: "bg-transparent text-chili border border-chili/30 hover:bg-chili/5",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium font-body transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${variants[variant]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";

export default Button;
