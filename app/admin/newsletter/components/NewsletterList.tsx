
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import type { Newsletter, ActionState } from "../actions";
import { sendNewsletter } from "../actions";

interface NewsletterListProps {
  newsletters: Newsletter[];
}

export function NewsletterList({ newsletters }: NewsletterListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {newsletters.map((newsletter) => (
          <TableRow key={newsletter.id}>
            <TableCell>{newsletter.subject}</TableCell>
            <TableCell>
              {new Date(newsletter.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <Button asChild variant="outline" size="sm" className="mr-2">
                <Link href={`/admin/newsletter/edit/${newsletter.id}`}>
                  Edit
                </Link>
              </Button>
              <SendNewsletterForm id={newsletter.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SendNewsletterForm({ id }: { id: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    sendNewsletter,
    { message: "" }
  );

  useEffect(() => {
    if (state?.message) {
      toast(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button variant="outline" size="sm" type="submit" disabled={pending}>
      {pending ? "Sending..." : "Send"}
    </Button>
  );
}
