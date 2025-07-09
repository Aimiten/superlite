import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Share2, Link as LinkIcon, Copy, CheckCircle, Loader2, User, Calendar, 
  AlertTriangle, ClipboardCheck, Eye, RefreshCcw, X, Clock, MessageSquare,
  FileText, Trash2, Shield
} from "lucide-react";
import { format, addDays } from "date-fns";
import { fi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

// Uudet komponentti-importit
import DocumentSelector from "@/components/sharing/DocumentSelector";
import DeleteShareDialog from "@/components/sharing/DeleteShareDialog"; // Lisätty DeleteShareDialog-komponentti
import { SmartNDASection, NDAConfig } from "@/components/sharing/SmartNDASection";
import { NDAPreviewModal } from "@/components/sharing/NDAPreviewModal";
import { NDAErrorBoundary } from "@/components/sharing/NDAErrorBoundary";

interface Company {
  id: string;
  name: string;
}

interface Assessment {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
}

interface Valuation {
  id: string;
  company_id: string;
  company_name: string;
  created_at: string;
}

interface ShareItem {
  id: string;
  company_id: string;
  company_name: string;
  access_level: "read_only" | "comment";
  share_link: string;
  share_link_password: string | null;
  expires_at: string | null;
  viewed_at: string | null;
  is_active: boolean;
  created_at: string;
  share_assessment: boolean;
  share_valuation: boolean;
  share_documents: boolean;
  share_valuation_impact: boolean;
  shared_with: string | null;
  assessment_id?: string;
  valuation_id?: string;
  requires_nda?: boolean;
  nda_accepted_at?: string | null;
  nda_accepted_by_name?: string | null;
  nda_accepted_by_email?: string | null;
}

interface ShareViewLog {
  id: string;
  share_id: string;
  viewer_ip: string;
  viewer_email: string | null;
  viewed_at: string;
}

interface ShareComment {
  id: string;
  share_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_reply_to: string | null;
  user_name: string | null;
  user_email: string | null;
  is_owner: boolean;
}

type ExtendedBadgeVariant = "default" | "destructive" | "secondary" | "outline" | "success" | "warning";

const SharingManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [selectedValuation, setSelectedValuation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingValuations, setLoadingValuations] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareAssessment, setShareAssessment] = useState(false);
  const [shareValuation, setShareValuation] = useState(false);
  const [shareDocuments, setShareDocuments] = useState(false);
  const [shareValuationImpact, setShareValuationImpact] = useState(false);
  const [accessLevel, setAccessLevel] = useState<"read_only" | "comment">("read_only");
  const [expirationDays, setExpirationDays] = useState<number | null>(15);
  const [shareViewLogs, setShareViewLogs] = useState<Record<string, ShareViewLog[]>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [isDeactivatingShare, setIsDeactivatingShare] = useState<string | null>(null);
  const [isExtendingShare, setIsExtendingShare] = useState<string | null>(null);

  // Uudet tilamuuttujat
  const [selectedDocuments, setSelectedDocuments] = useState<{id: string, source: string, name?: string}[]>([]);
  const [shareCommentCounts, setShareCommentCounts] = useState<Record<string, number>>({});
  const [viewingCommentsForShare, setViewingCommentsForShare] = useState<string | null>(null);
  const [shareComments, setShareComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // NDA-tilamuuttujat
  const [requiresNDA, setRequiresNDA] = useState(false);
  const [ndaConfig, setNdaConfig] = useState<NDAConfig>({
    template: 'sale_process',
    duration: '2_years',
    penalty: 'none'
  });
  const [showNDAPreview, setShowNDAPreview] = useState(false);
  const [generatingNDAPreview, setGeneratingNDAPreview] = useState(false);
  const [ndaPreviewContent, setNdaPreviewContent] = useState<any>(null);
  const [ndaApproved, setNdaApproved] = useState(false);
  
  // Reset states when changing tabs or other major changes
  useEffect(() => {
    // Reset NDA approval when any key selection changes
    setNdaApproved(false);
  }, [selectedCompany, shareValuation, shareAssessment, shareDocuments]);

  // Lisätään funktio, joka poistaa jaon käyttöliittymästä kun se on poistettu tietokannasta
  const handleShareDeleteSuccess = (shareId: string) => {
    setShares(prev => prev.filter(share => share.id !== shareId));

    toast({
      title: "Jako poistettu",
      description: "Jako ja siihen liittyvät tiedot on poistettu pysyvästi",
    });
  };

  // Funktio jaon kommenttien hakemiseen
  const fetchShareComments = async (shareId: string) => {
    setLoadingComments(true);
    setViewingCommentsForShare(shareId);

    try {
      // Ensin tarkistetaan että käyttäjällä on oikeus nähdä tämän jaon kommentit
      // Haetaan jako ja varmistetaan että käyttäjä on jaon omistaja
      const { data: shareData, error: shareError } = await supabase
        .from('company_sharing')
        .select('shared_by')
        .eq('id', shareId)
        .single();

      if (shareError) throw shareError;

      // Tarkistetaan että kirjautunut käyttäjä on jaon omistaja
      if (shareData.shared_by !== user?.id) {
        throw new Error('Ei käyttöoikeutta tämän jaon kommentteihin');
      }

      // Haetaan kommentit ilman joineja
      const { data, error } = await supabase
        .from('share_comments')
        .select('*')
        .eq('share_id', shareId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Formatoidaan kommentit
      const formattedComments: ShareComment[] = (data || []).map(comment => ({
        id: comment.id,
        share_id: comment.share_id,
        user_id: comment.user_id,
        content: comment.content || comment.comment_text, // Huomioidaan eri kenttänimien mahdollisuus
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        is_reply_to: comment.is_reply_to,
        user_name: null, // Haetaan erikseen jos tarvitaan
        user_email: null, // Haetaan erikseen jos tarvitaan
        is_owner: comment.user_id === user?.id
      }));

      setShareComments(formattedComments);
    } catch (error) {
      console.error('Error fetching share comments:', error);
      toast({
        title: "Virhe",
        description: "Kommenttien hakeminen epäonnistui",
        variant: "destructive",
      });
      // Suljetaan dialogi virhetilanteessa
      setViewingCommentsForShare(null);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;

        setCompanies(data || []);
        if (data && data.length > 0) {
          setSelectedCompany(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast({
          title: "Virhe",
          description: "Yritysten hakeminen epäonnistui",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [user, toast]);

  useEffect(() => {
    if (!user || !selectedCompany) return;

    const fetchAssessments = async () => {
      setLoadingAssessments(true);
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('id, company_id, company_name, created_at')
          .eq('company_id', selectedCompany)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAssessments(data || []);
      } catch (error) {
        console.error('Error fetching assessments:', error);
      } finally {
        setLoadingAssessments(false);
      }
    };

    const fetchValuations = async () => {
      setLoadingValuations(true);
      try {
        const { data, error } = await supabase
          .from('valuations')
          .select('id, company_id, company_name, created_at')
          .eq('company_id', selectedCompany)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setValuations(data || []);
      } catch (error) {
        console.error('Error fetching valuations:', error);
      } finally {
        setLoadingValuations(false);
      }
    };

    fetchAssessments();
    fetchValuations();
  }, [user, selectedCompany]);

  useEffect(() => {
    if (!user || !selectedCompany) return;

    const fetchShares = async () => {
      setLoadingShares(true);
      try {
        const { data, error } = await supabase
          .from('company_sharing')
          .select('*, companies(name)')
          .eq('company_id', selectedCompany)
          .eq('shared_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedShares: ShareItem[] = data.map((share: any) => ({
          ...share,
          company_name: share.companies?.name || "Tuntematon yritys",
          share_assessment: share.share_basic_info || false,
          share_valuation: share.share_financial_info || false,
          share_valuation_impact: share.share_valuation_impact || false,
          access_level: share.access_level as "read_only" | "comment"
        }));

        setShares(formattedShares);

        for (const share of formattedShares) {
          fetchShareViewLogs(share.id);
        }

        // Hae kommenttien määrät
        fetchCommentCounts(formattedShares);
      } catch (error) {
        console.error('Error fetching shares:', error);
        toast({
          title: "Virhe",
          description: "Jakojen hakeminen epäonnistui",
          variant: "destructive",
        });
      } finally {
        setLoadingShares(false);
      }
    };

    fetchShares();
  }, [user, selectedCompany, toast]);

  const fetchShareViewLogs = async (shareId: string) => {
    try {
      const { data, error } = await supabase
        .from('share_view_logs')
        .select('*')
        .eq('share_id', shareId)
        .order('viewed_at', { ascending: false });

      if (error) throw error;

      setShareViewLogs(prev => ({
        ...prev,
        [shareId]: data
      }));
    } catch (error) {
      console.error('Error fetching share view logs:', error);
    }
  };

  // Funktio kommenttien määrän hakemiseen
  const fetchCommentCounts = async (shareItems: ShareItem[]) => {
    if (!shareItems || shareItems.length === 0) return;

    try {
      const counts: Record<string, number> = {};

      for (const share of shareItems) {
        const { count, error } = await supabase
          .from('share_comments')
          .select('id', { count: 'exact', head: true })
          .eq('share_id', share.id);

        if (!error) {
          counts[share.id] = count || 0;
        }
      }

      setShareCommentCounts(counts);
    } catch (error) {
      console.error('Error fetching comment counts:', error);
    }
  };

  const handleCreateShare = async () => {
    if (!user || !selectedCompany) return;

    setIsCreatingShare(true);
    try {
      // Debug-tulostukset dokumenttien tallennukselle
      console.log("shareDocuments boolean:", shareDocuments);
      console.log("selectedDocuments:", selectedDocuments);
      console.log("Saving to shared_documents:", JSON.stringify(selectedDocuments));

      const shareId = crypto.randomUUID();
      const shareLink = `${window.location.origin}/shared/${shareId}`;

      const expiresAt = expirationDays 
        ? addDays(new Date(), expirationDays).toISOString() 
        : null;

      // Jos NDA vaaditaan, generoi se ensin
      let ndaDocumentId = null;
      if (requiresNDA) {
        try {
          const { data: companyData } = await supabase
            .from('companies')
            .select('name, business_id, address')
            .eq('id', selectedCompany)
            .single();

          const ndaRequest = {
            companyId: selectedCompany,
            context: 'sharing',
            sharingData: {
              shareId,
              sharedItems: {
                valuation: shareValuation,
                assessment: shareAssessment,
                documents: selectedDocuments
              },
              recipientEmail: shareEmail
            },
            formData: {
              type: 'unilateral',
              template: ndaConfig.template,
              disclosingParty: {
                name: companyData?.name || '',
                businessId: companyData?.business_id || '',
                address: companyData?.address || '',
                email: user.email || ''
              },
              receivingParty: {
                name: shareEmail ? `Vastaanottaja (${shareEmail})` : 'Tietojen vastaanottaja',
                email: shareEmail || ''
              },
              terms: {
                duration: ndaConfig.duration,
                effectiveDate: new Date().toISOString().split('T')[0],
                confidentialInfo: [],
                exceptions: ['julkisesti_saatavilla', 'itsenaisesti_kehitetty', 'kolmannelta_osapuolelta', 'lain_vaatima', 'aiemmin_tiedossa'],
                governingLaw: 'finland',
                disputeResolution: 'court',
                courtLocation: 'Helsinki',
                specificConfidentialInfo: ndaConfig.specificInfo,
                additionalTerms: ndaConfig.additionalTerms
              }
            }
          };

          const { data: ndaResponse, error: ndaError } = await supabase.functions.invoke('generate-nda', {
            body: ndaRequest
          });

          if (ndaError) {
            console.error('NDA generation error:', ndaError);
            toast({
              title: "Huomio",
              description: "NDA:n generointi epäonnistui, mutta jako luodaan ilman NDA:ta",
              variant: "default"
            });
          } else {
            ndaDocumentId = ndaResponse.id;
          }
        } catch (ndaError) {
          console.error('NDA generation failed:', ndaError);
        }
      }

      const { error } = await supabase
        .from('company_sharing')
        .insert({
          id: shareId,
          company_id: selectedCompany,
          shared_by: user.id,
          shared_with: shareEmail || null,
          share_basic_info: shareAssessment,
          share_financial_info: shareValuation,
          share_documents: shareDocuments,
          share_valuation_impact: shareValuationImpact,
          access_level: accessLevel,
          share_link: shareLink,
          expires_at: expiresAt,
          is_active: true,
          assessment_id: shareAssessment && selectedAssessment ? selectedAssessment : null,
          valuation_id: shareValuation && selectedValuation ? selectedValuation : null,
          shared_documents: shareDocuments && selectedDocuments.length > 0 ? selectedDocuments : null,
          // NDA-kentät
          requires_nda: requiresNDA,
          nda_template: requiresNDA ? ndaConfig.template : null,
          nda_config: requiresNDA ? ndaConfig : null,
          nda_document_id: ndaDocumentId
        });

      if (error) throw error;

      // Lähetetään sähköposti-ilmoitus jos vastaanottajan sähköposti on annettu
      if (shareEmail) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const sharedByName = userData?.user?.email || 'Arvento-käyttäjä';

          const { error: emailError } = await supabase.functions.invoke('send-share-notification', {
            body: {
              email: shareEmail,
              message: shareMessage,
              shareLink: shareLink,
              companyName: companies.find(c => c.id === selectedCompany)?.name || 'Yritys',
              sharedBy: sharedByName,
              expiresAt: expiresAt,
              shareDetails: {
                shareAssessment,
                shareValuation,
                shareDocuments,
                shareValuationImpact,
                accessLevel,
                requiresNDA
              }
            }
          });

          if (emailError) {
            console.error('Sähköpostin lähetys epäonnistui:', emailError);
            toast({
              title: "Jako luotu, mutta sähköpostin lähetys epäonnistui",
              description: "Jakolinkki on luotu, mutta ilmoitusta ei voitu lähettää sähköpostilla.",
              variant: "default",
            });
          } else {
            toast({
              title: "Jako luotu ja sähköposti lähetetty",
              description: `Jakolinkki on luotu ja ilmoitus lähetetty osoitteeseen ${shareEmail}`,
            });
          }
        } catch (emailError) {
          console.error('Virhe sähköpostin lähetyksessä:', emailError);
          toast({
            title: "Jako luotu",
            description: "Jakolinkki on luotu, mutta sähköpostin lähetys epäonnistui.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Jako luotu",
          description: "Uusi jako on luotu onnistuneesti",
        });
      }

      const { data: updatedShare, error: fetchError } = await supabase
        .from('company_sharing')
        .select('*, companies(name)')
        .eq('id', shareId)
        .single();

      if (fetchError) throw fetchError;

      const newShare: ShareItem = {
        ...updatedShare,
        company_name: updatedShare.companies?.name || "Tuntematon yritys",
        share_assessment: updatedShare.share_basic_info || false,
        share_valuation: updatedShare.share_financial_info || false,
        share_valuation_impact: updatedShare.share_valuation_impact || false,
        access_level: updatedShare.access_level as "read_only" | "comment"
      };

      setShares(prev => [newShare, ...prev]);

      setShareEmail("");
      setShareMessage("");
      setAccessLevel("read_only");
      setShareAssessment(false);
      setShareValuation(false);
      setShareDocuments(false);
      setShareValuationImpact(false);
      setSelectedDocuments([]);

      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(shareId);
      setTimeout(() => setCopiedLink(null), 3000);

    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: "Virhe",
        description: "Jaon luominen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleDeactivateShare = async (shareId: string) => {
    setIsDeactivatingShare(shareId);
    try {
      const { error } = await supabase
        .from('company_sharing')
        .update({ is_active: false })
        .eq('id', shareId);

      if (error) throw error;

      setShares(prev => prev.map(share => 
        share.id === shareId ? { ...share, is_active: false } : share
      ));

      toast({
        title: "Jako poistettu käytöstä",
        description: "Jako on poistettu käytöstä onnistuneesti",
      });
    } catch (error) {
      console.error('Error deactivating share:', error);
      toast({
        title: "Virhe",
        description: "Jaon poistaminen käytöstä epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsDeactivatingShare(null);
    }
  };

  const handleExtendShare = async (shareId: string, days: number) => {
    setIsExtendingShare(shareId);
    try {
      const { data: share, error: fetchError } = await supabase
        .from('company_sharing')
        .select('expires_at')
        .eq('id', shareId)
        .single();

      if (fetchError) throw fetchError;

      const baseDate = share.expires_at && new Date(share.expires_at) > new Date() 
        ? new Date(share.expires_at) 
        : new Date();

      const newExpiresAt = addDays(baseDate, days).toISOString();

      const { error } = await supabase
        .from('company_sharing')
        .update({ expires_at: newExpiresAt })
        .eq('id', shareId);

      if (error) throw error;

      setShares(prev => prev.map(share => 
        share.id === shareId ? { ...share, expires_at: newExpiresAt } : share
      ));

      toast({
        title: "Jaon voimassaoloa jatkettu",
        description: `Jaon voimassaoloa on jatkettu ${days} päivällä`,
      });
    } catch (error) {
      console.error('Error extending share:', error);
      toast({
        title: "Virhe",
        description: "Jaon voimassaolon jatkaminen epäonnistui",
        variant: "destructive",
      });
    } finally {
      setIsExtendingShare(null);
    }
  };

  const copyShareLink = async (shareLink: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(shareId);
      setTimeout(() => setCopiedLink(null), 3000);

      toast({
        title: "Linkki kopioitu",
        description: "Jakolinkki on kopioitu leikepöydälle",
      });
    } catch (error) {
      console.error('Error copying link:', error);
      toast({
        title: "Virhe",
        description: "Linkin kopioiminen epäonnistui",
        variant: "destructive",
      });
    }
  };

  const getShareStatus = (share: ShareItem) => {
    if (!share.is_active) {
      return { status: 'inactive', label: 'Poistettu käytöstä', color: 'default' as ExtendedBadgeVariant };
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return { status: 'expired', label: 'Vanhentunut', color: 'destructive' as ExtendedBadgeVariant };
    }

    if (!share.viewed_at) {
      return { status: 'pending', label: 'Ei katsottu', color: 'secondary' as ExtendedBadgeVariant };
    }

    return { status: 'active', label: 'Aktiivinen', color: 'outline' as ExtendedBadgeVariant };
  };

  const renderAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'read_only':
        return <Badge variant="outline">Vain luku</Badge>;
      case 'comment':
        return <Badge variant="secondary" className="text-white">Kommentointi sallittu</Badge>;
      default:
        return <Badge variant="outline">Tuntematon</Badge>;
    }
  };

  return (
    <DashboardLayout
      showBackButton={true}
    >
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="create">
          <TabsList className="mb-6">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              <span>Luo uusi jako</span>
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span>Hallitse jakoja</span>
              {shares.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-purple-600 text-white">{shares.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-indigo-600" />
                  Jaa raportteja ja analyysejä
                </CardTitle>
                <CardDescription>
                  Luo jakolinkki arvonmääritysten ja myyntikunto-analyysien jakamiseksi
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="company">Valitse yritys</Label>
                    <Select 
                      value={selectedCompany} 
                      onValueChange={setSelectedCompany}
                      disabled={loading || companies.length === 0}
                    >
                      <SelectTrigger id="company">
                        <SelectValue placeholder="Valitse yritys" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="email">Vastaanottajan sähköposti (valinnainen)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="esim. vastaanottaja@example.com"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Viesti vastaanottajalle (valinnainen)</Label>
                    <Textarea
                      id="message"
                      placeholder="Kirjoita viesti vastaanottajalle..."
                      value={shareMessage}
                      onChange={(e) => setShareMessage(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-base font-medium mb-3">Jaettavat tiedot</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="assessment" 
                          checked={shareAssessment} 
                          onCheckedChange={(checked) => {
                            setShareAssessment(checked as boolean);
                            if (!checked) setSelectedAssessment("");
                          }}
                        />
                        <Label htmlFor="assessment">Myyntikunto-analyysi</Label>
                      </div>

                      {shareAssessment && assessments.length > 0 && (
                        <div className="ml-6 mt-2">
                          <Select 
                            value={selectedAssessment} 
                            onValueChange={setSelectedAssessment}
                            disabled={loadingAssessments || assessments.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Valitse analyysi" />
                            </SelectTrigger>
                            <SelectContent>
                              {assessments.map(assessment => (
                                <SelectItem key={assessment.id} value={assessment.id}>
                                  {format(new Date(assessment.created_at), 'dd.MM.yyyy', { locale: fi })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {shareAssessment && assessments.length === 0 && (
                        <div className="ml-6 mt-2 text-sm text-slate-500">
                          Ei saatavilla olevia myyntikunto-analyysejä
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="valuation" 
                          checked={shareValuation} 
                          onCheckedChange={(checked) => {
                            setShareValuation(checked as boolean);
                            if (!checked) setSelectedValuation("");
                          }}
                        />
                        <Label htmlFor="valuation">Arvonmääritys</Label>
                      </div>

                      {shareValuation && valuations.length > 0 && (
                        <div className="ml-6 mt-2">
                          <Select 
                            value={selectedValuation} 
                            onValueChange={setSelectedValuation}
                            disabled={loadingValuations || valuations.length === 0}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Valitse arvonmääritys" />
                            </SelectTrigger>
                            <SelectContent>
                              {valuations.map(valuation => (
                                <SelectItem key={valuation.id} value={valuation.id}>
                                  {format(new Date(valuation.created_at), 'dd.MM.yyyy', { locale: fi })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {shareValuation && valuations.length === 0 && (
                        <div className="ml-6 mt-2 text-sm text-slate-500">
                          Ei saatavilla olevia arvonmäärityksiä
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="documents" 
                        checked={shareDocuments} 
                        onCheckedChange={(checked) => setShareDocuments(checked as boolean)}
                      />
                      <Label htmlFor="documents">Dokumentit</Label>
                    </div>

                    {shareDocuments && (
                      <div className="ml-6 mt-2">
                        <DocumentSelector 
                          companyId={selectedCompany}
                          selectedDocuments={selectedDocuments}
                          onDocumentsChange={setSelectedDocuments}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="valuationImpact" 
                        checked={shareValuationImpact} 
                        onCheckedChange={(checked) => setShareValuationImpact(checked as boolean)}
                      />
                      <Label htmlFor="valuationImpact">Tehtävien arvovaikutus</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium mb-3">Käyttöoikeudet</h3>
                  <div className="space-y-2">
                    <Label>Käyttöoikeustaso</Label>
                    <Select 
                      value={accessLevel} 
                      onValueChange={(value) => setAccessLevel(value as "read_only" | "comment")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Valitse käyttöoikeustaso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read_only">Vain luku (oletusasetus)</SelectItem>
                        <SelectItem value="comment">Kommentointi sallittu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-medium mb-3">Voimassaolo</h3>
                  <div className="space-y-2">
                    <Label>Voimassaoloaika</Label>
                    <Select 
                      value={expirationDays?.toString() || "null"} 
                      onValueChange={(value) => setExpirationDays(value === "null" ? null : parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Valitse voimassaoloaika" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 päivää</SelectItem>
                        <SelectItem value="15">15 päivää (oletus)</SelectItem>
                        <SelectItem value="30">30 päivää</SelectItem>
                        <SelectItem value="90">90 päivää</SelectItem>
                        <SelectItem value="null">Toistaiseksi voimassa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Smart NDA Section */}
                <NDAErrorBoundary>
                  <SmartNDASection 
                  shareValuation={shareValuation}
                  shareAssessment={shareAssessment}
                  selectedDocuments={selectedDocuments}
                  selectedTasks={[]}
                  requiresNDA={requiresNDA}
                  onNDAToggle={(enabled) => {
                    setRequiresNDA(enabled);
                    setNdaApproved(false); // Reset approval when toggling
                  }}
                  ndaConfig={ndaConfig}
                  onNDAConfigChange={(newConfig) => {
                    setNdaConfig(newConfig);
                    setNdaApproved(false); // Reset approval when config changes
                  }}
                    onPreviewNDA={() => setShowNDAPreview(true)}
                  />
                </NDAErrorBoundary>
                
                {/* NDA approval status */}
                {requiresNDA && ndaApproved && (
                  <Alert className="mt-4">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      NDA on hyväksytty. Voit nyt luoda jaon.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>

              <CardFooter className="flex justify-end">
                <Button
                  onClick={requiresNDA && !ndaApproved ? () => setShowNDAPreview(true) : handleCreateShare}
                  disabled={!selectedCompany || isCreatingShare || 
                    ((!shareAssessment || !selectedAssessment) && 
                     (!shareValuation || !selectedValuation) && 
                     (!shareDocuments || selectedDocuments.length === 0) && 
                     !shareValuationImpact)}
                  className="text-white"
                >
                  {isCreatingShare ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Luodaan...
                    </>
                  ) : requiresNDA && !ndaApproved ? (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Esikatsele ja hyväksy NDA
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      {requiresNDA ? 'Luo jako NDA:lla' : 'Luo jakolinkki'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                  Hallitse jakoja
                </CardTitle>
                <CardDescription>
                  Hallitse olemassa olevia jakoja ja seuraa niiden käyttöä
                </CardDescription>

                {companies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Label className="flex items-center pt-1 pr-2">Yritys:</Label>
                    {companies.map((company) => (
                      <Button
                        key={company.id}
                        variant={selectedCompany === company.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCompany(company.id)}
                        className="text-white"
                      >
                        {company.name}
                      </Button>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {loadingShares ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  </div>
                ) : shares.length === 0 ? (
                  <div className="text-center py-8">
                    <Share2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ei aktiivisia jakoja</h3>
                    <p className="text-slate-500 mb-6">Sinulla ei ole vielä aktiivisia jakoja tälle yritykselle. Siirry takaisin "Luo uusi jako"-välilehdelle</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {shares.map((share) => {
                      const shareStatus = getShareStatus(share);
                      const viewLogs = shareViewLogs[share.id] || [];
                      const isExpired = share.expires_at && new Date(share.expires_at) < new Date();

                      return (
                        <div 
                          key={share.id} 
                          className={`border rounded-lg overflow-hidden ${!share.is_active || isExpired ? 'opacity-70' : ''}`}
                        >
                          <div className="bg-slate-50 p-4 flex justify-between items-center border-b">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant={shareStatus.color}
                              >
                                {shareStatus.label}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                Luotu: {format(new Date(share.created_at), 'dd.MM.yyyy', { locale: fi })}
                              </span>
                              {shareCommentCounts[share.id] > 0 && (
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {shareCommentCounts[share.id]} kommenttia
                                </Badge>
                              )}
                              {share.requires_nda && (
                                <Badge 
                                  variant={share.nda_accepted_at ? "default" : "secondary"}
                                  className={share.nda_accepted_at ? "bg-green-600" : ""}
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  NDA {share.nda_accepted_at ? "hyväksytty" : "odottaa"}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {renderAccessLevelBadge(share.access_level)}
                              {share.is_active && !isExpired && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => copyShareLink(share.share_link, share.id)}
                                >
                                  {copiedLink === share.id ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-slate-500" />
                                  <span>
                                    {share.shared_with || "Jaettu yleisellä linkillä"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                  <LinkIcon className="h-4 w-4 text-slate-500" />
                                  <a 
                                    href={share.share_link} 
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline truncate max-w-[240px]"
                                  >
                                    {share.share_link}
                                  </a>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="h-4 w-4 text-slate-500" />
                                  <span>
                                    {share.expires_at ? (
                                      <>
                                        Voimassa: {format(new Date(share.expires_at), 'dd.MM.yyyy', { locale: fi })} asti
                                        {isExpired && <span className="ml-2 text-red-500">(Vanhentunut)</span>}
                                      </>
                                    ) : (
                                      'Voimassa toistaiseksi'
                                    )}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                  <Eye className="h-4 w-4 text-slate-500" />
                                  <span>
                                    {share.viewed_at ? (
                                      <>
                                        Katsottu: {format(new Date(share.viewed_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                                      </>
                                    ) : (
                                      'Ei vielä katsottu'
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs text-slate-600 mb-4">
                              <Badge variant="outline" className="bg-slate-50">
                                {share.share_assessment ? 'Myyntikunto-analyysi' : 'Ei myyntikunto-analyysiä'}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-50">
                                {share.share_valuation ? 'Arvonmääritys' : 'Ei arvonmääritystä'}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-50">
                                {share.share_documents ? 'Dokumentit' : 'Ei dokumentteja'}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-50">
                                {share.share_valuation_impact ? 'Tehtävien arvovaikutus' : 'Ei tehtävien arvovaikutusta'}
                              </Badge>
                            </div>

                            {/* NDA hyväksyntätiedot */}
                            {share.requires_nda && share.nda_accepted_at && (
                              <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-green-800">NDA hyväksytty</p>
                                    <p className="text-green-700">
                                      {format(new Date(share.nda_accepted_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                                    </p>
                                    {share.nda_accepted_by_name && (
                                      <p className="text-green-700">
                                        Hyväksyjä: {share.nda_accepted_by_name}
                                        {share.nda_accepted_by_email && ` (${share.nda_accepted_by_email})`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="border-t pt-3 flex flex-wrap gap-2">
                              {/* Näytä Esikatsele-nappi aktiivisille jaoille */}
                              {share.is_active && !isExpired && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/shared/${share.id}`} target="_blank">
                                    <Eye className="mr-1 h-4 w-4" />
                                    Esikatsele
                                  </Link>
                                </Button>
                              )}

                              {/* Näytä kommentit -nappi, jos jaossa on kommentteja */}
                              {shareCommentCounts[share.id] > 0 && (
                                <Dialog
                                  open={viewingCommentsForShare === share.id}
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setViewingCommentsForShare(null);
                                    } else {
                                      fetchShareComments(share.id);
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                    >
                                      <MessageSquare className="mr-1 h-4 w-4" />
                                      Kommentit ({shareCommentCounts[share.id]})
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl max-h-[80vh]">
                                    <DialogHeader>
                                      <DialogTitle>Jaon kommentit</DialogTitle>
                                      <DialogDescription>
                                        Kaikki tähän jakoon liittyvät kommentit
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="relative mt-4" style={{ height: "60vh" }}>
                                      <ScrollArea className="h-full w-full">
                                        <div className="pb-4">
                                          {loadingComments ? (
                                            <div className="flex justify-center py-10">
                                              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                            </div>
                                          ) : shareComments.length === 0 ? (
                                            <div className="text-center py-10 text-slate-500">
                                              Ei kommentteja
                                            </div>
                                          ) : (
                                            <div className="space-y-4">
                                              {shareComments.map((comment) => (
                                                <div key={comment.id} className="border rounded-lg p-4">
                                                  <div className="flex justify-between items-start mb-2">
                                                    <div className="font-medium">
                                                      {comment.user_name || 'Kommentin kirjoittaja'}
                                                      {comment.user_email && (
                                                        <span className="text-sm text-slate-500 ml-2">
                                                          ({comment.user_email})
                                                        </span>
                                                      )}
                                                      {comment.is_owner && (
                                                        <Badge variant="outline" className="ml-2 text-xs bg-indigo-50 text-indigo-700">
                                                          Sinä
                                                        </Badge>
                                                      )}
                                                    </div>
                                                    <div className="text-sm text-slate-500">
                                                      {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                                                    </div>
                                                  </div>
                                                  <div className="whitespace-pre-wrap text-slate-700">
                                                    {comment.content}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </ScrollArea>
                                    </div>

                                    <DialogFooter className="mt-4">
                                      <Button
                                        variant="outline"
                                        onClick={() => setViewingCommentsForShare(null)}
                                      >
                                        Sulje
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {share.is_active && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <X className="mr-1 h-4 w-4" />
                                      Poista käytöstä
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Poista jako käytöstä</DialogTitle>
                                      <DialogDescription>
                                        Haluatko varmasti poistaa tämän jaon käytöstä? 
                                        Tämän jälkeen jakolinkkiä ei voi enää käyttää.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <Alert variant="destructive" className="mt-2">
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertTitle>Huomio</AlertTitle>
                                      <AlertDescription>
                                        Tätä toimintoa ei voi peruuttaa.
                                      </AlertDescription>
                                    </Alert>
                                    <DialogFooter className="gap-2 sm:gap-0">
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => handleDeactivateShare(share.id)}
                                        disabled={isDeactivatingShare === share.id}
                                      >
                                        {isDeactivatingShare === share.id ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <X className="mr-2 h-4 w-4" />
                                        )}
                                        Poista käytöstä
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {/* Näytä "Poista kokonaan" -nappi kun jako on poistettu käytöstä */}
                              {!share.is_active && (
                                <DeleteShareDialog 
                                  shareId={share.id}
                                  onDeleteSuccess={handleShareDeleteSuccess}
                                />
                              )}

                              {(share.is_active && (isExpired || share.expires_at)) && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                    >
                                      <RefreshCcw className="mr-1 h-4 w-4" />
                                      Jatka voimassaoloa
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Jatka jaon voimassaoloa</DialogTitle>
                                      <DialogDescription>
                                        Valitse kuinka monta päivää haluat jatkaa tämän jaon voimassaoloa.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleExtendShare(share.id, 15)}
                                        disabled={isExtendingShare === share.id}
                                      >
                                        <Clock className="mr-2 h-4 w-4" />
                                        +15 päivää
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleExtendShare(share.id, 30)}
                                        disabled={isExtendingShare === share.id}
                                      >
                                        <Clock className="mr-2 h-4 w-4" />
                                        +30 päivää
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>

                          {viewLogs.length > 0 && (
                            <div className="bg-slate-50 border-t p-3">
                              <details className="group">
                                <summary className="flex items-center cursor-pointer">
                                  <span className="font-medium text-sm">Katseluhistoria ({viewLogs.length})</span>
                                  <div className="ml-auto transform transition-transform group-open:rotate-180">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                </summary>
                                <div className="pt-3 mt-2 border-t">
                                  <div className="max-h-40 overflow-y-auto text-sm">
                                    {viewLogs.map((log) => (
                                      <div key={log.id} className="flex justify-between items-center py-1">
                                        <span>{format(new Date(log.viewed_at), 'dd.MM.yyyy HH:mm:ss', { locale: fi })}</span>
                                        <span className="text-slate-500 text-xs">{log.viewer_ip}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* NDA Preview Modal */}
      <NDAErrorBoundary>
        <NDAPreviewModal
        isOpen={showNDAPreview}
        onClose={() => setShowNDAPreview(false)}
        shareData={{
          shareValuation,
          shareAssessment,
          selectedDocuments,
          selectedTasks: [],
          recipientEmail: shareEmail
        }}
        ndaConfig={ndaConfig}
        onConfirm={() => {
          setNdaApproved(true);
          setShowNDAPreview(false);
          // Luo jako automaattisesti hyväksynnän jälkeen
          handleCreateShare();
          }}
        />
      </NDAErrorBoundary>
    </DashboardLayout>
  );
};

export default SharingManager;