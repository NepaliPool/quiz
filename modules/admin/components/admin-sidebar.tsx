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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <span className="flex size-8 items-center justify-center rounded-lg border bg-background">
                  <GraduationCap className="size-4" />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">QuizDesk</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin panel
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
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

      <SidebarFooter>
        <NavUser fallbackUser={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
