"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getOrderById } from "../actions";
import { PackingSlip, OrderDetails } from "./PackingSlip";
import { toast } from "sonner";
import { Printer } from "lucide-react";

export function PrintModal({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: orderDetails?.id,
  });

  useEffect(() => {
    if (open && orderId && !orderDetails) {
      setIsLoading(true);
      getOrderById(orderId)
        .then((data) => {
          if (data) {
            setOrderDetails(data as OrderDetails);
          } else {
            toast.error("Failed to fetch order details.");
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, orderId, orderDetails]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Printer className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Print Packing Slip</DialogTitle>
          <DialogDescription>
            Review the packing slip below. When ready, click the print button.
          </DialogDescription>
        </DialogHeader>
        
        <div ref={componentRef} className="py-4">
          {isLoading && <p className="p-8 text-center">Loading order details...</p>}
          {!isLoading && orderDetails && (
            <div className="rounded-md">
              <PackingSlip order={orderDetails} />
            </div>
          )}
          {!isLoading && !orderDetails && !isLoading && <p>Could not load order details.</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={handlePrint}
            disabled={isLoading || !orderDetails}
          >
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
