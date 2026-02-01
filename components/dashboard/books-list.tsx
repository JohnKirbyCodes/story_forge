"use client";

import Link from "next/link";
import { Book } from "@/types/database";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface BooksListProps {
  books: Book[];
  projectId: string;
}

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  complete: "bg-green-100 text-green-800",
  published: "bg-purple-100 text-purple-800",
};

export function BooksList({ books, projectId }: BooksListProps) {
  if (books.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No books yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first book to start writing.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/dashboard/projects/${projectId}/books/${book.id}`}
          className="block"
        >
          <Card className="h-full transition-colors hover:border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                  {book.subtitle && (
                    <CardDescription>{book.subtitle}</CardDescription>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className={statusColors[book.status as keyof typeof statusColors] || statusColors.draft}
                >
                  {book.status?.replace("_", " ") || "draft"}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
