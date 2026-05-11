import type { CSSProperties, HTMLAttributes } from "react";

type LogoIconProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  title?: string;
  variant?: "gradient" | "solid";
};

export function LogoIcon({
  className = "",
  title = "Life Terminal",
  variant = "gradient",
  style,
  ...props
}: LogoIconProps) {
  const background =
    variant === "gradient"
      ? "linear-gradient(135deg, var(--logo-gradient-from), var(--logo-gradient-to))"
      : "var(--accent)";

  return (
    <span
      role="img"
      aria-label={title}
      className={`block shrink-0 ${className}`}
      style={
        {
          background,
          WebkitMaskImage: "url('/life-terminal-logo.svg')",
          maskImage: "url('/life-terminal-logo.svg')",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          filter: "drop-shadow(0 10px 22px var(--logo-glow))",
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}