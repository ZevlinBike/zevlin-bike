"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@/lib/schema";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addOrUpdateProduct } from "../actions";
import { createClient } from "@/lib/supabase/client";

interface ProductFormProps {
  product?: Product & { product_images: { id: string, url: string }[] } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductForm({ product, isOpen, onClose }: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name")
        .eq("active", true)
        .order("sort_order");
      if (!error && data) setCategories(data as { id: string; name: string }[]);
    };
    loadCategories();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);
      
      const urls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (imageFiles.length === 0 && !product) {
      toast.error("Please select at least one image for the new product.");
      return;
    }
    
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    startTransition(async () => {
      const result = await addOrUpdateProduct(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Product ${product ? 'updated' : 'added'} successfully!`);
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-neutral-900 text-black dark:text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update the details for this product." : "Fill out the form to add a new product."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <input type="hidden" name="id" defaultValue={product?.id} />
          
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input id="name" name="name" defaultValue={product?.name} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={product?.description || ''} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (Cents)</Label>
              <Input id="price" name="price" type="number" defaultValue={product?.price_cents} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
              <Input id="quantity_in_stock" name="quantity_in_stock" type="number" defaultValue={product?.quantity_in_stock ?? 0} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">Category</Label>
            <select
              id="category_id"
              name="category_id"
              defaultValue={product?.category_id ?? ''}
              className="w-full p-2 border rounded-md bg-white dark:bg-neutral-800"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <Input id="slug" name="slug" defaultValue={product?.slug} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-upload">Product Images</Label>
            <Input 
              id="image-upload" 
              type="file" 
              multiple
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Select one or more images to upload.</p>
          </div>

          {/* Shipping fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" name="weight" type="number" min={0} step={0.01} defaultValue={product?.weight ?? 0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_unit">Weight Unit</Label>
              <select
                id="weight_unit"
                name="weight_unit"
                defaultValue={product?.weight_unit ?? 'g'}
                className="w-full p-2 border rounded-md bg-white dark:bg-neutral-800"
              >
                <option value="g">g</option>
                <option value="oz">oz</option>
                <option value="lb">lb</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="length_cm">Length (cm)</Label>
              <Input id="length_cm" name="length_cm" type="number" min={0} step={0.1} defaultValue={product?.length_cm ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width_cm">Width (cm)</Label>
              <Input id="width_cm" name="width_cm" type="number" min={0} step={0.1} defaultValue={product?.width_cm ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height_cm">Height (cm)</Label>
              <Input id="height_cm" name="height_cm" type="number" min={0} step={0.1} defaultValue={product?.height_cm ?? ''} />
            </div>
          </div>

          {(previewUrls.length > 0 || (product?.product_images && product.product_images.length > 0)) && (
            <div>
              <Label>Image Previews</Label>
              <div className="mt-2 grid grid-cols-3 gap-4">
                {product?.product_images.map(img => (
                  <div key={img.id} className="relative">
                    <Image src={img.url} alt="Existing product image" width={150} height={150} className="rounded-md object-cover" />
                  </div>
                ))}
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <Image src={url} alt={`New image ${index + 1} preview`} width={150} height={150} className="rounded-md object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
