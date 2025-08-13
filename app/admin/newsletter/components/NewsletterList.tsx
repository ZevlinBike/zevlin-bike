
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
import { Newsletter } from "../actions";

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
              <Button variant="outline" size="sm">
                Resend
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
