// src/components/tasks/NewTasksNotification.tsx
import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, X } from "lucide-react";

/**
 * Näyttää ilmoituksen kun tehtävät on luotu onnistuneesti.
 * Ilmoitus näytetään vain kerran ja se voidaan sulkea.
 */
const NewTasksNotification: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Tarkista onko sessionStoragessa merkintä uusista tehtävistä
    const newTasksCreated = sessionStorage.getItem('newTasksCreated');
    if (newTasksCreated === 'true') {
      setVisible(true);
      // Poista merkintä heti käytön jälkeen
      sessionStorage.removeItem('newTasksCreated');
    }
  }, []);

  if (!visible) return null;

  return (
    <Alert className="mb-4 relative bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Tehtävät luotu onnistuneesti</AlertTitle>
      <AlertDescription className="text-green-700">
        Tehtävälista on nyt päivitetty ja uudet tehtävät löytyvät alla olevasta listasta ryhmiteltynä kategorioittain. 
        Voit suodattaa tehtäviä ja merkitä niitä valmiiksi, kun olet suorittanut ne.
      </AlertDescription>
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 hover:bg-green-100" 
        onClick={() => setVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};

export default NewTasksNotification;