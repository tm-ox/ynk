/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Theme helpers defined by the inline script in layouts/Base.astro.
interface Window {
  __applyTheme(theme: string, doc?: Document): void;
  __currentTheme(): "light" | "dark";
  __setTheme(choice: "system" | "light" | "dark" | string): void;
  __storedTheme(): "system" | "light" | "dark";
}
