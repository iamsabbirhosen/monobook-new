import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hStr = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
  const mStr = `${m.toString().padStart(2, '0')}:`;
  const sStr = s.toString().padStart(2, '0');

  return `${hStr}${mStr}${sStr}`;
}
