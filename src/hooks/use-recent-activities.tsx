
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface UserActivity {
  id: string;
  type: "valuation" | "document";
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

        // Fetch valuations
        const { data: valuations, error: valuationsError } = await supabase
          .from('valuations')
          .select('id, company_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (valuationsError) throw valuationsError;

        // Transform to UserActivity format
        const valuationActivities: UserActivity[] = (valuations || []).map(valuation => ({
          id: `valuation-${valuation.id}`,
          type: "valuation",
          title: "Arvonmääritys valmistunut",
          description: valuation.company_name,
          date: valuation.created_at,
          link: `/valuation?id=${valuation.id}`
        }));

        // Set activities (only valuations now)
        setActivities(valuationActivities);
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
