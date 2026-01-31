import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardWrapper } from "@/components/dashboard/dashboard-wrapper";
import { Footer } from "@/components/shared/footer";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <DashboardWrapper>
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col">
          <DashboardHeader user={user} profile={profile} />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
          <Footer />
        </div>
      </div>
    </DashboardWrapper>
  );
}
