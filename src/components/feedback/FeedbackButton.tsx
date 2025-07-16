import React, { useState, useEffect } from 'react';
import { Bug, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/hooks/use-company';

// Debug data collectors
interface LogEntry {
  type: 'error' | 'warn';
  message: string;
  timestamp: number;
}

interface NetworkError {
  url: string;
  status: number;
  timestamp: number;
}

interface ApiResponse {
  endpoint: string;
  status: 'success' | 'error';
  timestamp: number;
}

// Global collectors
const debugCollectors = {
  consoleLogs: [] as LogEntry[],
  failedRequests: [] as NetworkError[],
  apiResponses: [] as ApiResponse[],
  maxEntries: 20,

  // Console logging capture
  initConsoleCapture() {
    if (typeof window === 'undefined') return;
    
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => {
      this.addConsoleLog('error', args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));
      originalError(...args);
    };
    
    console.warn = (...args: any[]) => {
      this.addConsoleLog('warn', args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' '));
      originalWarn(...args);
    };
  },

  // Network request capture
  initNetworkCapture() {
    if (typeof window === 'undefined') return;
    
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 400) {
          this.addFailedRequest(
            typeof args[0] === 'string' ? args[0] : args[0].url,
            response.status
          );
        }
        return response;
      } catch (error) {
        this.addFailedRequest(
          typeof args[0] === 'string' ? args[0] : args[0].url,
          0
        );
        throw error;
      }
    };
  },

  addConsoleLog(type: 'error' | 'warn', message: string) {
    this.consoleLogs.push({ type, message, timestamp: Date.now() });
    if (this.consoleLogs.length > this.maxEntries) {
      this.consoleLogs.shift();
    }
  },

  addFailedRequest(url: string, status: number) {
    this.failedRequests.push({ url, status, timestamp: Date.now() });
    if (this.failedRequests.length > this.maxEntries) {
      this.failedRequests.shift();
    }
  },

  addApiResponse(endpoint: string, status: 'success' | 'error') {
    this.apiResponses.push({ endpoint, status, timestamp: Date.now() });
    if (this.apiResponses.length > this.maxEntries) {
      this.apiResponses.shift();
    }
  },

  // Wrapper for Supabase calls to track API responses
  wrapSupabaseCall<T>(promise: Promise<T>, endpoint: string): Promise<T> {
    return promise.then((result: any) => {
      this.addApiResponse(endpoint, result.error ? 'error' : 'success');
      return result;
    }).catch((error) => {
      this.addApiResponse(endpoint, 'error');
      throw error;
    });
  },

  getDebugData() {
    return {
      consoleLogs: this.consoleLogs.slice(-10),
      failedRequests: this.failedRequests.slice(-5),
      apiResponses: this.apiResponses.slice(-8),
      captureTime: new Date().toISOString()
    };
  }
};

// Initialize collectors when module loads
if (typeof window !== 'undefined') {
  debugCollectors.initConsoleCapture();
  debugCollectors.initNetworkCapture();
}

/**
 * FeedbackButton – Palautteen keräyskomponentti, joka ottaa kuvakaappauksen
 * nykyisestä viewport-näkymästä käyttäen html2canvas + canvas-leikkausta.
 */
const FeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { company } = useCompany();
  const { toast } = useToast();

  /* -------------------------------------------------------------------------- */
  /*  HAE KÄYTTÄJÄ                                                             */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null);
      }
    })();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*  KUVANKAAPPAUS                                                             */
  /* -------------------------------------------------------------------------- */
  const captureScreenshot = async () => {
    let viewportCanvas: HTMLCanvasElement | null = null;
    
    try {
      // Piilota feedback-paneeli tilapäisesti (vain display, ei ignoreElements)
      const feedbackPanel = document.querySelector('.feedback-panel') as HTMLElement;
      const originalDisplay = feedbackPanel?.style.display || '';
      if (feedbackPanel) {
        feedbackPanel.style.display = 'none';
      }

      // Pieni viive että paneeli ehtii piiloon
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Määritä skaalaus etukäteen
      const scale = Math.min(1.5, window.devicePixelRatio || 1);

      // Ota kuva koko sivusta
      const fullCanvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: scale,
        backgroundColor: '#ffffff',
        logging: false,
        // Ei ignoreElements - käytetään vain display:none
      });

      // Varmista että viewport-koko on järkevä
      const viewportWidth = Math.max(1, window.innerWidth);
      const viewportHeight = Math.max(1, window.innerHeight);

      // Luo uusi canvas viewport-leikkausta varten
      viewportCanvas = document.createElement('canvas');
      const ctx = viewportCanvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Aseta viewport-koko
      viewportCanvas.width = viewportWidth;
      viewportCanvas.height = viewportHeight;

      // Laske source-koordinaatit (html2canvas skaalaa scale-arvon mukaan)
      const sourceX = Math.max(0, Math.min(
        window.scrollX * scale, 
        fullCanvas.width - viewportWidth * scale
      ));
      const sourceY = Math.max(0, Math.min(
        window.scrollY * scale, 
        fullCanvas.height - viewportHeight * scale
      ));

      // Laske source-dimensiot
      const sourceWidth = Math.min(viewportWidth * scale, fullCanvas.width - sourceX);
      const sourceHeight = Math.min(viewportHeight * scale, fullCanvas.height - sourceY);

      // Leikkaa viewport-osa alkuperäisestä canvasista
      ctx.drawImage(
        fullCanvas,
        sourceX,                         // Lähde X: scroll-position skaalattuna
        sourceY,                         // Lähde Y: scroll-position skaalattuna  
        sourceWidth,                     // Lähde leveys: viewport-leveys skaalattuna
        sourceHeight,                    // Lähde korkeus: viewport-korkeus skaalattuna
        0,                               // Kohde X: 0
        0,                               // Kohde Y: 0
        viewportWidth,                   // Kohde leveys: viewport-leveys
        viewportHeight                   // Kohde korkeus: viewport-korkeus
      );

      // Muunna data URL:ksi
      const dataUrl = viewportCanvas.toDataURL('image/png', 0.95);
      setScreenshot(dataUrl);

      // Palauta feedback-paneeli näkyväksi
      if (feedbackPanel) {
        feedbackPanel.style.display = originalDisplay;
      }

    } catch (error) {
      console.error('Screenshot capture failed:', error);
      
      // Varmista että paneeli palautetaan vaikka kuvakaappaus epäonnistuisi
      const feedbackPanel = document.querySelector('.feedback-panel') as HTMLElement;
      if (feedbackPanel) {
        feedbackPanel.style.display = '';
      }
      
      toast({
        title: 'Kuvakaappaus epäonnistui',
        description: 'Yritä uudelleen hetken kuluttua. Jos ongelma jatkuu, lähetä palaute ilman kuvaa.',
        variant: 'destructive',
      });
    } finally {
      // Siivoa canvas muistivuodon estämiseksi
      if (viewportCanvas) {
        viewportCanvas.width = 0;
        viewportCanvas.height = 0;
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*  KUVAN LÄHETYS SUPABASEEN                                                 */
  /* -------------------------------------------------------------------------- */
  const uploadScreenshot = async (dataUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const filename = `${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.png`;

      const { error } = await debugCollectors.wrapSupabaseCall(
        supabase
          .storage
          .from('feedback-screenshots')
          .upload(filename, blob, {
            contentType: 'image/png',
            cacheControl: '3600',
          }),
        'storage-upload'
      );

      if (error) throw error;

      const { data: { publicUrl } } = supabase
        .storage
        .from('feedback-screenshots')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      console.error('Screenshot upload failed:', error);
      return null;
    }
  };

  /* -------------------------------------------------------------------------- */
  /*  PALAUTTEEN LÄHETYS                                                       */
  /* -------------------------------------------------------------------------- */
  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: 'Virhe',
        description: 'Kirjoita palautetta ennen lähettämistä',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let screenshotUrl: string | null = null;
      if (screenshot) screenshotUrl = await uploadScreenshot(screenshot);

      const browserInfo = {
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        screen: { width: window.screen.width, height: window.screen.height },
      };

      // Kerää debug-data virheanalyysiä varten
      const debugData = debugCollectors.getDebugData();

      const { error } = await debugCollectors.wrapSupabaseCall(
        supabase.from('feedback').insert({
          user_id: userId,
          user_email: userEmail,
          company_name: company?.name || null,
          feedback_text: feedbackText,
          screenshot_url: screenshotUrl,
          page_url: window.location.pathname,
          browser_info: browserInfo,
          debug_data: debugData,
        }),
        'feedback-insert'
      );

      if (error) throw error;

      toast({
        title: 'Kiitos palautteestasi!',
        description: 'Palaute vastaanotettu onnistuneesti.',
      });

      setFeedbackText('');
      setScreenshot(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Virhe',
        description: 'Palautteen lähettäminen epäonnistui. Yritä uudelleen myöhemmin.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /*  RENDER                                                                    */
  /* -------------------------------------------------------------------------- */
  if (!userId) return null;

  return (
    <>
      {/* Kelluva painike */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(captureScreenshot, 200);
        }}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-neumorphic hover:bg-primary/90 transition-all flex items-center justify-center"
        aria-label="Raportoi virhe"
      >
        <Bug size={20} color="white" />
      </button>

      {/* Palautepaneeli */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 bg-card border rounded-lg shadow-neumorphic p-4 z-50 w-80 feedback-panel transition-opacity">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Raportoi virhe</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                setScreenshot(null);
              }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Sulje"
            >
              <X size={16} />
            </button>
          </div>

          <Textarea
            placeholder="Kerro minkälaisen virheen havaitsit tai miten voisimme kehittää sovellusta..."
            className="min-h-[100px] mb-2"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />

          {screenshot && (
            <div className="mt-2 mb-2">
              <p className="text-xs text-muted-foreground mb-1">Kuvakaappaus:</p>
              <div className="relative border rounded">
                <img
                  src={screenshot}
                  alt="Kuvakaappaus"
                  className="w-full h-auto max-h-40 object-cover rounded"
                />
                <button
                  onClick={() => setScreenshot(null)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  aria-label="Poista kuvakaappaus"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}

          <div className="flex mt-3">
            <Button
              className="ml-auto text-white"
              size="sm"
              onClick={submitFeedback}
              disabled={isSubmitting || !feedbackText.trim()}
            >
              {isSubmitting ? 'Lähetetään...' : 'Lähetä'}
              {!isSubmitting && <Send className="ml-1 h-4 w-4 text-white" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;