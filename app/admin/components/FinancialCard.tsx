"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeClosed } from "lucide-react";

export default function FinancialCard({
  label,
  value,
  currency = true,
}: {
  label: string;
  value: number;
  currency?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const money = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

  return (
    <Card className="w-full shadow-sm hover:shadow transition-shadow border border-gray-200/80 dark:border-neutral-800/80 bg-neutral-200 dark:bg-neutral-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setRevealed((v) => !v)}>
          {revealed ? <Eye /> : <EyeClosed />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${revealed ? '' : 'blur-sm select-none'}`}>
          {currency ? money(value) : value}
        </div>
      </CardContent>
    </Card>
  );
}
