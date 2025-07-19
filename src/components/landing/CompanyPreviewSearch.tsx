import { useState, useMemo } from "react";
import { Search, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";
import { motion, AnimatePresence } from "framer-motion";

interface CompanyPreviewSearchProps {
  onPreviewFound: (data: any) => void;
}

export function CompanyPreviewSearch({ onPreviewFound }: CompanyPreviewSearchProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(async (value: string) => {
        if (value.length < 3) {
          setStatus("idle");
          return;
        }

        setStatus("loading");
        setError(null);
        setLoadingMessage("Haetaan yritystietoja...");

        // Simulate progress messages
        setTimeout(() => setLoadingMessage("Tarkistetaan YTJ-rekisteri..."), 300);
        setTimeout(() => setLoadingMessage("Analysoidaan taloustietoja..."), 800);

        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/company-preview`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ search: value }),
            }
          );

          if (!response.ok) {
            throw new Error("Yritystä ei löytynyt");
          }

          const data = await response.json();
          setStatus("found");
          onPreviewFound(data);
        } catch (err) {
          setStatus("error");
          setError("Yritystä ei löytynyt. Tarkista nimi tai y-tunnus.");
        }
      }, 500), // Nopeutettu 1000ms → 500ms
    [onPreviewFound]
  );

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Input
          placeholder="Kirjoita yrityksen nimi tai y-tunnus..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            debouncedSearch(e.target.value);
          }}
          className="text-lg py-6 pl-12 pr-12 shadow-neumorphic"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
        
        {status === "loading" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"
          >
            <Loader2 className="animate-spin h-5 w-5 text-primary" />
          </motion.div>
        )}
        
        {status === "found" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500 }}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            <CheckCircle className="h-5 w-5 text-green-500" />
          </motion.div>
        )}
      </div>
      
      <AnimatePresence>
        {status === "loading" && loadingMessage && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="text-sm text-muted-foreground mt-2 text-center"
          >
            {loadingMessage}
          </motion.p>
        )}
        
        {status === "error" && error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive mt-2 text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}