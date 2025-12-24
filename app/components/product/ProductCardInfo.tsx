import { Badge } from "@/components/ui/badge";
import { AnimatePresence, LegacyAnimationControls, motion } from "framer-motion";
import { Check, Plus, ShoppingBag, X } from "lucide-react"; // Assuming you use lucide-react or similar

export default function ProductCardInfo({
  name = "Unnamed Product",
  quantity_in_stock = 0,
  price_cents = 0,
  description,
  added,
  isOutOfStock,
  handleAddToCart,
  controls,
}: {
  name?: string;
  quantity_in_stock?: number;
  price_cents?: number;
  description?: string;
  added?: boolean;
  isOutOfStock?: boolean;
  handleAddToCart: (e: React.MouseEvent) => void;
  controls: LegacyAnimationControls;
}) {
  const inStock = !!quantity_in_stock && quantity_in_stock > 0;
  
  // improved currency formatting
  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price_cents / 100);

  return (
    <div className="w-full">
      {/* Glass Container 
        - Added ring-1 for a crisp inner border highlight 
        - Increased blur for a premium feel
      */}
      <div
        className={[
          "relative overflow-hidden rounded-b-2xl",
          "bg-white/80 dark:bg-black/60",
          "backdrop-blur-xl saturate-150", // saturate makes colors behind pop
          "border-t border-white/20 dark:border-white/5", // Top separator
          "shadow-lg ring-1 ring-black/5 dark:ring-white/10", // Crisp edges
          "p-4",
        ].join(" ")}
      >
        {/* Header: Name & Price */}
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white leading-tight tracking-tight">
            {name}
          </h3>
          <span className="shrink-0 text-sm sm:text-base font-bold text-neutral-900 dark:text-white tabular-nums tracking-tight">
            {price}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Footer: Stock & Action */}
        <div className="mt-4 flex items-center justify-between gap-3" data-pending-ignore="true">
          {/* Stock Indicator - simplified to be less noisy */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <Badge variant="outline" className="h-6 gap-1.5 px-2 text-[10px] font-medium border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
                </span>
                Sold Out
              </Badge>
            ) : inStock ? (
               <Badge variant="secondary" className="h-6 px-2 whitespace-nowrap bg-neutral-100/80 text-neutral-600 dark:bg-white/10 dark:text-neutral-300 text-[10px] backdrop-blur-md border-0">
                {quantity_in_stock} left
              </Badge>
            ) : null}
          </div>

          {/* Action Button */}
          <motion.button
            data-pending-ignore="true"
            type="button"
            onClick={handleAddToCart}
            animate={controls}
            whileTap={{ scale: 0.96 }}
            disabled={isOutOfStock}
            className={[
              "group relative flex items-center justify-center gap-2",
              "h-9 px-4 rounded-full",
              "text-xs sm:text-sm font-medium transition-all duration-300",
              "shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-400/50",
              added
                ? "bg-emerald-500 text-white w-full sm:w-auto" // Success State
                : isOutOfStock
                ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed w-full sm:w-auto" // Disabled State
                : "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 w-full sm:w-auto hover:bg-neutral-800 dark:hover:bg-neutral-200" // Default State
            ].join(" ")}
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  <span>Added</span>
                </motion.span>
              ) : isOutOfStock ? (
                <span key="no-stock" className="flex items-center gap-1.5">
                   <X className="w-3.5 h-3.5" />
                   <span>No Stock</span>
                </span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 sm:hidden" strokeWidth={3} />
                  <ShoppingBag className="w-3.5 h-3.5 hidden sm:block" strokeWidth={2.5} />
                  <span>Add to Cart</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
