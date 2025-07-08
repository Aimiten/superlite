export interface NDADocument {
  id: string;
  company_id: string;
  created_by: string;
  nda_type: 'unilateral' | 'mutual' | 'dd' | 'advisor';
  status: 'draft' | 'generating' | 'completed' | 'signed' | 'expired';
  disclosing_party: PartyInfo;
  receiving_party: PartyInfo;
  terms: NDATerms;
  content_markdown?: string;
  content_html?: string;
  storage_path?: string;
  signature_status?: any;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface PartyInfo {
  name: string;
  businessId?: string;
  address?: string;
  contactPerson?: string;
  email?: string;
}

export interface NDATerms {
  duration: '3_years' | '5_years' | 'indefinite' | 'custom';
  customDuration?: string;
  effectiveDate: string;
  confidentialPurpose?: 'sale_process' | 'investment' | 'partnership' | 'specific';
  specificConfidentialInfo?: string;
  confidentialInfo?: string[];  // Pidetään yhteensopivuuden vuoksi
  customConfidentialInfo?: string;  // Pidetään yhteensopivuuden vuoksi
  exceptions: string[];
  governingLaw: 'finland';
  disputeResolution: 'court' | 'arbitration';
  courtLocation?: string;
}

export interface NDAFormData {
  type: 'unilateral' | 'mutual' | 'dd' | 'advisor';
  disclosingParty: PartyInfo;
  receivingParty: PartyInfo;
  terms: NDATerms;
}

export interface GenerateNDARequest {
  companyId: string;
  formData: NDAFormData;
}

export interface GenerateNDAResponse {
  id: string;
  content: string;
  htmlContent: string;
  pdfUrl?: string;
}

// Valmiit vaihtoehdot lomakkeelle
export const confidentialInfoOptions = [
  { value: 'liiketoimintatiedot', label: 'Liiketoimintatiedot ja -suunnitelmat' },
  { value: 'taloudelliset_tiedot', label: 'Taloudelliset tiedot ja laskelmat' },
  { value: 'asiakastiedot', label: 'Asiakastiedot ja -sopimukset' },
  { value: 'teknologiatiedot', label: 'Teknologiatiedot ja osaaminen' },
  { value: 'hinnoittelutiedot', label: 'Hinnoittelutiedot' },
  { value: 'strategiset_suunnitelmat', label: 'Strategiset suunnitelmat' },
  { value: 'henkilostotiedot', label: 'Henkilöstötiedot' },
  { value: 'immateriaalioikeudet', label: 'Immateriaalioikeudet' },
  { value: 'yrityskauppatiedot', label: 'Yrityskauppaneuvotteluihin liittyvät tiedot' }
];

export const exceptionOptions = [
  { value: 'julkisesti_saatavilla', label: 'Julkisesti saatavilla oleva tieto' },
  { value: 'itsenaisesti_kehitetty', label: 'Itsenäisesti kehitetty tieto' },
  { value: 'kolmannelta_osapuolelta', label: 'Kolmannelta osapuolelta saatu tieto' },
  { value: 'lain_vaatima', label: 'Lain tai viranomaisen vaatima tieto' },
  { value: 'aiemmin_tiedossa', label: 'Vastaanottajalla jo aiemmin ollut tieto' }
];

export const ndaTypeLabels = {
  unilateral: 'Yksipuolinen NDA',
  mutual: 'Molemminpuolinen NDA',
  dd: 'Due Diligence NDA',
  advisor: 'Neuvonantaja NDA'
};

export const durationLabels = {
  '3_years': '3 vuotta',
  '5_years': '5 vuotta',
  'indefinite': 'Toistaiseksi',
  'custom': 'Muu aika'
};