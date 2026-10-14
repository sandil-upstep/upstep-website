import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./button.scss";

type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  children: ReactNode;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button(props: ButtonProps) {
  const {
    children,
    size = "md",
    fullWidth = false,
    className = "",
    ...rest
  } = props;

  const classes = [
    "upstep-btn",
    `upstep-btn--${size}`,
    fullWidth && "upstep-btn--full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (rest.href !== undefined) {
    const { href, target, rel } = rest;
    return (
      <Link href={href} target={target} rel={rel} className={classes}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonProps } = rest;

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
