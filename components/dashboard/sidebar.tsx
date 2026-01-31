"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  FolderKanban,
  CreditCard,
  Settings,
} from "lucide-react";

const navigation = [
  {
    name: "Projects",
    href: "/dashboard",
    icon: FolderKanban,
  },
  {
    name: "Settings",
    href: "/dashboard/settings/account",
    icon: Settings,
  },
  {
    name: "Billing",
    href: "/dashboard/settings/billing",
    icon: CreditCard,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-background md:block">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">NovelWorld</span>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
