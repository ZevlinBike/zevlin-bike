import {
  listPackages,
  createPackage,
} from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { revalidatePath } from "next/cache";
import { PackageActions } from "./PackageActions";

export default async function PackagesPage() {
  const packages = await listPackages();

  async function addPackageAction(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    const length_cm = Number(formData.get("length_cm") || 0);
    const width_cm = Number(formData.get("width_cm") || 0);
    const height_cm = Number(formData.get("height_cm") || 0);
    const weight_g = Number(formData.get("weight_g") || 0);
    if (!name || !length_cm || !width_cm || !height_cm) return;
    await createPackage({ name, length_cm, width_cm, height_cm, weight_g });
    revalidatePath("/admin/settings/packages");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Packages</CardTitle>
          <CardDescription>
            Preset boxes for rate quoting and labels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={addPackageAction}
            className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Small Box" required />
            </div>
            <div>
              <Label htmlFor="length_cm">L (cm)</Label>
              <Input
                id="length_cm"
                name="length_cm"
                type="number"
                step="0.1"
                min="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="width_cm">W (cm)</Label>
              <Input
                id="width_cm"
                name="width_cm"
                type="number"
                step="0.1"
                min="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="height_cm">H (cm)</Label>
              <Input
                id="height_cm"
                name="height_cm"
                type="number"
                step="0.1"
                min="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="weight_g">Pkg Weight (g)</Label>
              <Input
                id="weight_g"
                name="weight_g"
                type="number"
                step="1"
                min="0"
                defaultValue={0}
              />
            </div>
            <div className="sm:col-span-6">
              <Button type="submit">Add Package</Button>
            </div>
          </form>

          <div className="mt-6 space-y-2">
            {packages.map((p: {
              id: string;
              name: string;
              length_cm: number;
              width_cm: number;
              height_cm: number;
              weight_g: number;
              is_default: boolean;
            }) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <div className="text-sm">
                  <div className="font-medium flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.is_default && (
                      <span className="text-xs rounded bg-emerald-100 text-emerald-700 px-2 py-0.5">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {p.length_cm} × {p.width_cm} × {p.height_cm} cm ·{" "}
                    {p.weight_g} g
                  </div>
                </div>
                <PackageActions pkg={p} />
              </div>
            ))}
            {packages.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                No packages yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

