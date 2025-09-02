import { promises as fs } from "fs";
import path from "path";

const FILE = path.resolve(process.cwd(), ".disabled-users.json");

type Store = { ids: number[] };

// Crea el archivo si no existe
async function ensure() {
  try {
    await fs.access(FILE);
  } catch {
    const empty: Store = { ids: [] };
    await fs.writeFile(FILE, JSON.stringify(empty, null, 2), "utf8");
  }
}

export async function getDisabledIds(): Promise<number[]> {
  await ensure();
  const raw = await fs.readFile(FILE, "utf8");
  const data = JSON.parse(raw) as Store;
  return Array.isArray(data.ids) ? data.ids : [];
}

export async function isDisabled(id: number): Promise<boolean> {
  const ids = await getDisabledIds();
  return ids.includes(id);
}

export async function setDisabled(
  id: number,
  disabled: boolean
): Promise<void> {
  await ensure();
  const ids = await getDisabledIds();
  const set = new Set(ids);
  if (disabled) set.add(id);
  else set.delete(id);
  const data: Store = { ids: Array.from(set) };
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), "utf8");
}
