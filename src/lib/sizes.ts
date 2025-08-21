// /src/lib/sizes.ts
export type Size = string; // ej. "S" | "M" | "L" | "XL" ...

export function parseSizes(input: string): Size[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateSizes(sizes: Size[]): boolean {
  return sizes.length > 0 && sizes.every((s) => s.length <= 10);
}

export function formatSizes(sizes: Size[]): string {
  return sizes.join(", ");
}
