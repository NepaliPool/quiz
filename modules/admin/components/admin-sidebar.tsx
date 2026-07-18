"use client";

import {
  BookOpen,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Library,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { QuizDeskLogo } from "@/components/brand/quizdesk-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavUser } from "@/modules/admin/components/nav-user";
import {
  type AdminUser,
  useAdminUserStore,
} from "@/modules/admin/stores/admin-user-store";

const navItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Faculties", href: "/admin/faculties", icon: GraduationCap },
  { title: "Subjects", href: "/admin/subjects", icon: Library },
  { title: "Quizzes", href: "/admin/quizzes", icon: BookOpen },
  { title: "Codes", href: "/admin/codes", icon: KeyRound },
];

export function AdminSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const setUser = useAdminUserStore((state) => state.setUser);

  useEffect(() => {
    setUser(user);
  }, [setUser, user]);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b p-3">
        <Link
          href="/admin"
          className="flex items-center gap-3 outline-none transition-opacity hover:opacity-80 group-data-[collapsible=icon]:justify-center"
        >
          <QuizDeskLogo className="size-11 shrink-0 group-data-[collapsible=icon]:size-9" />
          <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display truncate text-base tracking-tight">
              QuizDesk
            </span>
            <span className="truncate text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Admin
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-[0.14em] uppercase">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className="rounded-none"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <NavUser fallbackUser={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
