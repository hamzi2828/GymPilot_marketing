// The look of each feature area (group) on the homepage: its icon, its tint
// (a dark/light pair) and a short tab label. Used by FeatureOrbit.

import type { IconType } from "react-icons";
import { LuCalendarDays, LuChartLine, LuConciergeBell, LuMessagesSquare, LuScanFace, LuShieldCheck, LuStore, LuUsers } from "react-icons/lu";
import type { GroupKey } from "@/content/features";

export const AREA_ICONS: Record<GroupKey, IconType> = {
  desk: LuConciergeBell,
  checkin: LuScanFace,
  money: LuChartLine,
  shop: LuStore,
  classes: LuCalendarDays,
  team: LuUsers,
  reach: LuMessagesSquare,
  control: LuShieldCheck,
};

// Mint and ember, with a few muted variants between them. `dark` is the soft
// tint for the black theme, `light` a deeper shade that holds contrast on white.
export type AreaTint = { dark: string; light: string };

export const AREA_TINTS: Record<GroupKey, AreaTint> = {
  desk: { dark: "#7FE3D2", light: "#0B7566" },
  checkin: { dark: "#E5A34A", light: "#8F5609" },
  money: { dark: "#9FDCB8", light: "#2B7A50" },
  shop: { dark: "#E8B87A", light: "#94601C" },
  classes: { dark: "#8FC9E0", light: "#226D8C" },
  team: { dark: "#D9A48A", light: "#9A5336" },
  reach: { dark: "#7FE3D2", light: "#0B7566" },
  control: { dark: "#B9C2BF", light: "#4E5755" },
};

/** CSS custom properties for an area's tint; the stylesheet picks one per theme. */
export function tintVars(key: GroupKey): Record<"--tint-d" | "--tint-l", string> {
  const t = AREA_TINTS[key];
  return { "--tint-d": t.dark, "--tint-l": t.light };
}

/** "Front desk & fees" -> "Front desk", "Website, portal & messages" -> "Website". */
export function shortLabel(label: string): string {
  return label.split(/ &|,/)[0].trim();
}

const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];

export function numberWord(n: number): string {
  return WORDS[n] ?? String(n);
}

export function featuresLabel(n: number): string {
  return `${n} ${n === 1 ? "feature" : "features"}`;
}
