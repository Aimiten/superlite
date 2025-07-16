import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Loader2, Check, Edit, Download, AlertCircle, Shield, Clock, Euro, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/hooks/use-company';
import { NDAConfig } from './SmartNDASection';
import ReactMarkdown from 'react-markdown';

interface NDAPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    shareValuation: boolean;
    shareAssessment: boolean;
    selectedDocuments: Array<{ id: string; name: string }>;
    selectedTasks: Array<{ id: string; title: string }>;
    recipientEmail?: string;
  };
  ndaConfig: NDAConfig;
  onConfirm: () => void;
  onEdit?: () => void;
}

export function NDAPreviewModal({
  isOpen,
  onClose,
  shareData,
  ndaConfig,
  onConfirm,
  onEdit
}: NDAPreviewModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [loading, setLoading] = useState(false);
  const [ndaContent, setNdaContent] = useState<string>('');

  useEffect(() => {
    const generate = async () => {
      if (!activeCompany) return;
      
      setLoading(true);
      try {
        const ndaRequest = {
          companyId: activeCompany.id,
          context: 'sharing',
          sharingData: {
            sharedItems: {
              valuation: shareData.shareValuation,
              assessment: shareData.shareAssessment,
              documents: shareData.selectedDocuments,
              tasks: shareData.selectedTasks
            },
            recipientEmail: shareData.recipientEmail
          },
          formData: {
            type: 'unilateral' as const,
            template: ndaConfig.template,
            disclosingParty: {
              name: activeCompany.name,
              businessId: activeCompany.business_id || '',
              address: activeCompany.address || '',
              email: user?.email || ''
            },
            receivingParty: {
              name: shareData.recipientEmail ? `Vastaanottaja (${shareData.recipientEmail})` : 'Tietojen vastaanottaja',
              email: shareData.recipientEmail || ''
            },
            terms: {
              duration: ndaConfig.duration,
              effectiveDate: new Date().toISOString().split('T')[0],
              confidentialInfo: [],
              exceptions: [
                'julkisesti_saatavilla',
                'itsenaisesti_kehitetty',
                'kolmannelta_osapuolelta',
                'lain_vaatima',
                'aiemmin_tiedossa'
              ],
              governingLaw: 'finland',
              disputeResolution: 'court',
              courtLocation: 'Helsinki',
              specificConfidentialInfo: ndaConfig.specificInfo,
              additionalTerms: ndaConfig.additionalTerms
            }
          }
        };

        // Generoi esikatselu Edge Functionilla
        const { data, error } = await supabase.functions.invoke('generate-nda', {
          body: { ...ndaRequest, preview: true }
        });

        if (error) {
          throw error;
        }

        if (data && data.content) {
          setNdaContent(data.content);
        }
      } catch (error) {
        console.error('Error generating NDA preview:', error);
        toast({
          title: 'Virhe',
          description: 'NDA:n esikatselun luominen epäonnistui',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && activeCompany) {
      generate();
    }
  }, [isOpen, shareData, ndaConfig, activeCompany, user?.email, toast]);


  const getDurationLabel = (duration: string) => {
    const labels = {
      '6_months': '6 kuukautta',
      '1_year': '1 vuosi',
      '2_years': '2 vuotta',
      '3_years': '3 vuotta',
      '5_years': '5 vuotta'
    };
    return labels[duration] || duration;
  };

  const getPenaltyLabel = (penalty: string) => {
    if (penalty === 'none') {
      return 'Ei tarkkaa summaa';
    }
    return new Intl.NumberFormat('fi-FI', {
      style: 'currency',
      currency: 'EUR'
    }).format(parseInt(penalty));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-info" />
            </div>
            Salassapitosopimuksen esikatselu
          </DialogTitle>
          <DialogDescription className="mt-2">
            Tarkista sopimuksen sisältö ennen jaon luomista. Vastaanottajan tulee hyväksyä tämä sopimus ennen pääsyä tietoihin.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          {/* Sopimuksen tiedot kortteina */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Card className="p-4 bg-blue-50/50 border-blue-200">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Vastaanottaja</p>
                  <p className="font-medium">
                    {ndaConfig.template === 'sale_process' ? 'Potentiaalinen ostaja' : 
                     ndaConfig.template === 'investment' ? 'Sijoittaja' : 
                     ndaConfig.template === 'partnership' ? 'Yhteistyökumppani' : 'Muu'}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-green-50/50 border-green-200">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Voimassaolo</p>
                  <p className="font-medium">{getDurationLabel(ndaConfig.duration)}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 bg-orange-50/50 border-orange-200">
              <div className="flex items-center gap-3">
                <Euro className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Sopimussakko</p>
                  <p className="font-medium">{getPenaltyLabel(ndaConfig.penalty)}</p>
                </div>
              </div>
            </Card>
          </div>
          
          <Separator />
        </div>

        <div className="px-6">
          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Sopimuksen sisältö
              </h3>
              {ndaContent && (
                <Badge variant="outline" className="text-xs">
                  {ndaContent.split(' ').length} sanaa
                </Badge>
              )}
            </div>
            
            <ScrollArea className="h-[400px] p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-muted-foreground">Generoidaan sopimusta...</p>
                  <p className="text-sm text-muted-foreground mt-1">Tämä kestää noin 5-10 sekuntia</p>
                </div>
              ) : ndaContent ? (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-sm leading-relaxed text-gray-700">
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
                      {ndaContent}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    NDA:n esikatselu epäonnistui. Yritä uudelleen.
                  </AlertDescription>
                </Alert>
              )}
            </ScrollArea>
          </div>
        </div>

        <Separator className="mt-4" />
        
        <DialogFooter className="p-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Sopimus suojaa luottamuksellisia tietojasi</span>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Peruuta
              </Button>
              <Button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Hyväksy sopimus ja luo jako
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}