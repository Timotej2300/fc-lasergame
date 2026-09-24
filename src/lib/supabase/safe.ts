export function first<T>(rows: T[] | null | undefined): T | null {
  return rows && rows.length > 0 ? rows[0] : null;
}
