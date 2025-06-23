"use client";
import { useEffect } from "react";
import { sendGAEvent } from "../utils/ga";

interface Item {
  description: string;
  quantity: number | null;
  amount_total: number | null;
}

export default function PurchaseTracker({ items, total }: { items: Item[]; total: number }) {
  useEffect(() => {
    sendGAEvent("purchase", {
      currency: "USD",
      value: total,
      items: items.map((i) => ({
        item_name: i.description,
        quantity: i.quantity ?? 0,
        price: (i.amount_total ?? 0) / 100,
      })),
    });
  }, [items, total]);
  return null;
}