"use client";

import { useTransition, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoreSettings, updateStoreSettings } from "./actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Settings = Awaited<ReturnType<typeof getStoreSettings>>;

export default function StoreSettingsForm({ settings }: { settings: Settings }) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setErrors({});

    startTransition(async () => {
      const result = await updateStoreSettings(form);
      if (result?.errors) {
        setErrors(result.errors);
        toast.error("Failed to update settings.");
      } else {
        toast.success("Store settings updated successfully.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Origin</CardTitle>
        <CardDescription>The address where you ship from.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shipping_origin_name">Name</Label>
              <Input id="shipping_origin_name" name="shipping_origin_name" value={formData?.shipping_origin_name || ""} onChange={handleChange} />
              {errors.shipping_origin_name && <p className="text-red-500 text-sm mt-1">{errors.shipping_origin_name[0]}</p>}
            </div>
            <div>
              <Label htmlFor="shipping_origin_email">Email</Label>
              <Input id="shipping_origin_email" name="shipping_origin_email" type="email" value={formData?.shipping_origin_email || ""} onChange={handleChange} />
              {errors.shipping_origin_email && <p className="text-red-500 text-sm mt-1">{errors.shipping_origin_email[0]}</p>}
            </div>
            <div>
              <Label htmlFor="shipping_origin_phone">Phone</Label>
              <Input id="shipping_origin_phone" name="shipping_origin_phone" value={formData?.shipping_origin_phone || ""} onChange={handleChange} />
              {errors.shipping_origin_phone && <p className="text-red-500 text-sm mt-1">{errors.shipping_origin_phone[0]}</p>}
            </div>
            <div>
              <Label htmlFor="shipping_origin_address1">Address Line 1</Label>
              <Input id="shipping_origin_address1" name="shipping_origin_address1" value={formData?.shipping_origin_address1 || ""} onChange={handleChange} />
              {errors.shipping_origin_address1 && <p className="text-red-500 text-sm mt-1">{errors.shipping_origin_address1[0]}</p>}
            </div>
            <div>
              <Label htmlFor="shipping_origin_address2">Address Line 2</Label>
              <Input id="shipping_origin_address2" name="shipping_origin_address2" value={formData?.shipping_origin_address2 || ""} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="shipping_origin_city">City</Label>
              <Input id="shipping_origin_city" name="shipping_origin_city" value={formData?.shipping_origin_city || ""} onChange={handleChange} />
              {errors.shipping_origin_city && <p className="text-red-500 text-sm mt-1">{errors.shipping_origin_city[0]}</p>}
            </div>
            <div>
              <Label htmlFor="shipping_origin_state">State</Label>
              <Input id="shipping_origin_state" name="shipping_origin_state" value={formData?.shipping_origin_state || ""} onChange={handleChange} />
              {errors.shipping_origin_state && <p className="text-red-500 text-sm mt-1">{errors.shipping_origin_state[0]}</p>}
            </div>
            <div>
              <Label htmlFor="shipping_origin_postal_code">Postal Code</Label>
              <Input id="shipping_origin_postal_code" name="shipping_origin_postal_code" value={formData?.shipping_origin_postal_code || ""} onChange={handleChange} />
              {errors.shipping_origin_postal_code && <p className="text-red-500 text-sm mt-1">{errors.shipping_origin_postal_code[0]}</p>}
            </div>
            <div>
              <Label htmlFor="shipping_origin_country">Country</Label>
              <Input id="shipping_origin_country" name="shipping_origin_country" value={formData?.shipping_origin_country || ""} onChange={handleChange} />
              {errors.shipping_origin_country && <p className="text-red-500 text-sm mt-1">{errors.shipping_origin_country[0]}</p>}
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
          </Button>
          {errors._form && <p className="text-red-500 text-sm mt-1">{errors._form[0]}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
