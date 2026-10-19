// The window event a client-side navigation starts with. instrumentation-client.ts
// sends it from Next.js's own hook; the bar along the top of the window
// (components/NavigationProgress.tsx) listens for it. The detail is the
// address being navigated to.
export const NAVIGATION_START = "gymspilot:navigation-start";
