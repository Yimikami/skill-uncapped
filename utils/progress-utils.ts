const progressMap = new Map<string, number>();

export function setProgress(id: string, value: number) {
  progressMap.set(id, value);
}

export function clearProgress(id: string) {
  progressMap.delete(id);
}

export function getProgress(id: string): number {
  return progressMap.get(id) || 0;
}
