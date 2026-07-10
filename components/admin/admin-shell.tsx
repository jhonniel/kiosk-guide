"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

interface AdminShellProps {
  session: Session | null;
  children: React.ReactNode;
}

export function AdminShell({ session, children }: AdminShellProps) {
  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-gray-50">
        {session && <AdminSidebar user={session.user} />}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  );
}
