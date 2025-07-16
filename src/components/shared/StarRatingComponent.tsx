
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Tähtiarviointikomponentti, joka toimii sekä free_calculator_results että free_valuations tauluille
const StarRatingComponent = ({ valuationData, targetTable = "free_calculator_results" }: { 
  valuationData: any;
  targetTable?: "free_calculator_results" | "free_valuations"; 
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [hasRated, setHasRated] = useState<boolean>(false);
  
  const handleRating = (star: number) => {
    if (hasRated) {
      return;
    }
    // Haetaan database_record_id, joka tulee supabasesta tallennetun rivin id:nä
    if (valuationData?.database_record_id) {
      // Tietueen ID supabasessa
      const recordId = valuationData.database_record_id;
      // Tallennetaan ensin paikallisesti, jotta käyttöliittymä päivittyy heti
      setSelectedRating(star);
      setHasRated(true);
      localStorage.setItem(`rating_${recordId}`, star.toString());
      
      // Tallennetaan arvio valittuun tauluun käyttäen tietueen ID:tä
      supabase
        .from(targetTable)
        .update({ rating: star })
        .eq('id', recordId)
        .then((response) => {
          // Vastaus käsitelty ilman konsolilokitusta
        })
        .catch(err => {
          // Virhetilanne käsitelty ilman konsolilokitusta
          // Virhetilanteessa ei kuitenkaan poisteta käyttäjän tekemää arviota käyttöliittymästä
        });
    }
  };
  
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            onMouseEnter={() => !hasRated && setHoveredRating(star)}
            onMouseLeave={() => !hasRated && setHoveredRating(null)}
            disabled={hasRated}
            className={`w-12 h-12 flex items-center justify-center rounded-md border-2 ring-1 ring-border/20 transition-all 
              ${hasRated 
                ? (star <= (selectedRating || 0) 
                    ? 'text-warning border-warning bg-warning/10' 
                    : 'text-muted-foreground border-border') 
                : (hoveredRating !== null 
                    ? (star <= (hoveredRating || 0) 
                        ? 'text-warning border-warning bg-warning/10 hover:ring-2 hover:ring-warning/30 hover:scale-110 cursor-pointer' 
                        : 'text-muted-foreground border-border hover:ring-2 hover:ring-border/30 hover:scale-110 cursor-pointer') 
                    : 'text-muted-foreground border-border hover:ring-2 hover:ring-border/30 hover:scale-110 cursor-pointer'
                )
              }`}
            aria-label={`Anna ${star} tähden arvio`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" stroke="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        ))}
      </div>
      {hasRated && (
        <p className="text-sm text-success font-medium">
          Kiitos arvioinnistasi!
        </p>
      )}
    </>
  );
};

export default StarRatingComponent;
