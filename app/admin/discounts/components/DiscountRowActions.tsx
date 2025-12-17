"use client";

import { useTransition } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { deleteDiscount } from "../actions";
import DiscountForm from "./DiscountForm";
import { toast } from "sonner";

type Discount = {
  id: string;
  code: string | null;
  type: "percentage" | "fixed";
  value: number | string;
  active: boolean;
  description?: string | null;
  product_ids?: string[] | null;
  usage_limit?: number | null;
  expiration_date?: string | null;
};

export default function DiscountRowActions({ discount, initialProducts }: { discount: Discount; initialProducts?: { id: string; name: string; slug: string; image_url: string | null }[] }) {
  const [, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirm(`Delete discount ${discount.code || discount.id}?`)) return;
    startTransition(async () => {
      const res = await deleteDiscount(discount.id) as { error?: string };
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Discount deleted");
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Inline edit */}
      <DiscountForm discount={discount} initialProducts={initialProducts} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onDelete} variant="destructive">
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
