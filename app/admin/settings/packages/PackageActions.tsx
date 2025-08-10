"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deletePackage, setDefaultPackage } from "./actions";
import { Loader2 } from "lucide-react";

export function PackageActions({
  pkg,
}: {
  pkg: { id: string; is_default: boolean };
}) {
  const [isDefaultPending, startDefaultTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

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
    <div className="flex items-center gap-2">
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
  );
}
