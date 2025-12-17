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
import { Textarea } from "@/components/ui/textarea";
import { createDiscount, updateDiscount } from "../actions";
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";

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

type FormErrors = Partial<
  Record<
    | "code"
    | "type"
    | "value"
    | "description"
    | "product_ids"
    | "usage_limit"
    | "expiration_date"
    | "_form",
    string
  >
>;

export default function DiscountForm({ discount, autoOpen = false, initialProducts }: { discount?: Discount; autoOpen?: boolean; initialProducts?: { id: string; name: string; slug: string; image_url: string | null }[] }) {
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
  const [description, setDescription] = useState(discount?.description ?? "");
  const [productIds, setProductIds] = useState(
    discount?.product_ids?.join(", ") ?? ""
  );
  const [applyAll, setApplyAll] = useState<boolean>(() => {
    const initial = discount?.product_ids?.length ? false : true;
    return initial;
  });
  const [usageLimit, setUsageLimit] = useState(
    String(discount?.usage_limit ?? "")
  );
  const [expirationDate, setExpirationDate] = useState(
    discount?.expiration_date?.split("T")[0] ?? ""
  );

  useEffect(() => {
    if (autoOpen && !isEdit) setOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

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
      setDescription(discount?.description ?? "");
      setProductIds(discount?.product_ids?.join(", ") ?? "");
      setApplyAll(!(discount?.product_ids && discount.product_ids.length > 0));
      setUsageLimit(String(discount?.usage_limit ?? ""));
      setExpirationDate(discount?.expiration_date?.split("T")[0] ?? "");
    }
  }, [open, discount]);

  const prefix = useMemo(() => (discountType === "percentage" ? "%" : "$"), [discountType]);

  // Wizard state
  const [step, setStep] = useState<number>(1); // 1 Basics, 2 Type & Value, 3 Scope, 4 Limits, 5 Review

  // Product picker state
  type SimpleProduct = { id: string; name: string; slug: string; image_url: string | null };
  const [allProducts, setAllProducts] = useState<SimpleProduct[]>(initialProducts || []);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Supabase client (browser)
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // Parse and maintain a structured list of selected product IDs
  const selectedIds = useMemo<string[]>(() => (productIds ? productIds.split(",").map((s) => s.trim()).filter(Boolean) : []), [productIds]);

  // Load all products once when entering Scope step (only when not applying to all)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!supabase || !open || step !== 3 || allProducts.length || applyAll) return;
      setLoadingProducts(true);
      try {
        const { data } = await supabase
          .from('products')
          .select('id,name,slug,product_images(url,is_featured)')
          .order('created_at', { ascending: true })
          .limit(500);
        if (cancelled) return;
        const mapped: SimpleProduct[] = ((data as unknown as Array<{ id: string; name: string; slug: string; product_images?: Array<{ url: string; is_featured?: boolean | null }> }>) || []).map((p) => {
          const imgs = Array.isArray(p.product_images) ? p.product_images : [];
          const featured = imgs.find((i) => i.is_featured) || imgs[0];
          return { id: p.id, name: p.name, slug: p.slug, image_url: featured?.url || null };
        });
        setAllProducts(mapped);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [supabase, open, step, allProducts.length, applyAll]);

  function validate(): boolean {
    const next: FormErrors = {};
    const codeTrim = code.trim();
    if (!codeTrim) next.code = "Code is required";
    // Allow letters, numbers, spaces, underscores, and hyphens
    if (codeTrim && !/^[A-Za-z0-9 _-]+$/.test(codeTrim))
      next.code = "Use letters, numbers, spaces, _ or -";

    if (!discountType) next.type = "Select a type";

    const num = Number(value);
    if (!value) next.value = "Enter a value";
    else if (Number.isNaN(num)) next.value = "Value must be a number";
    else if (discountType === "percentage" && (num <= 0 || num > 100))
      next.value = "Percentage must be 0.01–100";
    else if (
      discountType === "percentage" &&
      /\.\d{3,}$/.test(String(value))
    )
      next.value = "Max 2 decimal places";
    else if (discountType === "fixed" && num <= 0)
      next.value = "Amount must be greater than 0";

    if (usageLimit) {
      const limit = Number(usageLimit);
      if (Number.isNaN(limit) || limit < 0) {
        next.usage_limit = "Usage limit must be a non-negative number";
      }
    }

    if (productIds) {
      const ids = productIds.split(",").map((id) => id.trim());
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (ids.some((id) => !uuidRegex.test(id))) {
        next.product_ids = "Please provide a valid comma-separated list of UUIDs";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  type ActionResult = { data?: unknown; error?: string };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.set("code", code.trim());
    formData.set("type", discountType);
    formData.set("value", String(value));
    formData.set("active", active ? "on" : "");
    if (description) formData.set("description", description);
    if (productIds) formData.set("product_ids", productIds);
    if (usageLimit) formData.set("usage_limit", usageLimit);
    if (expirationDate) formData.set("expiration_date", expirationDate);
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Discount" : "Add New Discount"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this discount code."
              : "Create a new discount code for your customers."}
          </DialogDescription>
        </DialogHeader>
        {/* Wizard */}
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Stepper */}
          <div className="flex items-center gap-2 text-xs">
            {["Basics", "Type & Value", "Scope", "Limits", "Review"].map((label, idx) => {
              const sn = idx + 1;
              const active = step === sn;
              const done = step > sn;
              return (
                <div key={label} className={`flex items-center gap-2 ${active ? 'text-blue-600' : done ? 'text-green-600' : 'text-neutral-400'}`}>
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${active || done ? 'border-current' : 'border-neutral-300'}`}>
                    <span className="text-[11px] font-semibold">{sn}</span>
                  </div>
                  <span className="hidden sm:inline font-medium">{label}</span>
                  {sn < 5 && <div className="h-px w-6 bg-neutral-300" />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Discount Code</Label>
                <div className="flex gap-2">
                  <Input id="code" name="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g., SUMMER20" className="tracking-wide" autoComplete="off" />
                  <Button type="button" variant="secondary" onClick={() => {
                    const base = (description || 'SALE').split(/\s+/)[0].toUpperCase().replace(/[^A-Z0-9]/g, '') || 'SALE';
                    const num = discountType === 'percentage' && value ? String(value) : String(Math.floor(5 + Math.random()*45));
                    setCode(`${base}${num}`.slice(0, 24));
                  }}>Generate</Button>
                </div>
                {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="active">Active</Label>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="text-sm">Make this discount code available for use.</div>
                  <input type="hidden" name="active" value={active ? 'on' : ''} />
                  <Switch id="active" checked={active} onCheckedChange={setActive} />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., 20% off for our summer sale!" />
              </div>
            </div>
          )}

          {/* Step 2: Type & Value */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <input type="hidden" name="type" value={discountType} />
                <Select value={discountType} onValueChange={(v: "percentage" | "fixed") => setDiscountType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500 dark:text-gray-400">{prefix}</span>
                  <Input id="value" name="value" inputMode="decimal" type="number" step={0.01} min={0.01} max={discountType === 'percentage' ? 100 : undefined} className="pl-7" placeholder={discountType === 'percentage' ? '12.50' : '25.00'} value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
                {errors.value && <p className="text-sm text-red-500">{errors.value}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Scope */}
          {step === 3 && (
            <div className="space-y-3">
              <Label>Applies to</Label>
              <div className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Apply to all products</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-400">Turn off to choose specific products.</div>
                  </div>
                  <Switch
                    checked={applyAll}
                    onCheckedChange={(v) => {
                      setApplyAll(v);
                      if (v) setProductIds('');
                    }}
                  />
                </div>
                {!applyAll && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Button type="button" variant="secondary" onClick={() => setProductIds(allProducts.map(p => p.id).join(', '))} disabled={loadingProducts || !allProducts.length}>Select All</Button>
                      <Button type="button" variant="outline" onClick={() => setProductIds('')} disabled={!selectedIds.length}>Clear</Button>
                      <div className="ml-auto text-neutral-500">{selectedIds.length ? `${selectedIds.length} selected` : 'None selected'}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-auto rounded-md border p-2">
                      {loadingProducts && <div className="text-sm text-neutral-500 px-2 py-1">Loading products…</div>}
                      {!loadingProducts && allProducts.map((p) => {
                        const checked = selectedIds.includes(p.id);
                        return (
                          <label key={p.id} className={`flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 ${checked ? 'border-blue-300' : ''}`}>
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? Array.from(new Set([...selectedIds, p.id]))
                                  : selectedIds.filter((x) => x !== p.id);
                                setProductIds(next.join(', '));
                              }}
                            />
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-neutral-100 overflow-hidden flex items-center justify-center">
                                {p.image_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="text-[10px] text-neutral-400">No image</div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium leading-tight">{p.name}</div>
                                <div className="text-xs text-neutral-500">{p.slug}</div>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* Mirror to form */}
              <input type="hidden" name="product_ids" value={productIds} />
              {errors.product_ids && <p className="text-sm text-red-500">{errors.product_ids}</p>}
            </div>
          )}

          {/* Step 4: Limits */}
          {step === 4 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit</Label>
                <Input id="usage_limit" name="usage_limit" type="number" min="0" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="e.g., 100" />
                {errors.usage_limit && <p className="text-sm text-red-500">{errors.usage_limit}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input id="expiration_date" name="expiration_date" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="rounded-md border p-3 text-sm space-y-2">
              <div><span className="text-neutral-500">Code:</span> <span className="font-mono">{code || '(none)'}</span></div>
              <div><span className="text-neutral-500">Type:</span> {discountType}</div>
              <div><span className="text-neutral-500">Value:</span> {discountType === 'percentage' ? `${value || '—'}%` : `$${value || '—'}`}</div>
              <div><span className="text-neutral-500">Active:</span> {active ? 'Yes' : 'No'}</div>
              <div><span className="text-neutral-500">Scope:</span> {selectedIds.length ? `${selectedIds.length} product(s)` : 'All products'}</div>
              <div><span className="text-neutral-500">Usage limit:</span> {usageLimit || 'Unlimited'}</div>
              <div><span className="text-neutral-500">Expires:</span> {expirationDate || 'Never'}</div>
              {description && <div><span className="text-neutral-500">Description:</span> {description}</div>}
            </div>
          )}

          {errors._form && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{errors._form}</div>
          )}

          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <div className="flex items-center gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</Button>
              )}
              {step < 5 ? (
                <Button type="button" onClick={() => {
                  // quick validate essentials before moving forward
                  if (step === 1) { if (!code.trim()) { setErrors((e) => ({ ...e, code: 'Code is required' })); return; } }
                  if (step === 2) { if (!validate()) return; }
                  setStep((s) => Math.min(5, s + 1));
                }}>Next</Button>
              ) : (
                <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {isEdit ? 'Save Changes' : 'Create Discount'}</Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
