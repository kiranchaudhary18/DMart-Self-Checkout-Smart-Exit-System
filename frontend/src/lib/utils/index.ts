import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines standard class names with Tailwind utility classes securely,
 * overriding correctly when conflicts occur.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
