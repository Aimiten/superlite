import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

// Import types
import { ValuationImpactResult } from '../../supabase/functions/_shared/types';

// Import components
import ImprovedValuationTabs from "@/components/valuation/ImprovedValuationTabs";
import CommentsList from "@/components/sharing/CommentList";
import { Comment } from "@/components/sharing/CommentItem";
import SharedDocumentsList from "@/components/sharing/SharedDocumentsList";
import { NDAAcceptanceView } from "@/components/sharing/NDAAcceptanceView";

import { 
  Loader2, Calendar, AlertCircle, Info, FileText, Lock, DollarSign, 
  Building, MessageSquare, Send, BarChart2, 
  CheckCircle, Download, ExternalLink,
  Hash, Users, Factory, Shield
} from "lucide-react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";

// Supabase URL ympäristömuuttujasta
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

interface SharedCompany {
  id: string;
  name: string;
  business_id?: string;
  industry?: string;
  description?: string;
  founded?: string;
  employees?: string;
  website?: string;
  company_type?: string;
}


interface Valuation {
  id: string;
  results: any;
  created_at: string;
}

interface ShareInfo {
  id: string;
  access_level: "read_only" | "comment" | "edit";
  created_at: string;
  expires_at: string | null;
}

interface FinancialInfo {
  available: boolean;
  message?: string;
}

