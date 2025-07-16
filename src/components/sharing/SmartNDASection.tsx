import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Edit, Info, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateNDAConfig } from '@/utils/nda-validation';

interface SmartNDASectionProps {
  shareValuation: boolean;
  shareAssessment: boolean;
  selectedDocuments: Array<{ id: string; name: string; type?: string }>;
  selectedTasks: Array<{ id: string; title: string; financial_impact?: boolean }>;
  requiresNDA: boolean;
  onNDAToggle: (enabled: boolean) => void;
  ndaConfig: NDAConfig;
  onNDAConfigChange: (config: NDAConfig) => void;
  onPreviewNDA: () => void;
}

export interface NDAConfig {
  template: 'sale_process' | 'investment' | 'partnership' | 'custom';
  duration: '6_months' | '1_year' | '2_years' | '3_years' | '5_years';
  penalty: 'none' | '5000' | '10000' | '25000' | '50000';
  additionalTerms?: string;
  specificInfo?: string;
}

export function SmartNDASection({
  shareValuation,
  shareAssessment,
  selectedDocuments,
  selectedTasks,
  requiresNDA,
  onNDAToggle,
  ndaConfig,
  onNDAConfigChange,
  onPreviewNDA
}: SmartNDASectionProps) {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);

  // Älykäs NDA-ehdotus
  const getNDASuggestion = () => {
    const reasons = [];
    
    if (shareValuation) {
      reasons.push("arvonmäärityksen");
    }
    if (shareAssessment) {
      reasons.push("myyntikunto-analyysin");
    }
    if (selectedDocuments.some(d => 
      d.type === 'financial' || 
      (d.name && (d.name.toLowerCase().includes('tilinpäätös') ||
      d.name.toLowerCase().includes('talous')))
    )) {
      reasons.push("taloustietoja");
    }
    if (selectedTasks.some(t => t.financial_impact)) {
      reasons.push("taloudellista vaikutusta sisältäviä tehtäviä");
    }
    
    return {
      suggest: reasons.length > 0,
      reason: reasons.length > 0 
        ? `Jaat ${reasons.join(", ")}` 
        : null,
      strength: reasons.length >= 2 ? 'strong' : 'moderate'
    };
  };

  const suggestion = getNDASuggestion();

  // Näytä automaattisesti jos vahva suositus
  useEffect(() => {
    if (suggestion.strength === 'strong' && !requiresNDA) {
      setShowDetails(true);
    }
  }, [suggestion.strength]);

  // Generoi yhteenveto suojatuista tiedoista
  const getProtectedItemsList = () => {
    const items = [];
    if (shareValuation) items.push("Arvonmääritysraportti");
    if (shareAssessment) items.push("Myyntikunto-analyysi");
    if (selectedDocuments.length > 0) {
      items.push(`${selectedDocuments.length} dokumenttia`);
    }
    if (selectedTasks.length > 0) {
      items.push(`${selectedTasks.length} tehtävää`);
    }
    return items.join(", ");
  };

  if (!suggestion.suggest) {
    return null;
  }

  return (
    <Card className={`border-2 ${requiresNDA ? 'border-info bg-info/5' : 'border-info/20'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-info" />
            <CardTitle className="text-base">Suojaa jaettavat tiedot NDA:lla</CardTitle>
            {suggestion.strength === 'strong' && (
              <Badge variant="default" className="bg-info">Suositeltu</Badge>
            )}
          </div>
          <Switch
            checked={requiresNDA}
            onCheckedChange={(checked) => {
              onNDAToggle(checked);
              setShowDetails(checked);
            }}
          />
        </div>
      </CardHeader>
      
      {(requiresNDA || showDetails) && (
        <CardContent className="space-y-4">
          <Alert className="bg-info/10 border-info/20">
            <Info className="h-4 w-4 text-info" />
            <AlertDescription className="text-info">
              {suggestion.reason}. NDA varmistaa että vastaanottaja sitoutuu pitämään tiedot salassa.
            </AlertDescription>
          </Alert>

          {requiresNDA && (
            <>
              {/* NDA-tyyppi valinta */}
              <div className="space-y-2">
                <Label>Vastaanottajan rooli</Label>
                <Select 
                  value={ndaConfig.template} 
                  onValueChange={(value: any) => 
                    onNDAConfigChange({ ...ndaConfig, template: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale_process">
                      <div className="flex items-center gap-2">
                        <span>🏢</span>
                        <div>
                          <div>Potentiaalinen ostaja</div>
                          <div className="text-xs text-muted-foreground">Arvioi yritystä mahdollista kauppaa varten</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="investment">
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        <div>
                          <div>Sijoittaja</div>
                          <div className="text-xs text-muted-foreground">Arvioi sijoitusmahdollisuutta</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="partnership">
                      <div className="flex items-center gap-2">
                        <span>🤝</span>
                        <div>
                          <div>Yhteistyökumppani</div>
                          <div className="text-xs text-muted-foreground">Kartoittaa yhteistyömahdollisuuksia</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <span>📄</span>
                        <div>
                          <div>Muu vastaanottaja</div>
                          <div className="text-xs text-muted-foreground">Määrittele itse tarkoitus</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Salassapidon kesto */}
              <div className="space-y-2">
                <Label>Salassapitovelvollisuuden kesto</Label>
                <Select 
                  value={ndaConfig.duration} 
                  onValueChange={(value: any) => 
                    onNDAConfigChange({ ...ndaConfig, duration: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6_months">6 kuukautta</SelectItem>
                    <SelectItem value="1_year">1 vuosi</SelectItem>
                    <SelectItem value="2_years">2 vuotta (suositeltu)</SelectItem>
                    <SelectItem value="3_years">3 vuotta (yrityskaupat)</SelectItem>
                    <SelectItem value="5_years">5 vuotta (erityistilanteet)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sopimussakko */}
              <div className="space-y-2">
                <Label>Sopimussakko</Label>
                <Select 
                  value={ndaConfig.penalty} 
                  onValueChange={(value: any) => 
                    onNDAConfigChange({ ...ndaConfig, penalty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div>
                        <div>Ei tarkkaa summaa</div>
                        <div className="text-xs text-muted-foreground">Rikkomus johtaa vahingonkorvaukseen</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="5000">5,000 EUR (kevyt)</SelectItem>
                    <SelectItem value="10000">10,000 EUR (normaali)</SelectItem>
                    <SelectItem value="25000">25,000 EUR (merkittävä)</SelectItem>
                    <SelectItem value="50000">50,000 EUR (kriittinen tieto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Lisätiedot */}
              <div className="space-y-2">
                <Label>Erityisehdot (valinnainen)</Label>
                <Textarea 
                  placeholder="Esim. tietoja saa käyttää vain arviointitarkoitukseen..."
                  value={ndaConfig.additionalTerms || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 1000) {
                      onNDAConfigChange({ ...ndaConfig, additionalTerms: value });
                    } else {
                      toast({
                        title: 'Liian pitkä teksti',
                        description: 'Erityisehdot voivat olla enintään 1000 merkkiä',
                        variant: 'destructive'
                      });
                    }
                  }}
                  rows={3}
                  maxLength={1000}
                />
                <span className="text-xs text-muted-foreground">
                  {(ndaConfig.additionalTerms || '').length}/1000 merkkiä
                </span>
              </div>

              {/* Esikatselu ja yhteenveto */}
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-border">
                  <p className="font-medium text-sm mb-2">NDA suojaa seuraavat tiedot:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {shareValuation && (
                      <li>Arvento-arvonmääritysraportti (DCF-laskelmat, vertailuanalyysi, riskiarvio)</li>
                    )}
                    {shareAssessment && (
                      <li>Myyntikunto-analyysi ja kehitysehdotukset</li>
                    )}
                    {selectedDocuments.length > 0 && (
                      <li>Dokumentit: {selectedDocuments.map(d => d.name || 'Nimetön dokumentti').join(", ")}</li>
                    )}
                    {selectedTasks.length > 0 && (
                      <li>{selectedTasks.length} kehitystehtävää
                        {selectedTasks.some(t => t.financial_impact) && " (sis. taloudellisia vaikutuksia)"}
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const validation = validateNDAConfig(ndaConfig);
                      if (validation.success) {
                        onPreviewNDA();
                      } else {
                        toast({
                          title: 'Tarkista NDA-asetukset',
                          description: validation.errors?.[0]?.message || 'Virheelliset asetukset',
                          variant: 'destructive'
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Esikatsele NDA
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}