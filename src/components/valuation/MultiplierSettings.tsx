import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, ChevronDown, Info, HelpCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MultiplierSettings as MultiplierSettingsType, validateCustomMultipliers } from "@/types/multipliers";
import { useToast } from "@/hooks/use-toast";

interface MultiplierSettingsProps {
  onSettingsChange: (settings: MultiplierSettingsType) => void;
}

const MultiplierSettings: React.FC<MultiplierSettingsProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [method, setMethod] = useState<'ai' | 'manual'>('ai');
  // Pidetään UI:ssa stringit, mutta lähetetään numeroina
  const [multiplierStrings, setMultiplierStrings] = useState({
    revenue_multiple: '1.5',
    ev_ebit: '8.0',
    ev_ebitda: '6.0',
    p_e: '12.0'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper: muunna stringit numeroiksi
  const getNumericMultipliers = () => ({
    revenue_multiple: parseFloat(multiplierStrings.revenue_multiple) || 1.5,
    ev_ebit: parseFloat(multiplierStrings.ev_ebit) || 8.0,
    ev_ebitda: parseFloat(multiplierStrings.ev_ebitda) || 6.0,
    p_e: parseFloat(multiplierStrings.p_e) || 12.0
  });

  const handleMethodChange = (newMethod: 'ai' | 'manual') => {
    setMethod(newMethod);
    onSettingsChange({
      method: newMethod,
      // Älä lähetä kertoimia heti kun valitaan manual - odota että käyttäjä syöttää arvot
      customMultipliers: undefined
    });
  };

  const validateAndUpdate = (key: string, value: string) => {
    if (value === '') return; // Älä validoi tyhjää
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    // Käytä keskitettyä validointia
    const testMultipliers = { ...getNumericMultipliers(), [key]: numValue };
    const validation = validateCustomMultipliers(testMultipliers);
    
    if (!validation.isValid && validation.field === key) {
      setErrors(prev => ({
        ...prev,
        [key]: validation.error || "Virheellinen arvo"
      }));
    } else {
      // Poista error jos arvo on kelvollinen
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      
      // Ei päivitetä automaattisesti - käyttäjän pitää painaa "Tallenna" nappia
    }
  };

  const handleMultiplierChange = (key: string, inputValue: string) => {
    // Salli vain numerot ja piste
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      // Päivitä UI arvo heti
      setMultiplierStrings(prev => ({ ...prev, [key]: inputValue }));
      
      // Poista error kun käyttäjä kirjoittaa
      if (errors[key]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    }
  };

  const handleBlur = (key: string, value: string) => {
    validateAndUpdate(key, value);
  };

  return (
    <TooltipProvider>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Arvostuskertoimien asetukset (valinnainen)
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Määritä itse arvostuskertoimet tai anna Arvennon analyysityökalun valita ne automaattisesti</p>
          </TooltipContent>
        </Tooltip>
        
        <CollapsibleContent className="mt-4 border rounded-lg p-4 bg-slate-50">
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Arvostuskertoimet</strong> määrittävät kuinka moninkertaisella yrityksen tuloslukuja (liikevaihto, EBIT, EBITDA) 
              kerrotaan yrityksen arvon laskemiseksi. Voit joko antaa Arvennon analyysityökalun valita toimialalle sopivat kertoimet 
              automaattisesti, tai määrittää ne itse jos sinulla on erityistietoa yrityksestä tai toimialasta.
            </AlertDescription>
          </Alert>

          <RadioGroup value={method} onValueChange={handleMethodChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ai" id="ai" />
              <Label htmlFor="ai">Anna Arvennon analyysityökalun valita kertoimet automaattisesti (suositeltu)</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Arvennon analyysityökalu analysoi yrityksen toimialan, koon ja ominaisuudet<br/>
                  ja valitsee sopivat arvostuskertoimet markkinatiedon perusteella</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual">Määritä omat kertoimet</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Syötä itse haluamasi arvostuskertoimet jos sinulla on<br/>
                  erityistietoa yrityksestä tai haluat käyttää tiettyjä arvoja</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </RadioGroup>

          {method === 'manual' && (
            <>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="revenue">Liikevaihtokerroin</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Liikevaihto × kerroin = yrityksen arvo<br/>
                      Tyypillisesti 0.5-3.0 toimialasta riippuen</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input 
                  id="revenue"
                  type="text"
                  placeholder="esim. 1.5"
                  value={multiplierStrings.revenue_multiple}
                  onChange={(e) => handleMultiplierChange('revenue_multiple', e.target.value)}
                  onBlur={(e) => handleBlur('revenue_multiple', e.target.value)}
                  className={errors.revenue_multiple ? 'border-red-500' : ''}
                />
                {errors.revenue_multiple && (
                  <p className="text-red-500 text-xs mt-1">{errors.revenue_multiple}</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="ebit">EV/EBIT-kerroin</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>EBIT × kerroin = yritysarvo (Enterprise Value)<br/>
                      Tyypillisesti 4-15 toimialasta riippuen</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input 
                  id="ebit"
                  type="text"
                  placeholder="esim. 8.0"
                  value={multiplierStrings.ev_ebit}
                  onChange={(e) => handleMultiplierChange('ev_ebit', e.target.value)}
                  onBlur={(e) => handleBlur('ev_ebit', e.target.value)}
                  className={errors.ev_ebit ? 'border-red-500' : ''}
                />
                {errors.ev_ebit && (
                  <p className="text-red-500 text-xs mt-1">{errors.ev_ebit}</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="ebitda">EV/EBITDA-kerroin</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>EBITDA × kerroin = yritysarvo<br/>
                      Tyypillisesti 3-12 toimialasta riippuen</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input 
                  id="ebitda"
                  type="text"
                  placeholder="esim. 6.0"
                  value={multiplierStrings.ev_ebitda}
                  onChange={(e) => handleMultiplierChange('ev_ebitda', e.target.value)}
                  onBlur={(e) => handleBlur('ev_ebitda', e.target.value)}
                  className={errors.ev_ebitda ? 'border-red-500' : ''}
                />
                {errors.ev_ebitda && (
                  <p className="text-red-500 text-xs mt-1">{errors.ev_ebitda}</p>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="pe">P/E-kerroin</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nettotulos × kerroin = oman pääoman arvo<br/>
                      Tyypillisesti 5-25 toimialasta riippuen</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input 
                  id="pe"
                  type="text"
                  placeholder="esim. 12.0"
                  value={multiplierStrings.p_e}
                  onChange={(e) => handleMultiplierChange('p_e', e.target.value)}
                  onBlur={(e) => handleBlur('p_e', e.target.value)}
                  className={errors.p_e ? 'border-red-500' : ''}
                />
                {errors.p_e && (
                  <p className="text-red-500 text-xs mt-1">{errors.p_e}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={() => {
                  const finalValidation = validateCustomMultipliers(getNumericMultipliers());
                  if (finalValidation.isValid) {
                    onSettingsChange({ method: 'manual', customMultipliers: getNumericMultipliers() });
                    toast({
                      title: "Kertoimet tallennettu",
                      description: "Omat arvostuskertoimet on asetettu käyttöön."
                    });
                  } else {
                    toast({
                      title: "Virhe",
                      description: finalValidation.error,
                      variant: "destructive"
                    });
                  }
                }}
                className="w-full"
                disabled={Object.keys(errors).length > 0}
              >
                Tallenna omat kertoimet
              </Button>
            </div>
          </>
          )}
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
};

export default MultiplierSettings;