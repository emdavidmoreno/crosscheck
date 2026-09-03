import type { LibrarySet } from "@/types/crosscheck"

export function libraryStorageKey(userId: string) {
  return `crosscheck-library:${userId}`
}

export function loadLibrary(userId: string): LibrarySet[] | null {
  try {
    const raw = localStorage.getItem(libraryStorageKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as LibrarySet[]
  } catch {
    return null
  }
}

export function saveLibrary(userId: string, library: LibrarySet[]) {
  try {
    localStorage.setItem(libraryStorageKey(userId), JSON.stringify(library))
  } catch {
    /* ignore quota / private mode */
  }
}
