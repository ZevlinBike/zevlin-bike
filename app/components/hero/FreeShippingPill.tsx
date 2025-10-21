import { Truck } from "lucide-react";

export default function FreeShippingPill() {
  return (
    <div className="relative mb-6 z-30">
      <span
        className="
          absolute left-1/2 -translate-x-1/2 top-24
          inline-flex items-center gap-1.5 rounded-full
          bg-blue-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-blue-700
          shadow-lg shadow-blue-500/20 backdrop-blur-md
          transition-all duration-300 hover:bg-blue-500/20 hover:border-blue-300/50 hover:shadow-blue-400/30
          dark:bg-blue-400/10 dark:text-blue-200 dark:border-blue-300/30
        "
      >
        <Truck className="h-3.5 w-3.5 text-blue-700" />
        <span className="md:hidden">Free Shipping $49+</span>
        <span className="hidden md:inline">
          Free Shipping on orders over $49
        </span>
      </span>
    </div>
  );
}

