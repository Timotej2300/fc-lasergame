import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 p-6 lg:p-10 overflow-x-hidden">{children}</div>
    </div>
  );
}
