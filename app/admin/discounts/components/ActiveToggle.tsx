"use client";

import { useRef, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { updateDiscountActiveForm } from "../actions";
import { toast } from "sonner";

export default function ActiveToggle({ id, initialActive }: { id: string; initialActive: boolean }) {
  const [active, setActive] = useState<boolean>(initialActive);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <form
      ref={formRef}
      action={async (fd: FormData) => {
        startTransition(async () => {
          const res: { error?: string; ok?: boolean } = await updateDiscountActiveForm(fd) as { error?: string; ok?: boolean };
          if (res?.error) {
            // revert optimistic toggle
            setActive((v) => !v);
            toast.error(res.error);
          } else {
            toast.success("Status updated");
          }
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />
      <Switch
        checked={active}
        disabled={pending}
        onCheckedChange={(v) => {
          // Optimistic state + submit form
          setActive(v);
          // Update hidden field then submit
          const form = formRef.current;
          if (!form) return;
          const input = Array.from(form.elements).find((el) => (el as HTMLInputElement).name === "active") as HTMLInputElement | undefined;
          if (input) input.value = v ? "true" : "false";
          form.requestSubmit();
        }}
      />
    </form>
  );
}
