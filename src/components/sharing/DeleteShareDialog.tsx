import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteShareDialogProps {
  shareId: string;
  onDeleteSuccess: (shareId: string) => void;
}

const DeleteShareDialog: React.FC<DeleteShareDialogProps> = ({
  shareId,
  onDeleteSuccess
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDeleteShare = async () => {
    setIsDeleting(true);
    try {
      // Poista ensin jaon kommentit, jotta ei jää orpoja rivejä
      const { error: commentsDeleteError } = await supabase
        .from('share_comments')
        .delete()
        .eq('share_id', shareId);

      if (commentsDeleteError) {
        console.error('Error deleting share comments:', commentsDeleteError);
      }

      // Poista jaon katselulokit
      const { error: viewLogsDeleteError } = await supabase
        .from('share_view_logs')
        .delete()
        .eq('share_id', shareId);

      if (viewLogsDeleteError) {
        console.error('Error deleting share view logs:', viewLogsDeleteError);
      }

      // Poista lopuksi itse jako
      const { error } = await supabase
        .from('company_sharing')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      // Kutsu callback-funktiota
      onDeleteSuccess(shareId);

      toast({
        title: "Jako poistettu",
        description: "Jako on poistettu pysyvästi tietokannasta",
      });

      // Sulje dialogi
      setIsOpen(false);
    } catch (error) {
      console.error('Error deleting share completely:', error);
      toast({
        title: "Virhe",
        description: "Jaon poistaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-destructive border-destructive/20 hover:bg-destructive/5"
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Poista kokonaan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Poista jako kokonaan</DialogTitle>
          <DialogDescription>
            Haluatko varmasti poistaa tämän jaon kokonaan tietokannasta? 
            Kaikki jakoon liittyvät kommentit ja tiedot poistetaan pysyvästi.
          </DialogDescription>
        </DialogHeader>
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Varoitus</AlertTitle>
          <AlertDescription>
            Tätä toimintoa ei voi peruuttaa. Jako ja siihen liittyvät tiedot poistetaan pysyvästi.
          </AlertDescription>
        </Alert>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteShare}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Poista pysyvästi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteShareDialog;