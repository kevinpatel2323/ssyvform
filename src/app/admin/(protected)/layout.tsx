import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}

