"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createProfile } from "./actions";
import { Loader2 } from "lucide-react";

export default function CreateProfilePage() {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});

    startTransition(async () => {
      const result = await createProfile(Object.fromEntries(formData.entries()));

      if (result?.errors) {
        setErrors(result.errors);
      }
    });
  };

  return (
    <div className="pt-40 min-h-screen text-gray-900 bg-white dark:text-white dark:bg-neutral-900 pb-20">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                    First Name
                  </label>
                  <Input id="firstName" name="firstName" required />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName[0]}</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                    Last Name
                  </label>
                  <Input id="lastName" name="lastName" required />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName[0]}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <Input id="phone" name="phone" type="tel" />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone[0]}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
                </Button>
                {errors._form && <p className="text-red-500 text-sm mt-1">{errors._form[0]}</p>}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
