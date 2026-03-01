import type { CsvRow } from "@/app/types";

export function parseCsv(csv: string): CsvRow[] {
  const lines = csv.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",").map((c) => c.trim().replace(/^\$/, ""));
    if (cols.length < 4) continue;
    const quantity = parseFloat(cols[1]);
    const unit_price = parseFloat(cols[2]);
    const total = parseFloat(cols[3]);
    if (isNaN(quantity) || isNaN(unit_price) || isNaN(total)) continue;
    rows.push({ part_name: cols[0], quantity, unit_price, total });
  }
  return rows;
}
