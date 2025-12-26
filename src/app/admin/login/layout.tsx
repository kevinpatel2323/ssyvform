import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  // If user is already logged in, redirect to dashboard
  if (user) {
    redirect("/admin");
  }

  return <>{children}</>;
}

