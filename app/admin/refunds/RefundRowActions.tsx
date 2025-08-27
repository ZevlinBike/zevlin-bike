"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { approveRefund, rejectRefund } from "./actions";

const isError = (r: unknown): r is { error: string } => {
  if (!r || typeof r !== 'object') return false;
  const val = (r as Record<string, unknown>).error;
  return typeof val === 'string';
};

export default function RefundRowActions({ refundId }: { refundId: string }) {
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onApprove = () => {
    startTransition(async () => {
      const res = await approveRefund(refundId);
      if (isError(res)) toast.error(res.error); else toast.success("Refund approved");
      router.refresh();
    });
  };

  const onReject = () => {
    startTransition(async () => {
      const res = await rejectRefund(refundId, note || undefined);
      if (isError(res)) toast.error(res.error); else toast.success("Refund rejected");
      router.refresh();
    });
  };

  return (
    <div className="flex gap-2 justify-end items-center">
      <Button size="sm" onClick={onApprove} disabled={isPending}>
        {isPending ? "Working..." : "Approve"}
      </Button>
      <input
        type="text"
        placeholder="Optional note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-8 w-40 rounded border border-gray-300 bg-white px-2 text-xs dark:bg-neutral-800 dark:border-neutral-700"
      />
      <Button size="sm" variant="destructive" onClick={onReject} disabled={isPending}>
        {isPending ? "Working..." : "Reject"}
      </Button>
    </div>
  );
}