interface DocumentInfo {
  available: boolean;
  documents: any[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  completion_status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
}

interface SharedData {
  share: ShareInfo;
  company: SharedCompany;
  valuation?: Valuation | null;
  financial?: FinancialInfo | null;
  documents?: DocumentInfo | null;
  comments: Comment[];
  tasks?: Task[];
  valuationImpact?: ValuationImpactResult;
}

const SharedView = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [sendingComment, setSendingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // NDA state
  const [requiresNDA, setRequiresNDA] = useState(false);
  const [ndaAccepted, setNdaAccepted] = useState(false);

  // Function to prepare valuation data for ImprovedValuationTabs
  const prepareValuationData = (valuation) => {
    if (!valuation || !valuation.results) return null;

    // Extract SWOT data from companyInfo
    let swotData = null;
    try {
      // SWOT can be in companyInfo.analysisText as JSON text
      if (valuation.results.companyInfo?.analysisText) {
        const parsedData = JSON.parse(valuation.results.companyInfo.analysisText);
        if (parsedData.swot) {
          swotData = {
            strengths: parsedData.swot.vahvuudet || '',
            weaknesses: parsedData.swot.heikkoudet || '',
            opportunities: parsedData.swot.mahdollisuudet || '',
            threats: parsedData.swot.uhat || ''
          };
        }
      }
    } catch (e) {
      console.error("Error parsing SWOT data:", e);
    }

    // latestPeriod is in financialAnalysis.documents[0].financial_periods[0]
    const latestPeriod = valuation.results.financialAnalysis?.documents?.[0]?.financial_periods?.[0] || {};

    return {
      valuationReport: valuation.results.valuationReport || {},
      financialAnalysis: valuation.results.financialAnalysis || {},
      companyInfo: valuation.results.companyInfo || {},
      latestPeriod: latestPeriod,
      companyInfoAnalysis: valuation.results.companyInfoAnalysis || {},
      swotData: swotData
    };
  };

  // Callback for fetching comments - avoids JOIN with profiles table
  const fetchComments = useCallback(async () => {
    if (!shareId) return;

    try {
      setLoadingComments(true);
      console.log("Fetching comments for shareId:", shareId);

      // Modified query to avoid JOIN with profiles table
      const { data, error } = await supabase
        .from('share_comments')
        .select('*') // Only select fields from share_comments table
        .eq('share_id', shareId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }

      if (data) {
        console.log("Received comments data:", data);

        // Transform without depending on profiles data
        const formattedComments: Comment[] = data.map(comment => ({
          id: comment.id,
          share_id: comment.share_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          is_reply_to: comment.is_reply_to,
          // These fields will be populated from elsewhere or left as defaults
          user_name: null, 
          user_email: null,
          is_owner: comment.user_id === user?.id
        }));

        setComments(formattedComments);
      }
    } catch (error) {
      console.error("Error in fetchComments:", error);
    } finally {
      setLoadingComments(false);
    }
  }, [shareId, user?.id]);

  useEffect(() => {
    const checkNDAAndFetchData = async () => {
      if (!shareId) return;

      try {
        setLoading(true);
        setError(null);

        // Ensin tarkista NDA-vaatimus
        const { data: shareInfo, error: shareError } = await supabase
          .from('company_sharing')
          .select('requires_nda, nda_accepted_at')
          .eq('id', shareId)
          .single();

        if (shareError) {
          throw new Error('Jaon tietojen hakeminen epäonnistui');
        }

        // Jos NDA vaaditaan eikä ole hyväksytty, näytä NDA-hyväksyntä
        if (shareInfo.requires_nda && !shareInfo.nda_accepted_at) {
          setRequiresNDA(true);
          setNdaAccepted(false);
          setLoading(false);
          return;
        }

        // Muuten hae jaetut tiedot normaalisti
        const { data, error } = await supabase.functions.invoke('get-shared-company', {
          body: { shareId }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.success && data.data) {
          setSharedData(data.data);
          setRequiresNDA(false);
          setNdaAccepted(true);
        } else {
          throw new Error(data.error || "Virhe jaettujen tietojen haussa");
        }
      } catch (error) {
        console.error("Virhe jaettujen tietojen haussa:", error);
        setError(error instanceof Error ? error.message : "Tuntematon virhe");
      } finally {
        setLoading(false);
      }
    };

    checkNDAAndFetchData();
    fetchComments(); // Fetch comments separately
  }, [shareId, fetchComments]);

  const handleCommentSubmit = async (content: string, replyToId: string | null = null) => {
    if (!shareId || !sharedData || !content.trim() || sharedData.share.access_level === 'read_only') {
      return;
    }

    try {
      setSendingComment(true);

      const { data, error } = await supabase
        .from('share_comments')
        .insert({
          share_id: shareId,
          user_id: user?.id || null,
          content: content.trim(),
          is_reply_to: replyToId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create a properly formatted comment with user info from current user
      const newComment: Comment = {
        id: data.id,
        share_id: data.share_id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        updated_at: data.updated_at,
        is_reply_to: data.is_reply_to,
        user_name: user?.user_metadata?.full_name || null,
        user_email: user?.email || null,
        is_owner: true
      };

      // Add to local state immediately for responsive UI
      setComments(prevComments => [...prevComments, newComment]);

      toast({
        title: replyToId ? "Vastaus lähetetty" : "Kommentti lähetetty",
        description: replyToId 
          ? "Vastauksesi on tallennettu onnistuneesti" 
          : "Kommenttisi on tallennettu onnistuneesti"
      });

      return Promise.resolve();
    } catch (error) {
      console.error("Error sending comment:", error);
      toast({
        title: "Virhe",
        description: "Kommentin lähettäminen epäonnistui. Oletko kirjautunut sisään?",
        variant: "destructive",
      });
      return Promise.reject(error);
    } finally {
      setSendingComment(false);
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/10">
        <div className="w-16 h-16 mb-4 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground">Ladataan jaettuja tietoja...</p>
      </div>
    );
  }

  // Jos NDA vaaditaan eikä ole hyväksytty, näytä NDA-hyväksyntäsivu
  if (requiresNDA && !ndaAccepted && shareId) {
    return (
      <NDAAcceptanceView 
        shareId={shareId}
        onAccept={() => {
          // Lataa data uudelleen NDA:n hyväksymisen jälkeen
          window.location.reload();
        }}
      />
    );
  }

  if (error || !sharedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-muted/10">
        <div className="max-w-lg w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Virhe jaetun sisällön haussa</AlertTitle>
            <AlertDescription>
              {"Jaettua sisältöä ei löydy tai se on vanhentunut."}
            </AlertDescription>
          </Alert>
          <div className="text-center mt-8">
            <p className="text-muted-foreground mb-4">Pahoittelemme, mutta pyydettyä jaettua sisältöä ei voitu näyttää.</p>
            <Button asChild variant="outline">
              <a href="/">Palaa etusivulle</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { share, company, valuation, documents } = sharedData as SharedData;
  const expiresDate = share.expires_at ? new Date(share.expires_at) : null;
  const isExpired = expiresDate && expiresDate < new Date();
  const accessLevelText = 
    share.access_level === 'read_only' ? 'Vain luku' : 
    'Kommentointi sallittu';

  return (
    <div className="min-h-screen bg-muted/10 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
          <div className="p-6 bg-primary text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  <p className="text-primary-foreground/80">Jaettu näkymä</p>
                </div>
              </div>
              <Badge className="bg-white text-primary">{accessLevelText}</Badge>
            </div>
          </div>

          <div className="px-6 py-2 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center space-x-2 text-sm text-primary">
              <Calendar className="h-4 w-4" />
              <span>
                {expiresDate ? (
                  <>
                    Voimassa: {format(expiresDate, 'dd.MM.yyyy', { locale: fi })} asti
                    {isExpired && <span className="ml-2 font-bold text-destructive">(Vanhentunut)</span>}
                  </>
                ) : (
                  'Voimassa toistaiseksi'
                )}
              </span>
            </div>
          </div>

          <Tabs defaultValue="company" className="p-6">
            <TabsList className="mb-6">
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>Perustiedot</span>
              </TabsTrigger>
              {valuation && (
                <TabsTrigger value="valuation" className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  <span>Arvonmääritys</span>
                </TabsTrigger>
              )}
              {documents && (
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Dokumentit</span>
                  {documents.available && documents.documents.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{documents.documents.length}</Badge>
                  )}
                </TabsTrigger>
              )}
              {share.access_level !== 'read_only' && (
                <TabsTrigger value="comments" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Kommentit</span>
                  {comments.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{comments.length}</Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="company">
              <Card className="shadow-neumorphic overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-info/5 border-b border-primary/10">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Building className="h-5 w-5 text-primary" />
                    Yrityksen tiedot
                  </CardTitle>
                  <CardDescription className="text-primary">
                    Perustiedot yrityksestä {company.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6">
                    {/* Ensimmäinen rivi - Y-tunnus ja yhtiömuoto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {company.business_id && (
                        <div className="bg-background p-4 rounded-lg border border-border shadow-neumorphic">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-muted rounded-md">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Y-tunnus</h3>
                          </div>
                          <p className="text-lg font-mono font-medium text-foreground">{company.business_id}</p>
                        </div>
                      )}

                      {company.company_type && (
                        <div className="bg-background p-4 rounded-lg border border-border shadow-neumorphic">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-muted rounded-md">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Yhtiömuoto</h3>
                          </div>
                          <p className="text-lg font-medium text-foreground">
                            {(() => {
                              switch(company.company_type) {
                                case 'osakeyhtiö': return 'Osakeyhtiö';
                                case 'henkilöyhtiö': return 'Henkilöyhtiö';
                                case 'toiminimi': return 'Toiminimi';
                                case 'muu': return 'Muu';
                                default: return company.company_type;
                              }
                            })()}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Toinen rivi - Toimiala */}
                    {company.industry && (
                      <div className="bg-background p-4 rounded-lg border border-border shadow-neumorphic">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-muted rounded-md">
                            <Factory className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">Toimiala</h3>
                        </div>
                        <p className="text-lg font-medium text-foreground">{company.industry}</p>
                      </div>
                    )}

                    {/* Kolmas rivi - Perustaminen ja henkilöstö */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {company.founded && (
                        <div className="bg-background p-4 rounded-lg border border-border shadow-neumorphic">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-muted rounded-md">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Perustettu</h3>
                          </div>
                          <p className="text-lg font-medium text-foreground">{company.founded}</p>
                        </div>
                      )}

                      {company.employees && (
                        <div className="bg-background p-4 rounded-lg border border-border shadow-neumorphic">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-muted rounded-md">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">Henkilöstö</h3>
                          </div>
                          <p className="text-lg font-medium text-foreground">{company.employees}</p>
                        </div>
                      )}
                    </div>

                    {/* Neljäs rivi - Kuvaus */}
                    {company.description && (
                      <div className="bg-background p-4 rounded-lg border border-border shadow-neumorphic">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-muted rounded-md">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">Yrityksen kuvaus</h3>
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-line">{company.description}</p>
                      </div>
                    )}

                    {/* Viides rivi - Verkkosivu */}
                    {company.website && (
                      <div className="bg-background p-4 rounded-lg border border-border shadow-neumorphic">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-primary/10 rounded-md">
                            <ExternalLink className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="text-sm font-semibold text-foreground">Verkkosivu</h3>
                        </div>
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-lg font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          {company.website}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            {valuation && (
              <TabsContent value="valuation">
                <div className="space-y-6">
                  {valuation.results ? (
                    <ImprovedValuationTabs
                      {...prepareValuationData(valuation)}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Arvonmääritystä ei ole saatavilla</h3>
                      <p className="text-muted-foreground">Arvonmäärityksen tuloksia ei ole vielä tallennettu järjestelmään.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}



            {/* Documents tab - updated to use new SharedDocumentsList component */}
            <TabsContent value="documents">
              <SharedDocumentsList 
                documents={documents?.documents || []} 
                companyName={company.name} 
              />
            </TabsContent>

            {/* Comments tab - updated to use new CommentsList component */}
            {share.access_level !== 'read_only' && (
              <TabsContent value="comments">
                <Card>
                  <CardHeader>
                    <CardTitle>Kommentit ja kysymykset</CardTitle>
                    <CardDescription>Kommentit ja kysymykset liittyen yritykseen {company.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[50vh] overflow-hidden">
                      <ScrollArea className="h-[50vh]">
                        <CommentsList
                          comments={comments}
                          shareId={shareId || ""}
                          onCommentSubmit={handleCommentSubmit}
                          isLoading={sendingComment || loadingComments}
                        />
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Tämä on jaettu näkymä {company.name} -yrityksen tiedoista.</p>
          <p className="mt-1">
            Kaikki oikeudet pidätetään &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedView;