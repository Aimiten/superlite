import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, AlertCircle, Info, FileText, Lock, DollarSign, Building, MessageSquare, Send, ClipboardCheck, BarChart2 } from "lucide-react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";

interface SharedCompany {
  id: string;
  name: string;
  business_id?: string;
  industry?: string;
  description?: string;
  founded?: string;
  employees?: string;
  website?: string;
}

interface Assessment {
  id: string;
  results: any;
  created_at: string;
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

interface Comment {
  id: string;
  share_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

interface SharedData {
  share: ShareInfo;
  company: SharedCompany;
  assessment?: Assessment | null;
  valuation?: Valuation | null;
  financial?: FinancialInfo | null;
  documents?: DocumentInfo | null;
  comments: Comment[];
}

const SharedView = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<SharedData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    const fetchSharedData = async () => {
      if (!shareId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.functions.invoke('get-shared-company', {
          body: { shareId }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data.success && data.data) {
          setSharedData(data.data);
          if (data.data.comments) {
            setComments(data.data.comments);
          }
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
    
    fetchSharedData();
  }, [shareId]);

  const handleSubmitComment = async () => {
    if (!shareId || !sharedData || !newComment.trim() || sharedData.share.access_level === 'read_only') {
      return;
    }
    
    try {
      setSendingComment(true);
      
      const { data, error } = await supabase
        .from('share_comments')
        .insert({
          share_id: shareId,
          user_id: user?.id || null,
          content: newComment.trim()
        })
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      setComments(prev => [...prev, data]);
      setNewComment('');
      
      toast({
        title: "Kommentti lähetetty",
        description: "Kommenttisi on tallennettu onnistuneesti",
      });
    } catch (error) {
      console.error("Virhe kommentin lähettämisessä:", error);
      toast({
        title: "Virhe",
        description: "Kommentin lähettäminen epäonnistui. Oletko kirjautunut sisään?",
        variant: "destructive",
      });
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="w-16 h-16 mb-4 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
        <p className="text-slate-600">Ladataan jaettuja tietoja...</p>
      </div>
    );
  }

  if (error || !sharedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="max-w-lg w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Virhe jaetun sisällön haussa</AlertTitle>
            <AlertDescription>
              {error || "Jaettua sisältöä ei löydy tai se on vanhentunut."}
            </AlertDescription>
          </Alert>
          <div className="text-center mt-8">
            <p className="text-slate-600 mb-4">Pahoittelemme, mutta pyydettyä jaettua sisältöä ei voitu näyttää.</p>
            <Button asChild variant="outline">
              <a href="/">Palaa etusivulle</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { share, company, assessment, valuation, documents } = sharedData as SharedData;
  const expiresDate = share.expires_at ? new Date(share.expires_at) : null;
  const isExpired = expiresDate && expiresDate < new Date();
  const accessLevelText = 
    share.access_level === 'read_only' ? 'Vain luku' : 
    share.access_level === 'comment' ? 'Kommentointi sallittu' : 
    'Muokkaus sallittu';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg mb-8 overflow-hidden">
          <div className="p-6 bg-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">{company.name}</h1>
                  <p className="text-indigo-100">Jaettu näkymä</p>
                </div>
              </div>
              <Badge className="bg-white text-indigo-600">{accessLevelText}</Badge>
            </div>
          </div>
          
          <div className="px-6 py-2 bg-indigo-50 border-b border-indigo-100">
            <div className="flex items-center space-x-2 text-sm text-indigo-800">
              <Calendar className="h-4 w-4" />
              <span>
                {expiresDate ? (
                  <>
                    Voimassa: {format(expiresDate, 'dd.MM.yyyy', { locale: fi })} asti
                    {isExpired && <span className="ml-2 font-bold text-red-500">(Vanhentunut)</span>}
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
              {assessment && (
                <TabsTrigger value="assessment" className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Myyntikunto-analyysi</span>
                </TabsTrigger>
              )}
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
              <Card>
                <CardHeader>
                  <CardTitle>Yrityksen tiedot</CardTitle>
                  <CardDescription>Perustiedot yrityksestä {company.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {company.business_id && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Y-tunnus</h3>
                      <p>{company.business_id}</p>
                    </div>
                  )}
                  
                  {company.industry && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Toimiala</h3>
                      <p>{company.industry}</p>
                    </div>
                  )}
                  
                  {company.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Kuvaus</h3>
                      <p className="whitespace-pre-line">{company.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {company.founded && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Perustettu</h3>
                        <p>{company.founded}</p>
                      </div>
                    )}
                    
                    {company.employees && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Henkilöstö</h3>
                        <p>{company.employees}</p>
                      </div>
                    )}
                  </div>
                  
                  {company.website && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Verkkosivu</h3>
                      <p>
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {assessment && (
              <TabsContent value="assessment">
                <Card>
                  <CardHeader>
                    <CardTitle>Myyntikunto-analyysi</CardTitle>
                    <CardDescription>Yrityksen {company.name} myyntikunto-analyysi</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assessment.results ? (
                      <div className="space-y-4">
                        <p>Analyysin tulokset näkyvät tässä</p>
                        <pre className="bg-slate-50 p-4 rounded text-sm overflow-auto">
                          {JSON.stringify(assessment.results, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Info className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Analyysin tietoja ei ole saatavilla</h3>
                        <p className="text-slate-500">Myyntikunto-analyysin tuloksia ei ole vielä tallennettu järjestelmään.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {valuation && (
              <TabsContent value="valuation">
                <Card>
                  <CardHeader>
                    <CardTitle>Arvonmääritys</CardTitle>
                    <CardDescription>Yrityksen {company.name} arvonmääritys</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {valuation.results ? (
                      <div className="space-y-4">
                        <p>Arvonmäärityksen tulokset näkyvät tässä</p>
                        <pre className="bg-slate-50 p-4 rounded text-sm overflow-auto">
                          {JSON.stringify(valuation.results, null, 2)}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Info className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Arvonmääritystä ei ole saatavilla</h3>
                        <p className="text-slate-500">Arvonmäärityksen tuloksia ei ole vielä tallennettu järjestelmään.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {documents && (
              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Dokumentit</CardTitle>
                    <CardDescription>Jaetut dokumentit yrityksestä {company.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {documents.available && documents.documents.length > 0 ? (
                      <div className="space-y-4">
                        <p>Dokumentit näkyvät tässä</p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Dokumentteja ei ole saatavilla</h3>
                        <p className="text-slate-500">Dokumentteja ei ole jaettu tai niitä ei ole vielä lisätty järjestelmään.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {share.access_level !== 'read_only' && (
              <TabsContent value="comments">
                <Card>
                  <CardHeader>
                    <CardTitle>Kommentit ja kysymykset</CardTitle>
                    <CardDescription>Kommentit ja kysymykset liittyen yritykseen {company.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {comments.length > 0 ? (
                      <div className="space-y-4 mb-6">
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-slate-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="font-medium">{comment.user_id ? "Käyttäjä" : "Vieras"}</div>
                              <div className="text-sm text-slate-500">
                                {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                              </div>
                            </div>
                            <p className="mt-2 whitespace-pre-line">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 mb-6">
                        <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Ei kommentteja</h3>
                        <p className="text-slate-500">Tähän jakoon ei ole vielä jätetty kommentteja.</p>
                      </div>
                    )}
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="text-base font-medium mb-3">Lisää kommentti</h3>
                      {!user && (
                        <Alert className="mb-4">
                          <Info className="h-4 w-4" />
                          <AlertTitle>Kirjautuminen suositeltua</AlertTitle>
                          <AlertDescription>
                            Voit kommentoida kirjautumatta, mutta kirjautumalla kommentit liitetään käyttäjätiliisi.
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="mt-2">
                        <Textarea
                          placeholder="Kirjoita kommentti tai kysymys tähän..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <Button 
                            onClick={handleSubmitComment} 
                            disabled={!newComment.trim() || sendingComment}
                          >
                            {sendingComment ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Lähetetään...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Lähetä kommentti
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
        
        <div className="mt-8 text-center text-sm text-slate-500">
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
