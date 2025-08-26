"use client";

import { useTransition } from "react";
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
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "../actions";
import { toast } from "sonner";
import { useState } from "react";

type Category = {
  id: string | number;
  name: string;
  slug: string;
  sort_order?: number | null;
  active?: boolean;
  show_in_footer?: boolean;
};

export default function CategoryForm({ category }: { category?: Category }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = category ? await updateCategory(formData) : await createCategory(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(category ? "Category updated" : "Category created");
        setOpen(false);
      }
    });
  };

  const onDelete = () => {
    if (!category) return;
    if (!confirm("Delete this category? Products will be uncategorized.")) return;
    startTransition(async () => {
      const result = await deleteCategory(String(category.id));
      if (result?.error) toast.error(result.error);
      else toast.success("Category deleted");
    });
  };

  return (
    <>
      <Button variant={category ? "ghost" : "default"} size={category ? "sm" : "default"} onClick={() => setOpen(true)} className={category ? "gap-2" : "gap-2"}>
        {category ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {category ? "Edit" : "New Category"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] bg-white dark:bg-neutral-900 text-black dark:text-white">
          <DialogHeader>
            <DialogTitle>{category ? "Edit Category" : "Create Category"}</DialogTitle>
            <DialogDescription>Manage product categories and footer visibility.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            {category && <input type="hidden" name="id" defaultValue={category.id} />}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={category?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={category?.slug} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="sort_order">Sort</Label>
                <Input id="sort_order" name="sort_order" type="number" defaultValue={category?.sort_order ?? 0} />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="active">Active</Label>
                <input id="active" name="active" type="checkbox" defaultChecked={category?.active ?? true} className="h-5 w-5 align-middle" />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="show_in_footer">Show in Footer</Label>
                <input id="show_in_footer" name="show_in_footer" type="checkbox" defaultChecked={category?.show_in_footer ?? true} className="h-5 w-5 align-middle" />
              </div>
            </div>

            <DialogFooter>
              {category && (
                <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending} className="mr-auto gap-2">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
