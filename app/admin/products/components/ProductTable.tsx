"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Product } from "@/lib/schema";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import ProductForm from "./ProductForm";
import { toast } from "sonner";
import { deleteProduct } from "../actions";

type ProductWithImages = Product & { product_images: { url: string }[] };

export default function ProductTable({ products: initialProducts }: { products: ProductWithImages[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithImages | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: ProductWithImages) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setProducts(products.filter(p => p.id !== productId));
        toast.success("Product deleted successfully!");
      }
    });
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddProduct}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Image
                    src={product.product_images?.[0]?.url || "/images/placeholder.png"}
                    alt={product.name}
                    width={100}
                    height={100}
                    className="rounded-md object-contain aspect-square"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>${(product.price_cents / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(product.id)} disabled={isPending}>
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
