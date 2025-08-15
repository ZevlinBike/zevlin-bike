"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deletePackage, setDefaultPackage, updatePackage } from "./actions";
import { Loader2, Edit } from "lucide-react";
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

export function PackageActions({
  pkg,
}: {
  pkg: {
    id: string;
    name: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_g: number;
    is_default: boolean;
  };
}) {
  const [isDefaultPending, startDefaultTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleSetDefault = async () => {
    startDefaultTransition(async () => {
      await setDefaultPackage(pkg.id);
    });
  };

  const handleDelete = async () => {
    startDeleteTransition(async () => {
      await deletePackage(pkg.id);
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => setIsEditOpen(true)}>
          <Edit className="w-4 h-4" />
        </Button>
        {!pkg.is_default && (
          <form action={handleSetDefault}>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={isDefaultPending}
            >
              {isDefaultPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Make Default"
              )}
            </Button>
          </form>
        )}
        <form action={handleDelete}>
          <Button
            type="submit"
            size="sm"
            variant="destructive"
            disabled={isDeletePending}
          >
            {isDeletePending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </Button>
        </form>
      </div>
      <EditPackageDialog
        pkg={pkg}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  );
}

function EditPackageDialog({
  pkg,
  isOpen,
  onClose,
}: {
  pkg: {
    id: string;
    name: string;
    length_cm: number;
    width_cm: number;
    height_cm: number;
    weight_g: number;
  };
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updatePackage(formData);
      onClose();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white text-black">
        <DialogHeader>
          <DialogTitle>Edit Package</DialogTitle>
          <DialogDescription>
            Update the details for this shipping package.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <input type="hidden" name="id" defaultValue={pkg.id} />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              defaultValue={pkg.name}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="length_in" className="text-right">
              L (in)
            </Label>
            <Input
              id="length_in"
              name="length_in"
              type="number"
              step="0.1"
              min="0"
              defaultValue={(pkg.length_cm / 2.54).toFixed(1)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="width_in" className="text-right">
              W (in)
            </Label>
            <Input
              id="width_in"
              name="width_in"
              type="number"
              step="0.1"
              min="0"
              defaultValue={(pkg.width_cm / 2.54).toFixed(1)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="height_in" className="text-right">
              H (in)
            </Label>
            <Input
              id="height_in"
              name="height_in"
              type="number"
              step="0.1"
              min="0"
              defaultValue={(pkg.height_cm / 2.54).toFixed(1)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weight_oz" className="text-right">
              Weight (oz)
            </Label>
            <Input
              id="weight_oz"
              name="weight_oz"
              type="number"
              step="0.1"
              min="0"
              defaultValue={(pkg.weight_g / 28.3495).toFixed(1)}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}