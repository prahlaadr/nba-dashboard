import { readFile } from 'fs/promises';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data', 'games');

const ENDPOINT_FILES: Record<string, string> = {
  meta: 'meta.json',
  shots: 'shots.json',
  playbyplay: 'playbyplay.json',
  boxscore: 'boxscore.json',
  'boxscore-advanced': 'boxscore_advanced.json',
};

export async function readLocalGameData(
  gameId: string,
  endpoint: string
): Promise<unknown | null> {
  const fileName = ENDPOINT_FILES[endpoint];
  if (!fileName) return null;

  try {
    const filePath = join(DATA_DIR, gameId, fileName);
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** List game IDs that have local data */
export async function listLocalGames(): Promise<string[]> {
  try {
    const { readdir } = await import('fs/promises');
    const entries = await readdir(DATA_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && /^\d{10}$/.test(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}
