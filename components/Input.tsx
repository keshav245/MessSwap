import { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

export const Field = ({ children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className="block text-xs font-medium uppercase tracking-wide text-steel mb-1.5" {...props}>
    {children}
  </label>
);

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`focus-ring w-full rounded-lg border border-steelLight bg-white px-3.5 py-2.5 text-sm font-body text-ink placeholder:text-steel/60 ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = "", children, ...props }, ref) => (
    <select
      ref={ref}
      className={`focus-ring w-full rounded-lg border border-steelLight bg-white px-3.5 py-2.5 text-sm font-body text-ink ${className}`}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";
