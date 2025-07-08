// supabase/functions/analyze-sales-readiness/utils/auth-utils.ts

export async function verifyCompanyAccess(supabase: any, companyId: string) {
  // Hae yritys ja sen omistaja
  const { data, error } = await supabase
    .from("companies")
    .select("id, user_id")
    .eq("id", companyId)
    .single();

  if (error || !data) {
    throw new Error(`Yritystä ei löydy tai ei ole käyttöoikeutta: ${error?.message || "Tuntematon virhe"}`);
  }

  return data;
}