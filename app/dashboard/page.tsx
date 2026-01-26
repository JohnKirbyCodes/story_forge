import { createClient } from "@/lib/supabase/server";
import { ProjectsList } from "@/components/dashboard/projects-list";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            Create and manage your story universes
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <ProjectsList projects={projects || []} />
    </div>
  );
}
