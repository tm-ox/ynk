/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Theme helpers defined by the inline script in layouts/Base.astro.
interface Window {
  __applyTheme(theme: string, doc?: Document): void;
  __setTheme(choice: "system" | "light" | "dark"): void;
  __storedTheme(): "system" | "light" | "dark";
}
