"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BusFront, LayoutDashboard, Route } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
  { href: "/admin/bus-management", label: "Bus Management", icon: <Route /> },
  { href: "/admin/reports", label: "Reports", icon: <BarChart3 /> },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar" side="left">
      <SidebarHeader>
        <Link
          href="/admin/dashboard"
          className={cn(
            "flex items-center gap-2 overflow-hidden rounded-md p-2 text-left text-lg font-semibold text-sidebar-foreground outline-none ring-sidebar-ring transition-all focus-visible:ring-2",
            "group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!p-0"
          )}
        >
          <BusFront className="h-6 w-6 shrink-0" />
          <span className="group-data-[collapsible=icon]:hidden">
            SmartBus Admin
          </span>
          <span className="sr-only">SmartBus Admin</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === link.href}
                tooltip={{ children: link.label }}
              >
                <Link href={link.href}>
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
