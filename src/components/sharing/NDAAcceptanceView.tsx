import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, Loader2, Check, AlertCircle, Building, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { validateSignerInfo } from '@/utils/nda-validation';

interface NDAAcceptanceViewProps {
  shareId: string;
  onAccept: () => void;
}

interface ShareInfo {
  company_name: string;
  nda_template: string;
  nda_config: Record<string, unknown>;
  nda_document_id: string;
  created_at: string;
  expires_at: string | null;
  share_basic_info: boolean;
  share_financial_info: boolean;
  share_documents: boolean;
  share_tasks: boolean;
  shared_documents?: Array<{id: string; name?: string}>;
  shared_tasks?: string[];
}

interface NDADocument {
  content_markdown: string;
  disclosing_party: Record<string, unknown>;
  receiving_party: Record<string, unknown>;
  terms: Record<string, unknown>;
}

export function NDAAcceptanceView({ shareId, onAccept }: NDAAcceptanceViewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [ndaDocument, setNdaDocument] = useState<NDADocument | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  
  // Hyväksyjän tiedot
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    email: '',
    company: '',
    title: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Hae jaon tiedot
        const { data: share, error: shareError } = await supabase
          .from('company_sharing')
          .select(`
            company_id,
            companies (name),
            nda_template,
            nda_config,
            nda_document_id,
            created_at,
            expires_at,
            share_basic_info,
            share_financial_info,
            share_documents,
            share_tasks,
            shared_documents,
            shared_tasks
          `)
          .eq('id', shareId)
          .single();

        if (shareError) throw shareError;

        const shareData: ShareInfo = {
          company_name: share.companies?.name || 'Yritys',
          nda_template: share.nda_template,
          nda_config: share.nda_config,
          nda_document_id: share.nda_document_id,
          created_at: share.created_at,
          expires_at: share.expires_at,
          share_basic_info: share.share_basic_info,
          share_financial_info: share.share_financial_info,
          share_documents: share.share_documents,
          share_tasks: share.share_tasks,
          shared_documents: share.shared_documents,
          shared_tasks: share.shared_tasks
        };

        setShareInfo(shareData);

        // Hae NDA-dokumentti
        if (share.nda_document_id) {
          const { data: nda, error: ndaError } = await supabase
            .from('nda_documents')
            .select('content_markdown, disclosing_party, receiving_party, terms')
            .eq('id', share.nda_document_id)
            .single();

          if (ndaError) throw ndaError;

          setNdaDocument(nda);
          
          // Aseta markdown-sisältö
          if (nda.content_markdown) {
            setNdaDocument({
              ...nda,
              content_markdown: nda.content_markdown
            });
          }
        }
      } catch (error) {
        console.error('Error loading NDA info:', error);
        toast({
          title: 'Virhe',
          description: 'NDA:n lataaminen epäonnistui',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [shareId, toast]);


  const handleAccept = async () => {
    // Validoi tiedot
    if (!acceptedTerms) {
      toast({
        title: 'Hyväksy ehdot',
        description: 'Sinun tulee hyväksyä salassapitosopimuksen ehdot',
        variant: 'destructive'
      });
      return;
    }

    // Validoi allekirjoittajan tiedot
    const validation = validateSignerInfo(signerInfo);
    if (!validation.success) {
      toast({
        title: 'Tarkista tiedot',
        description: validation.errors?.[0]?.message || 'Virheelliset tiedot',
        variant: 'destructive'
      });
      return;
    }

    setAccepting(true);
    try {
      // Käytä Edge Functionia turvalliseen NDA:n hyväksyntään
      const { data, error } = await supabase.functions.invoke('accept-nda', {
        body: { 
          shareId, 
          signerInfo 
        }
      });

      if (error) throw error;

      toast({
        title: 'NDA hyväksytty',
        description: 'Salassapitosopimus on hyväksytty onnistuneesti'
      });

      // Ohjaa eteenpäin
      onAccept();
    } catch (error) {
      console.error('Error accepting NDA:', error);
      toast({
        title: 'Virhe',
        description: 'NDA:n hyväksyminen epäonnistui',
        variant: 'destructive'
      });
    } finally {
      setAccepting(false);
    }
  };

  const getSharedItemsList = () => {
    const items = [];
    if (shareInfo?.share_financial_info) items.push('Arvonmääritys');
    if (shareInfo?.share_basic_info) items.push('Myyntikunto-analyysi');
    if (shareInfo?.share_documents && shareInfo.shared_documents) {
      items.push(`${shareInfo.shared_documents.length} dokumenttia`);
    }
    if (shareInfo?.share_tasks && shareInfo.shared_tasks) {
      items.push(`${shareInfo.shared_tasks.length} tehtävää`);
    }
    return items;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Ladataan salassapitosopimusta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="border-2">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Salassapitosopimus vaaditaan</CardTitle>
            <CardDescription className="text-base mt-2">
              Ennen kuin voit nähdä jaetut tiedot, sinun tulee hyväksyä salassapitosopimus
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Jaon tiedot */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Tietojen jakaja
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Yritys:</span>{' '}
                  <span className="font-medium">{shareInfo?.company_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Jaettu:</span>{' '}
                  <span className="font-medium">
                    {shareInfo && format(new Date(shareInfo.created_at), 'dd.MM.yyyy HH:mm', { locale: fi })}
                  </span>
                </div>
                {shareInfo?.expires_at && (
                  <div>
                    <span className="text-muted-foreground">Voimassa:</span>{' '}
                    <span className="font-medium">
                      {format(new Date(shareInfo.expires_at), 'dd.MM.yyyy', { locale: fi })} asti
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Jaettavat tiedot */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Jaettavat tiedot
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {getSharedItemsList().map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* NDA-sopimus */}
            <div>
              <h3 className="font-semibold mb-3">Salassapitosopimus</h3>
              <ScrollArea className="h-[400px] border rounded-lg p-4 bg-white">
                {ndaDocument?.content_markdown ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        // Rajoita sallitut elementit turvallisuuden vuoksi
                        h1: ({children}) => <h1 className="text-xl font-bold mb-4">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-bold mb-3">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-bold mb-2">{children}</h3>,
                        p: ({children}) => <p className="mb-4">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside mb-4">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
                        li: ({children}) => <li className="mb-1">{children}</li>,
                        strong: ({children}) => <strong className="font-bold">{children}</strong>,
                        em: ({children}) => <em className="italic">{children}</em>,
                        // Estä vaaralliset elementit
                        img: () => null,
                        script: () => null,
                        iframe: () => null,
                        a: ({children}) => <span className="text-blue-600 underline">{children}</span>
                      }}
                    >
                      {ndaDocument.content_markdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Salassapitosopimusta ei voitu ladata. Yritä päivittää sivu.
                    </AlertDescription>
                  </Alert>
                )}
              </ScrollArea>
            </div>

            <Separator />

            {/* Hyväksyjän tiedot */}
            <div className="space-y-4">
              <h3 className="font-semibold">Hyväksyjän tiedot</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nimi *</Label>
                  <Input
                    id="name"
                    value={signerInfo.name}
                    onChange={(e) => setSignerInfo({ ...signerInfo, name: e.target.value })}
                    placeholder="Etunimi Sukunimi"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Sähköposti *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signerInfo.email}
                    onChange={(e) => setSignerInfo({ ...signerInfo, email: e.target.value })}
                    placeholder="nimi@yritys.fi"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Yritys</Label>
                  <Input
                    id="company"
                    value={signerInfo.company}
                    onChange={(e) => setSignerInfo({ ...signerInfo, company: e.target.value })}
                    placeholder="Yritys Oy"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Asema/titteli</Label>
                  <Input
                    id="title"
                    value={signerInfo.title}
                    onChange={(e) => setSignerInfo({ ...signerInfo, title: e.target.value })}
                    placeholder="Toimitusjohtaja"
                  />
                </div>
              </div>

              {/* Hyväksyntä */}
              <div className="flex items-start space-x-2 pt-4">
                <Checkbox
                  id="accept-terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <Label 
                  htmlFor="accept-terms" 
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  Hyväksyn yllä olevan salassapitosopimuksen ehdot ja sitoudun noudattamaan niitä
                </Label>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between pt-6">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Hyväksyntä tallennetaan: {format(new Date(), 'dd.MM.yyyy HH:mm:ss', { locale: fi })}
              </span>
            </div>
            
            <Button 
              onClick={handleAccept}
              disabled={!acceptedTerms || !signerInfo.name || !signerInfo.email || accepting}
              size="lg"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Hyväksytään...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Hyväksy ja jatka
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Footer info */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Hyväksymällä salassapitosopimuksen vahvistat, että sinulla on oikeus sitoutua sopimukseen
            {signerInfo.company && ` yrityksen ${signerInfo.company} puolesta`}.
          </p>
        </div>
      </div>
    </div>
  );
}