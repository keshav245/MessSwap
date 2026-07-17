import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-turmericDark disabled:bg-steelLight",
  secondary: "bg-transparent text-ink border border-ink/20 hover:border-ink/50",
  ghost: "bg-transparent text-steel hover:text-ink",
  danger: "bg-transparent text-chili border border-chili/30 hover:bg-chili/5",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium font-body transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";

export default Button;
