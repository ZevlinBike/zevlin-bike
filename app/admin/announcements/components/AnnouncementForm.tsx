"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Notification } from "@/lib/schema";
import { State } from "../actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Saving…" : label}
    </Button>
  );
}

export default function AnnouncementForm({
  action,
  notification,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  notification?: Notification;
}) {
  const router = useRouter();
  const initial = { message: null, errors: {} as Record<string, string | undefined> };
  const [state, dispatch] = useActionState(action, initial);

  const [title, setTitle] = useState(notification?.title ?? "");
  const [message, setMessage] = useState(notification?.message ?? "");
  const [ctaLabel, setCtaLabel] = useState(notification?.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = useState(notification?.cta_url ?? "");
  const [variant, setVariant] = useState<Notification["variant"]>(notification?.variant ?? "promo");
  const [priority, setPriority] = useState<number>(notification?.priority ?? 0);
  const [status, setStatus] = useState<Notification["status"]>(notification?.status ?? "draft");
  const [startsAt, setStartsAt] = useState<string>(() => {
    if (notification?.starts_at) {
      // Convert ISO to datetime-local
      const d = new Date(notification.starts_at);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endsAt, setEndsAt] = useState<string>(() => {
    if (notification?.ends_at) {
      const d = new Date(notification.ends_at);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    return "";
  });
  const [dismissible, setDismissible] = useState<boolean>(notification?.dismissible ?? true);
  const [rotationGroup, setRotationGroup] = useState<string>(notification?.rotation_group ?? "");
  const [rotationInterval, setRotationInterval] = useState<number>(notification?.rotation_interval_ms ?? 6000);
  const [ticker, setTicker] = useState<boolean>(notification?.ticker ?? true);
  const [tickerSpeed, setTickerSpeed] = useState<number>(notification?.ticker_speed_px_s ?? 60);
  const [style, setStyle] = useState<string>(notification?.style ? JSON.stringify(notification.style, null, 2) : "");
  const [audience, setAudience] = useState<string>(notification?.audience?.join(", ") ?? "all");

  useEffect(() => {
    if (!state.message) return;
    if (state.errors && Object.keys(state.errors).length > 0) {
      toast.error(state.message);
    } else {
      toast.success(state.message);
      router.push("/admin/announcements");
    }
  }, [state, router]);

  return (
    <form action={dispatch} className="max-w-4xl space-y-6 pb-24">
      {notification && <input type="hidden" name="id" value={notification.id} />}

      <div className="grid grid-cols-1 gap-6">
        {/* Basic */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
          </div>
          <div className="sm:col-span-1">
            <Label htmlFor="priority">Priority</Label>
            <Input id="priority" name="priority" type="number" min={0} value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" required value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1" rows={4} />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label htmlFor="cta_label">CTA Label</Label>
            <Input id="cta_label" name="cta_label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cta_url">CTA URL</Label>
            <Input id="cta_url" name="cta_url" type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} className="mt-1" />
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="variant">Variant</Label>
                <select id="variant" name="variant" value={variant} onChange={(e) => setVariant(e.target.value as Notification["variant"]) } className="mt-1 block w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                  {(["promo", "info", "success", "warning", "danger"] as const).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select id="status" name="status" value={status} onChange={(e) => setStatus(e.target.value as Notification["status"]) } className="mt-1 block w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                  {(["draft", "scheduled", "published", "expired", "archived"] as const).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="starts_at">Starts At</Label>
                <Input id="starts_at" name="starts_at" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="ends_at">Ends At</Label>
                <Input id="ends_at" name="ends_at" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="style">Style (JSON)</Label>
              <Textarea id="style" name="style" value={style} onChange={(e) => setStyle(e.target.value)} className="mt-1 font-mono text-xs" rows={6} />
            </div>

            <div>
              <Label htmlFor="audience">Audience (comma-separated)</Label>
              <Input id="audience" name="audience" value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="rounded-xl border border-black/5 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dismissible" className="cursor-pointer">Dismissible</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Allow users to close the banner.</p>
              </div>
              <Switch id="dismissible" checked={dismissible} onCheckedChange={setDismissible} />
              <input type="hidden" name="dismissible" value={dismissible ? "true" : "false"} />
            </div>

            <div>
              <Label htmlFor="rotation_group">Rotation Group</Label>
              <Input id="rotation_group" name="rotation_group" value={rotationGroup} onChange={(e) => setRotationGroup(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="rotation_interval_ms">Rotation Interval (ms)</Label>
              <Input id="rotation_interval_ms" name="rotation_interval_ms" type="number" min={0} value={rotationInterval} onChange={(e) => setRotationInterval(Number(e.target.value))} className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ticker" className="cursor-pointer">Ticker</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Enable marquee-style scrolling.</p>
              </div>
              <Switch id="ticker" checked={ticker} onCheckedChange={setTicker} />
              <input type="hidden" name="ticker" value={ticker ? "true" : "false"} />
            </div>
            <div>
              <Label htmlFor="ticker_speed_px_s">Ticker Speed (px/s)</Label>
              <Input id="ticker_speed_px_s" name="ticker_speed_px_s" type="number" min={1} value={tickerSpeed} onChange={(e) => setTickerSpeed(Number(e.target.value))} className="mt-1" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <SubmitButton label={notification ? "Save Changes" : "Create Announcement"} />
        </div>
      </div>
    </form>
  );
}

