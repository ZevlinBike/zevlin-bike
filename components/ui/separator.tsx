import * as React from "react"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical"
  }
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("shrink-0 bg-border h-[1px] w-full", className, props.orientation === "vertical" ? "h-full w-[1px]" : "h-[1px] w-full")}
    {...props}
  />
))
Separator.displayName = "Separator"

export { Separator }
