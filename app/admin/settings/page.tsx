import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsIndex() {
  return (
    <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Manage shipping presets and other store settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Store Settings</CardTitle>
            <CardDescription>Manage your store&apos;s shipping origin.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/settings/store">
              <Button>Go to Store Settings</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Packages</CardTitle>
            <CardDescription>Manage your shipping packages.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/settings/packages">
              <Button>Go to Packages</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
        </CardContent>
      </Card>
    </div>
  );
}

