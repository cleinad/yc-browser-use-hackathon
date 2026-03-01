import type { LineItem } from "../types";

interface LineItemRowProps {
  item: LineItem;
}

export default function LineItemRow({ item }: LineItemRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border-default)] py-2 text-sm last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[var(--fg-base)]">
          {item.product_name}
        </p>
        <p className="text-xs text-[var(--fg-muted)]">
          {item.part_name}
          {item.retailer && <> &middot; {item.retailer}</>}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 text-right">
        {item.availability && (
          <span className="text-xs text-[var(--fg-muted)]">{item.availability}</span>
        )}
        {item.delivery_estimate && (
          <span className="text-xs text-[var(--fg-muted)]">
            {item.delivery_estimate}
          </span>
        )}
        {item.price != null && (
          <span className="font-medium text-[var(--fg-base)]">
            {item.currency} {item.price.toFixed(2)}
          </span>
        )}
        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[var(--accent-primary)] underline-offset-2 hover:underline"
          >
            Open
          </a>
        )}
      </div>
    </div>
  );
}
