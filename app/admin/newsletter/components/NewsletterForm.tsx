
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useActionState } from "react";
import type { Newsletter, ActionState } from "../actions";

interface NewsletterFormProps {
  newsletter?: Newsletter;
  action: (
    prevState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
}

export function NewsletterForm({ newsletter, action }: NewsletterFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    { message: "" }
  );

  return (
    <form action={formAction} className="space-y-4">
      {newsletter?.id && <input type="hidden" name="id" value={newsletter.id} />}
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          name="subject"
          defaultValue={newsletter?.subject}
          required
        />
      </div>
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={newsletter?.content}
          required
          rows={10}
        />
      </div>
      <Button type="submit">{newsletter ? "Update" : "Create"} Newsletter</Button>
      {state.message && <p>{state.message}</p>}
    </form>
  );
}
