
"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/lib/schema";
import {
  PlusCircle, Edit, Trash2, Loader2, Search, ArrowUpDown,
} from "lucide-react";
import ProductForm from "./ProductForm";
import { toast } from "sonner";
import { deleteProduct } from "../actions";
import { clsx } from "clsx";



type SortKey = "name" | "price" | "updated_at";
type SortDir = "asc" | "desc";

export default function ProductTable({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };
  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(productId);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast.success("Product deleted.");
      }
      setDeletingId(null);
    });
  };

  // derived view
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? [...products]
      : products.filter((p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.product_variants?.[0]?.sku ?? "").toLowerCase().includes(q)
        );
    const cmp = (a: Product, b: Product) => {
      let va: string | number = "", vb: string | number = "";
      if (sortKey === "name") { va = a.name; vb = b.name; }
      else { va = a.price_cents; vb = b.price_cents; }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    };
    return list.sort(cmp);
  }, [products, query, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); return; }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const money = (cents: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search name, SKU, or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9 bg-white dark:bg-neutral-900"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-1"
            onClick={() => toggleSort("name")}
            title={`Sort by name (${sortKey === "name" ? sortDir : "asc"})`}
          >
            Name
            <ArrowUpDown className={clsx("h-4 w-4", sortKey === "name" && "opacity-100", sortKey !== "name" && "opacity-60")} />
          </Button>
          <Button
            variant="outline"
            className="h-9 gap-1"
            onClick={() => toggleSort("price")}
            title={`Sort by price (${sortKey === "price" ? sortDir : "asc"})`}
          >
            Price
            <ArrowUpDown className={clsx("h-4 w-4", sortKey === "price" && "opacity-100", sortKey !== "price" && "opacity-60")} />
          </Button>
          <Button onClick={handleAddProduct} className="h-9 gap-2">
            <PlusCircle className="h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      {/* Result meta */}
      <div className="mb-3 text-xs text-gray-600 dark:text-gray-400">
        {filtered.length} {filtered.length === 1 ? "result" : "results"}
      </div>

      {/* Mobile cards */}
      <ul className="sm:hidden space-y-3">
        {filtered.map((product) => {
          const img = product.product_images?.[0]?.url || "/images/placeholder.png";
          return (
            <li
              key={product.id}
              className="rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-800 p-3 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md ring-1 ring-black/5 dark:ring-white/10 bg-white">
                  <Image
                    src={img}
                    alt={product.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/images/placeholder.png";
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium leading-snug line-clamp-2">{product.name}</h3>
                    <div className="text-sm font-semibold tabular-nums">{money(product.price_cents)}</div>
                  </div>
                  {product.product_variants?.[0]?.sku && (
                    <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      SKU: <span className="font-mono">{product.product_variants[0].sku}</span>
                    </div>
                  )}
                  <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    Stock: <span className="font-mono">{product.quantity_in_stock}</span>
                  </div>
                  <div className="mt-3 flex justify-end gap-1">
                    <IconBtn label="Edit" onClick={() => handleEditProduct(product)}>
                      <Edit className="h-4 w-4" />
                    </IconBtn>
                    <IconBtn
                      label="Delete"
                      destructive
                      disabled={isPending && deletingId === product.id}
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      {isPending && deletingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </IconBtn>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && <EmptyState />}
      </ul>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-neutral-800/60">
              <TableHead className="w-[116px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[120px]">Price</TableHead>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead className="w-[120px]">Stock</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((product) => {
              const img = product.product_images?.[0]?.url || "/images/placeholder.png";
              return (
                <TableRow key={product.id} className="align-middle">
                  <TableCell>
                    <div className="w-[84px] h-[84px] overflow-hidden rounded-md ring-1 ring-black/5 dark:ring-white/10 bg-white">
                      <Image
                        src={img}
                        alt={product.name}
                        width={84}
                        height={84}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/images/placeholder.png";
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="line-clamp-2">{product.name}</div>
                  </TableCell>
                  <TableCell className="tabular-nums">{money(product.price_cents)}</TableCell>
                  <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-400">
                    {product.product_variants?.[0]?.sku ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">{product.quantity_in_stock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <IconBtn label="Edit" onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn
                        label="Delete"
                        destructive
                        disabled={isPending && deletingId === product.id}
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        {isPending && deletingId === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </IconBtn>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <EmptyState />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form modal */}
      {isFormOpen && (
        <ProductForm
          product={selectedProduct}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </>
  );
}

/* ---------- tiny bits ---------- */
function IconBtn({
  children, label, onClick, destructive, disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      variant={destructive ? "destructive" : "ghost"}
      size="icon"
      className={clsx(
        "h-8 w-8",
        !destructive && "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-200"
      )}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto max-w-sm">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          No products match your search.
        </div>
        <Separator className="my-4" />
        <div className="flex justify-center">
          <PlusCTA />
        </div>
      </div>
    </div>
  );
}

function PlusCTA() {
  return (
    <Button onClick={() => document.querySelector<HTMLButtonElement>('button:has(svg[data-lucide="plus-circle"])')?.click()} className="gap-2">
      <PlusCircle className="h-4 w-4" />
      Add Product
    </Button>
  );
}

