"use client";

import { motion } from "framer-motion";
import type { LineItem } from "../types";
import ProductThumbnail from "./ProductThumbnail";
import RetailerBadge from "./RetailerBadge";

interface LineItemRowProps {
  item: LineItem;
  index?: number;
}

export default function LineItemRow({ item, index = 0 }: LineItemRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="flex gap-3 border-b border-[var(--border-default)] py-3 last:border-b-0"
    >
      {/* Thumbnail */}
      <ProductThumbnail src={item.image_url} alt={item.product_name} size={48} />

      {/* Product info */}
      <div className="flex-1 min-w-0">
        {item.product_url ? (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[var(--fg-base)] hover:underline underline-offset-2 line-clamp-1"
          >
            {item.product_name}
          </a>
        ) : (
          <p className="text-sm font-medium text-[var(--fg-base)] truncate">
            {item.product_name}
          </p>
        )}
        <p className="text-xs text-[var(--fg-muted)] mt-0.5 flex items-center gap-1.5">
          <span className="truncate">{item.part_name}</span>
          {item.retailer && (
            <>
              <span className="text-[var(--fg-disabled)]">&middot;</span>
              <RetailerBadge retailer={item.retailer} size="sm" />
            </>
          )}
        </p>
      </div>

      {/* Price & meta */}
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        {item.price != null && (
          <span className="text-base font-semibold text-[var(--fg-base)]">
            ${item.price.toFixed(2)}
          </span>
        )}
        {item.availability && (
          <span className="text-[10px] text-[var(--fg-muted)]">
            {item.availability}
          </span>
        )}
        {item.delivery_estimate && (
          <span className="text-[10px] text-[var(--fg-muted)]">
            {item.delivery_estimate}
          </span>
        )}
        {item.product_url && (
          <a
            href={item.product_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center rounded-full border border-[var(--border-default)] px-3 py-1 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg-base)] hover:border-[var(--fg-muted)] transition"
          >
            View
          </a>
        )}
      </div>
    </motion.div>
  );
}
