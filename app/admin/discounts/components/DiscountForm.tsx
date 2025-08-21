// app/admin/discounts/components/DiscountForm.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Edit, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDiscount, updateDiscount } from "../actions";

type Discount = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number | string;
  active: boolean;
};

type FormErrors = Partial<Record<"code" | "type" | "value" | "_form", string>>;

export default function DiscountForm({ discount }: { discount?: Discount }) {
  const isEdit = Boolean(discount);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [code, setCode] = useState(discount?.code ?? "");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    discount?.type === "fixed" || discount?.type === "percentage"
      ? discount.type
      : "percentage"
  );
  const [value, setValue] = useState(String(discount?.value ?? ""));
  const [active, setActive] = useState<boolean>(discount?.active ?? true);

  useEffect(() => {
    if (!open) {
      // Reset on close to current discount or defaults
      setErrors({});
      setCode(discount?.code ?? "");
      setDiscountType(
        discount?.type === "fixed" || discount?.type === "percentage"
          ? discount.type
          : "percentage"
      );
      setValue(String(discount?.value ?? ""));
      setActive(discount?.active ?? true);
    }
  }, [open, discount]);

  const prefix = useMemo(() => (discountType === "percentage" ? "%" : "$"), [
    discountType,
  ]);

  function validate(): boolean {
    const next: FormErrors = {};
    const codeTrim = code.trim();
    if (!codeTrim) next.code = "Code is required";
    if (codeTrim && !/^[A-Z0-9_-]+$/.test(codeTrim))
      next.code = "Use A–Z, 0–9, _ or -";

    if (!discountType) next.type = "Select a type";

    const num = Number(value);
    if (!value) next.value = "Enter a value";
    else if (Number.isNaN(num)) next.value = "Value must be a number";
    else if (discountType === "percentage" && (num <= 0 || num > 100))
      next.value = "Percentage must be 1–100";
    else if (discountType === "fixed" && num <= 0)
      next.value = "Amount must be greater than 0";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  type ActionResult = { data?: unknown; error?: string };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.set("code", code.trim().toUpperCase());
    formData.set("type", discountType);
    formData.set("value", String(value));
    formData.set("active", active ? "on" : "");
    if (isEdit && discount?.id) formData.set("id", discount.id);

    setErrors({});
    startTransition(async () => {
      const result: ActionResult = await (isEdit
        ? updateDiscount(formData)
        : createDiscount(formData));
      if (result?.error) {
        setErrors({ _form: result.error });
        toast.error(result.error);
        return;
      }
      toast.success(`Discount ${isEdit ? "updated" : "created"}`);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm">
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Discount
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Discount" : "Add New Discount"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this discount code."
              : "Create a new discount code for your customers."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Discount Code</Label>
            <Input
              id="code"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g., SUMMER20"
              className="tracking-wide uppercase"
              autoComplete="off"
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              {/* Radix Select doesn’t submit values, mirror with hidden input */}
              <input type="hidden" name="type" value={discountType} />
              <Select
                value={discountType}
                onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500 dark:text-gray-400">
                  {prefix}
                </span>
                <Input
                  id="value"
                  name="value"
                  inputMode="decimal"
                  type="number"
                  step={discountType === "percentage" ? 1 : 0.01}
                  min={discountType === "percentage" ? 1 : 0.01}
                  max={discountType === "percentage" ? 100 : undefined}
                  className="pl-7"
                  placeholder={discountType === "percentage" ? "20" : "25.00"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              {errors.value && (
                <p className="text-sm text-red-500">{errors.value}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="active">Activate Discount</Label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Make this discount code available for use.
              </p>
            </div>
            {/* Mirror switch state to hidden input for FormData compatibility */}
            <input type="hidden" name="active" value={active ? "on" : ""} />
            <Switch id="active" checked={active} onCheckedChange={setActive} />
          </div>

          {errors._form && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {errors._form}
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? "Save Changes" : "Create Discount"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
