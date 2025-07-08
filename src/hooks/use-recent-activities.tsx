
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface UserActivity {
  id: string;
  type: "assessment" | "valuation" | "task" | "document";
  title: string;
  date: string;
  description?: string;
  link: string;
}

export function useRecentActivities(limit: number = 5) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivities() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch assessments
        const { data: assessments, error: assessmentsError } = await supabase
          .from('assessments')
          .select('id, company_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (assessmentsError) throw assessmentsError;

        // Fetch valuations
        const { data: valuations, error: valuationsError } = await supabase
          .from('valuations')
          .select('id, company_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (valuationsError) throw valuationsError;

        // Fetch tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('company_tasks')
          .select('id, title, created_at, company_id')
          .eq('is_completed', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (tasksError) throw tasksError;

        // Transform to UserActivity format
        const assessmentActivities: UserActivity[] = (assessments || []).map(assessment => ({
          id: `assessment-${assessment.id}`,
          type: "assessment",
          title: "Myyntikuntoisuuden arviointi suoritettu",
          description: assessment.company_name,
          date: assessment.created_at,
          link: `/assessment?id=${assessment.id}`
        }));

        const valuationActivities: UserActivity[] = (valuations || []).map(valuation => ({
          id: `valuation-${valuation.id}`,
          type: "valuation",
          title: "Arvonmääritys valmistunut",
          description: valuation.company_name,
          date: valuation.created_at,
          link: `/valuation?id=${valuation.id}`
        }));

        const taskActivities: UserActivity[] = (tasks || []).map(task => ({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          description: "Tehtävä suoritettu",
          date: task.created_at,
          link: `/tasks?id=${task.id}`
        }));

        // Combine all activities and sort by date
        const allActivities = [...assessmentActivities, ...valuationActivities, ...taskActivities]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit);

        setActivities(allActivities);
      } catch (err) {
        console.error('Error fetching recent activities:', err);
        setError('Toimenpiteiden lataus epäonnistui.');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, [user, limit]);

  return { activities, loading, error };
}
