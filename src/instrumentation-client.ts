// Runs in the browser before the app starts. Next.js calls
// onRouterTransitionStart as each client-side navigation begins -- a Link,
// router.push or router.replace -- which is the moment the loading bar along
// the top of the window should appear (components/NavigationProgress.tsx).
import { NAVIGATION_START } from "@/lib/navigation";

export function onRouterTransitionStart(url: string, navigationType: "push" | "replace" | "traverse") {
  // Back and forward show pages the router already has: nothing to wait for.
  if (navigationType === "traverse") return;
  window.dispatchEvent(new CustomEvent<string>(NAVIGATION_START, { detail: url }));
}
