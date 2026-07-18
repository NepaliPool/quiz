"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/auth-client";

export type LandingUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string | null;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function LandingAuthNav({ user }: { user: LandingUser | null }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return null;
  }

  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const dashboardHref = isAdmin ? "/admin" : "/";
  const avatar = user.image ?? undefined;

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        throw new Error(result.error.message ?? "Unable to sign out.");
      }

      toast.success("Signed out.");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <nav className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="relative size-10 rounded-none border p-0"
            aria-label="Account menu"
          >
            <Avatar className="size-9 rounded-none">
              {avatar ? <AvatarImage src={avatar} alt={user.name} /> : null}
              <AvatarFallback className="rounded-none">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56 rounded-none">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <span className="truncate text-sm font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={dashboardHref}>
              <LayoutDashboard />
              Dashboard
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isSigningOut}
            onSelect={(event) => {
              event.preventDefault();
              void handleSignOut();
            }}
          >
            <LogOut />
            {isSigningOut ? "Signing out…" : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
