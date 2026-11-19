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
      <div className="flex min-h-dvh flex-col bg-gray-50 lg:flex-row">
        {session ? <AdminSidebar user={session.user} /> : null}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </SessionProvider>
  );
}
