"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintButton() {
  const onPrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Button
      type="button"
      onClick={onPrint}
      variant="outline"
      size="sm"
      className="gap-2 print:hidden"
      title="Print or save as PDF"
    >
      <Printer className="h-4 w-4" />
      <span className="hidden xs:inline">Print</span>
    </Button>
  );
}

