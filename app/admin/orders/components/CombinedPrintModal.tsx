"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PackingSlip, OrderDetails } from "./PackingSlip";
import { getOrderById } from "../actions";
import { toast } from "sonner";
import { Printer, X } from "lucide-react";

// pdf.js (render first page of label as canvas)
import * as pdfjsLib from "pdfjs-dist";
// Use same-origin ES module worker to avoid CORS/module issues
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.mjs";

type Props = {
  orderId: string;
  labelUrl: string; // Source label URL (Shippo)
  trigger?: React.ReactNode;
};

export function CombinedPrintModal({ orderId, labelUrl, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: order?.id ? `${order.id}-label-slip` : undefined,
  });

  // Prepare proxy URL for CORS-safe fetch
  const computedProxyUrl = useMemo(() => {
    const u = new URL("/api/shipping/label-proxy", window.location.origin);
    u.searchParams.set("url", labelUrl);
    return u.toString();
  }, [labelUrl]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getOrderById(orderId)
      .then((data) => {
        if (data) setOrder(data as OrderDetails);
        else toast.error("Failed to load order details");
      })
      .finally(() => setLoading(false));
  }, [open, orderId]);

  // Render label PDF first page to canvas via pdf.js
  useEffect(() => {
    if (!open) return;
    setProxyUrl(computedProxyUrl);
  }, [open, computedProxyUrl]);

  useEffect(() => {
    if (!open || !proxyUrl) return;
    let cancelled = false;
    const run = async () => {
      try {
        setRendering(true);
        const loadingTask = pdfjsLib.getDocument({ url: proxyUrl, withCredentials: false });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        if (cancelled) return;
      } catch (e) {
        console.error(e);
        toast.error("Failed to render label for printing");
      } finally {
        if (!cancelled) setRendering(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [open, proxyUrl]);

  const ready = !!order && !loading && !rendering;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="default" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Both
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-screen h-[100dvh] p-0 sm:w-[92vw] sm:max-w-4xl sm:h-[88vh] overflow-hidden">
        <div className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b bg-white/95 dark:bg-black/90">
          <button
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            onClick={() => setOpen(false)}
            title="Close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:inline">Close</span>
          </button>
          <DialogTitle>
            <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
              {order ? `Label + Packing Slip • ${order.id.slice(0, 8)}` : "Label + Packing Slip"}
            </div>
          </DialogTitle>
          <Button size="sm" onClick={handlePrint} disabled={!ready} className="gap-2 text-white">
            <Printer className="h-4 w-4" />
            <span className="hidden xs:inline">Print</span>
          </Button>
        </div>

        <div className="relative h-[calc(100dvh-3rem)] sm:h-[calc(88vh-48px)] overflow-auto">
          <div className="mx-auto max-w-[1200px] px-3 sm:px-6 py-4 sm:py-6">
            <div className="w-full flex justify-center">
              <div className="relative inline-block bg-white rounded-lg shadow border border-black/5 p-0 print:scale-100 w-[800px] max-w-full">
                <div ref={contentRef} className="p-0">
                  {/* Label first, then packing slip */}
                  <div className="p-4 print:p-0">
                    <div className="text-sm font-medium mb-2 print:hidden">Shipping Label</div>
                    <div style={{ breakAfter: "page" }}>
                      <canvas ref={canvasRef} className="w-full h-auto bg-white" />
                    </div>
                    {rendering && (
                      <p className="mt-2 text-xs text-gray-500 print:hidden">Rendering label…</p>
                    )}
                  </div>
                  <div className="h-px bg-gray-200 print:hidden" />
                  <div className="p-0 print:p-0">
                    {loading && (
                      <p className="p-8 text-center text-sm text-gray-600">Loading order details…</p>
                    )}
                    {!loading && order && <PackingSlip order={order} />}
                    {!loading && !order && (
                      <p className="p-8 text-center text-sm text-red-600">Could not load order details.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
