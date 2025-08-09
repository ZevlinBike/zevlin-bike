
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getOrderById } from "../actions";
import { PackingSlip, OrderDetails } from "./PackingSlip";
import { toast } from "sonner";
import { Printer, X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export function PrintModal({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  // UI-only zoom (screen preview). Print resets to 100%.
  const [scale, setScale] = useState(0.9); // mobile-first starting zoom
  const minScale = 0.7;
  const maxScale = 1.15;
  const step = 0.05;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: orderDetails?.id,
  });

  // lazy-load order
  useEffect(() => {
    if (open && orderId && !orderDetails) {
      setIsLoading(true);
      getOrderById(orderId)
        .then((data) => {
          if (data) setOrderDetails(data as OrderDetails);
          else toast.error("Failed to fetch order details.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, orderId, orderDetails]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(maxScale, +(s + step).toFixed(2)));
  }, []);
  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(minScale, +(s - step).toFixed(2)));
  }, []);
  const resetZoom = useCallback(() => setScale(1), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Print packing slip">
          <Printer className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      {/* Full-bleed on mobile, comfy container on desktop */}
      <DialogContent
        className="
          w-screen h-[100dvh] p-0 sm:p-0
          sm:w-[92vw] sm:max-w-4xl sm:h-[88vh]
          overflow-hidden
        "
      >
        {/* Top bar (sticky) */}
        <div className="
          sticky top-0 z-10
          flex items-center justify-between
          h-12 px-3 sm:px-4
          border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:bg-black/90 dark:supports-[backdrop-filter]:bg-black/70
        ">
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
            {orderDetails ? `Packing Slip • ${orderDetails.id.slice(0, 8)}` : "Packing Slip"}
          </div>
        </DialogTitle>
          <Button
            size="sm"
            onClick={handlePrint}
            disabled={isLoading || !orderDetails}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden xs:inline">Print</span>
          </Button>
        </div>

        {/* Scroll area with centered “paper” */}
        <div className="relative h-[calc(100dvh-3rem-56px)] sm:h-[calc(88vh-48px-56px)] overflow-auto ">
          <div className="mx-auto max-w-[1200px] px-3 sm:px-6 py-4 sm:py-6">
            {/* Zoom controls (sticky, mobile-first) */}
            <div className="
              sticky top-2 z-10
              flex items-center gap-2
              w-fit ml-auto
              rounded-full border bg-white/90 dark:bg-black/90 backdrop-blur px-2 py-1
              shadow-sm
            ">
              <button
                onClick={zoomOut}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <div className="min-w-[52px] text-center text-xs tabular-nums">
                {(scale * 100).toFixed(0)}%
              </div>
              <button
                onClick={zoomIn}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={resetZoom}
                className="inline-flex h-8 px-2 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                title="Reset"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </button>
            </div>

            {/* Paper frame */}
            <div className="w-full flex justify-center">
              <div
                className="
                  relative
                  inline-block
                  bg-white
                  rounded-lg shadow-[0_10px_35px_rgba(0,0,0,0.15)]
                  border border-black/5
                  p-0
                  origin-top
                  print:scale-100
                "
                style={{
                  transform: `scale(${scale})`,
                }}
              >
                {/* The element react-to-print will print */}
                <div ref={componentRef} className="p-0">
                  {isLoading && (
                    <p className="p-8 text-center text-sm text-gray-600">Loading order details...</p>
                  )}
                  {!isLoading && orderDetails && (
                    <PackingSlip order={orderDetails} />
                  )}
                  {!isLoading && !orderDetails && (
                    <p className="p-8 text-center text-sm text-red-600">Could not load order details.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

