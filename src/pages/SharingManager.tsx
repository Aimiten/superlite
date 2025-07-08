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
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { 
  Share2, Link as LinkIcon, Copy, CheckCircle, Loader2, User, Calendar, 
  AlertTriangle, ClipboardCheck, Eye, RefreshCcw, X, Clock
} from "lucide-react";
import { format, addDays } from "date-fns";
import { fi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  access_level: "read_only" | "comment" | "edit";
  share_link: string;
  share_link_password: string | null;
  expires_at: string | null;
  viewed_at: string | null;
  is_active: boolean;
  created_at: string;
  share_assessment: boolean;
  share_valuation: boolean;
  share_documents: boolean;
  shared_with: string | null;
  assessment_id?: string;
  valuation_id?: string;
}

interface ShareViewLog {
  id: string;
  share_id: string;
  viewer_ip: string;
  viewer_email: string | null;
  viewed_at: string;
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
  const [accessLevel, setAccessLevel] = useState<"read_only" | "comment" | "edit">("read_only");
  const [expirationDays, setExpirationDays] = useState<number | null>(15);
  const [shareViewLogs, setShareViewLogs] = useState<Record<string, ShareViewLog[]>>({});
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [isDeactivatingShare, setIsDeactivatingShare] = useState<string | null>(null);
  const [isExtendingShare, setIsExtendingShare] = useState<string | null>(null);

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
          access_level: share.access_level as "read_only" | "comment" | "edit"
        }));
        
        setShares(formattedShares);
        
        for (const share of formattedShares) {
          fetchShareViewLogs(share.id);
        }
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

  const handleCreateShare = async () => {
    if (!user || !selectedCompany) return;
    
    setIsCreatingShare(true);
    try {
      const shareId = crypto.randomUUID();
      const shareLink = `${window.location.origin}/shared/${shareId}`;
      
      const expiresAt = expirationDays 
        ? addDays(new Date(), expirationDays).toISOString() 
        : null;
      
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
          access_level: accessLevel,
          share_link: shareLink,
          expires_at: expiresAt,
          is_active: true,
          assessment_id: shareAssessment && selectedAssessment ? selectedAssessment : null,
          valuation_id: shareValuation && selectedValuation ? selectedValuation : null
        });
        
      if (error) throw error;
      
      toast({
        title: "Jako luotu",
        description: "Uusi jako on luotu onnistuneesti",
      });
      
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
        access_level: updatedShare.access_level as "read_only" | "comment" | "edit"
      };
      
      setShares(prev => [newShare, ...prev]);
      
      setShareEmail("");
      setShareMessage("");
      setAccessLevel("read_only");
      setShareAssessment(false);
      setShareValuation(false);
      setShareDocuments(false);
      
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
        return <Badge variant="secondary">Kommentointi sallittu</Badge>;
      case 'edit':
        return <Badge variant="default">Muokkaus sallittu</Badge>;
      default:
        return <Badge variant="outline">Tuntematon</Badge>;
    }
  };

  return (
    <DashboardLayout
      pageTitle="Jakamisen hallinta"
      pageDescription="Jaa arvonmäärityksiä, myyntikuntoon-analyysejä ja raportteja turvallisesti"
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
                <Badge variant="secondary" className="ml-1">{shares.length}</Badge>
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
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-3">Käyttöoikeudet</h3>
                  <div className="space-y-2">
                    <Label>Käyttöoikeustaso</Label>
                    <Select 
                      value={accessLevel} 
                      onValueChange={(value) => setAccessLevel(value as "read_only" | "comment" | "edit")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Valitse käyttöoikeustaso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read_only">Vain luku (oletusasetus)</SelectItem>
                        <SelectItem value="comment">Kommentointi sallittu</SelectItem>
                        <SelectItem value="edit">Muokkaus sallittu</SelectItem>
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
              </CardContent>
              
              <CardFooter className="flex justify-end">
                <Button
                  onClick={handleCreateShare}
                  disabled={!selectedCompany || isCreatingShare || 
                    ((!shareAssessment || !selectedAssessment) && 
                     (!shareValuation || !selectedValuation) && 
                     !shareDocuments)}
                >
                  {isCreatingShare ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Luodaan...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Luo jakolinkki
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
                    <p className="text-slate-500 mb-6">Sinulla ei ole vielä aktiivisia jakoja tälle yritykselle.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const tabElement = document.querySelector('[data-value="create"]');
                        if (tabElement instanceof HTMLElement) {
                          tabElement.click();
                        }
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Luo ensimmäinen jako
                    </Button>
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
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={shareStatus.color}
                              >
                                {shareStatus.label}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                Luotu: {format(new Date(share.created_at), 'dd.MM.yyyy', { locale: fi })}
                              </span>
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
                            </div>
                            
                            <div className="border-t pt-3 flex flex-wrap gap-2">
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
    </DashboardLayout>
  );
};

export default SharingManager;

