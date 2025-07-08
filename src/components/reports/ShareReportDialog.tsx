
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Copy, Mail, Loader2 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ShareReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
}

export const ShareReportDialog: React.FC<ShareReportDialogProps> = ({ 
  open, 
  onOpenChange,
  companyName = "Yrityksesi"
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Hei,\n\nJaan kanssasi ${companyName} -yrityksen myyntikuntoisuusraportin.\n\nTerveisin`);
  const [allowRecipientToComment, setAllowRecipientToComment] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isLinkGenerated, setIsLinkGenerated] = useState(false);

  const handleShare = async () => {
    if (!email && !shareLink) {
      toast({
        title: "Sähköposti puuttuu",
        description: "Syötä sähköpostiosoite tai generoi jakolinkki",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);

    try {
      // In real implementation, this would call the Supabase function to share the report
      // For now, we'll simulate the API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Raportti jaettu",
        description: email 
          ? `Raportti jaettu osoitteeseen ${email}` 
          : "Jakolinkki kopioitu leikepöydälle",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Sharing failed:", error);
      toast({
        title: "Jakaminen epäonnistui",
        description: "Yritä uudelleen myöhemmin",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const generateShareLink = async () => {
    setIsSharing(true);
    
    try {
      // In real implementation, this would generate a unique link via Supabase
      // For now, we'll create a simulated link
      const demoLink = `https://myyntikuntoisuus.fi/share/${Math.random().toString(36).substring(2, 15)}`;
      setShareLink(demoLink);
      setIsLinkGenerated(true);
      
      await navigator.clipboard.writeText(demoLink);
      
      toast({
        title: "Linkki generoitu",
        description: "Jakolinkki kopioitu leikepöydälle",
      });
    } catch (error) {
      console.error("Link generation failed:", error);
      toast({
        title: "Linkin generointi epäonnistui",
        description: "Yritä uudelleen myöhemmin",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyLinkToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Linkki kopioitu",
        description: "Jakolinkki on nyt leikepöydällä",
      });
    } catch (error) {
      toast({
        title: "Kopiointi epäonnistui",
        description: "Yritä kopioida linkki manuaalisesti",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Jaa raportti</DialogTitle>
          <DialogDescription>
            Jaa myyntikuntoisuusraportti sähköpostilla tai generoi jaettava linkki.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Sähköposti</Label>
            <Input
              id="email"
              type="email"
              placeholder="vastaanottaja@esimerkki.fi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="message">Viesti</Label>
            <textarea
              id="message"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Lisää henkilökohtainen viesti..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="comments" 
              checked={allowRecipientToComment}
              onCheckedChange={(checked) => setAllowRecipientToComment(checked as boolean)}
            />
            <Label htmlFor="comments" className="text-sm font-normal">
              Salli vastaanottajan kommentoida
            </Label>
          </div>
          
          {isLinkGenerated && (
            <div className="flex items-center gap-2 border p-2 rounded-md">
              <Input
                readOnly
                value={shareLink}
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={copyLinkToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isLinkGenerated ? (
            <Button 
              variant="outline" 
              onClick={generateShareLink}
              disabled={isSharing}
            >
              {isSharing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              Generoi jakolinkki
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => {
                setIsLinkGenerated(false);
                setShareLink('');
              }}
            >
              Luo uusi linkki
            </Button>
          )}
          
          <Button 
            onClick={handleShare}
            disabled={isSharing || (!email && !isLinkGenerated)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {isSharing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            {email ? 'Lähetä raportti' : 'Kopioi linkki'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
