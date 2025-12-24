"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Printer, X } from "lucide-react";

// Render a single shipping label (PDF) and provide a print action.
// Uses pdf.js to render the first page to a canvas for reliable printing.

import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.mjs";

type Props = {
  labelUrl: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
};

export function LabelPrintModal({ labelUrl, trigger, open: controlledOpen, onOpenChange }: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [labelKind, setLabelKind] = useState<"pdf" | "image" | "unknown">("unknown");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [rendering, setRendering] = useState(false);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "shipping-label",
  });

  // Prepare proxy URL for CORS-safe fetch
  // Build proxy URL on client after mount; avoid SSR window usage
  useEffect(() => {
    if (!open) return;
    try {
      const u = new URL("/api/shipping/label-proxy", window.location.origin);
      u.searchParams.set("url", labelUrl);
      setProxyUrl(u.toString());
    } catch {}
  }, [open, labelUrl]);

  // Fetch label once, sniff type, and prepare data (avoid CORS/URL issues)
  useEffect(() => {
    if (!open || !proxyUrl) return;
    let cancelled = false;
    (async () => {
      try {
        setRendering(true);
        const res = await fetch(proxyUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Proxy ${res.status}`);
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const bytes = new Uint8Array(buf);
        // Magic sniff
        const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
        const iswebp = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
        const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
        if (isPdf || ct.includes("pdf")) {
          setLabelKind("pdf");
          setPdfBytes(bytes);
          if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
        } else if (iswebp || isJpg || ct.startsWith("image/")) {
          setLabelKind("image");
          const url = URL.createObjectURL(new Blob([bytes]));
          if (blobUrl) URL.revokeObjectURL(blobUrl);
          setBlobUrl(url);
          setPdfBytes(null);
        } else {
          setLabelKind("unknown");
          setPdfBytes(null);
          if (blobUrl) { URL.revokeObjectURL(blobUrl); setBlobUrl(null); }
        }
      } catch (e) {
        console.error(e);
        setLabelKind("unknown");
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, proxyUrl, blobUrl]);

  // Render label PDF first page to canvas via pdf.js when we have bytes
  useEffect(() => {
    if (!open || labelKind !== "pdf" || !pdfBytes) return;
    let cancelled = false;
    const run = async () => {
      try {
        setRendering(true);
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
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
        setLabelKind("unknown");
      } finally {
        if (!cancelled) setRendering(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [open, pdfBytes, labelKind]);

  const ready = !rendering;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="default" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Label
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-screen h-[100dvh] p-0 sm:w-[92vw] sm:max-w-2xl sm:h-[88vh] overflow-hidden">
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
              Shipping Label
            </div>
          </DialogTitle>
          <Button size="sm" onClick={handlePrint} disabled={!ready} className="gap-2 text-white">
            <Printer className="h-4 w-4" />
            <span className="hidden xs:inline">Print</span>
          </Button>
        </div>

        <div className="relative h-[calc(100dvh-3rem)] sm:h-[calc(88vh-48px)] overflow-auto">
          <div className="mx-auto max-w-[900px] px-3 sm:px-6 py-4 sm:py-6">
            <div className="w-full flex justify-center">
              <div className="relative inline-block bg-white rounded-lg shadow border border-black/5 p-0 print:scale-100 w-[600px] max-w-full">
                <div ref={contentRef} className="p-4 print:p-0">
                  <div style={{ breakAfter: "page" }}>
                    {labelKind === "pdf" && (
                      <canvas ref={canvasRef} className="w-full h-auto bg-white" />
                    )}
                    {labelKind === "image" && blobUrl && (
                      <img src={blobUrl} alt="Shipping Label" className="w-full h-auto bg-white" />
                    )}
                    {labelKind === "unknown" && (
                      <div className="p-4 text-sm text-gray-600">
                        Unable to preview label. You can
                        {' '}<a className="underline" href={labelUrl} target="_blank" rel="noreferrer">open it in a new tab</a>{' '}
                        to print.
                      </div>
                    )}
                  </div>
                  {rendering && (
                    <p className="mt-2 text-xs text-gray-500 print:hidden">Rendering label…</p>
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
