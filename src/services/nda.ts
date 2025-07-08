import { supabase } from '@/integrations/supabase/client';
import { NDADocument, GenerateNDARequest, GenerateNDAResponse } from '@/types/nda';
import { callEdgeFunction } from '@/utils/edge-function';
import { fetchYTJData } from '@/utils/ytj-service';

class NDAService {
  /**
   * Hakee yrityksen kaikki NDA-dokumentit
   */
  async getNDAList(companyId: string): Promise<NDADocument[]> {
    const { data, error } = await supabase
      .from('nda_documents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Virhe NDA-listan haussa:', error);
      throw new Error('NDA-dokumenttien hakeminen epäonnistui');
    }

    return data || [];
  }

  /**
   * Hakee yksittäisen NDA-dokumentin
   */
  async getNDA(ndaId: string): Promise<NDADocument> {
    const { data, error } = await supabase
      .from('nda_documents')
      .select('*')
      .eq('id', ndaId)
      .single();

    if (error) {
      console.error('Virhe NDA:n haussa:', error);
      throw new Error('NDA-dokumentin hakeminen epäonnistui');
    }

    if (!data) {
      throw new Error('NDA-dokumenttia ei löytynyt');
    }

    return data;
  }

  /**
   * Generoi uuden NDA-dokumentin
   */
  async generateNDA(request: GenerateNDARequest): Promise<NDADocument> {
    try {
      // Kutsu Edge Functionia
      const response = await callEdgeFunction<GenerateNDAResponse>(
        'generate-nda',
        request
      );

      // Hae generoitu dokumentti tietokannasta
      const nda = await this.getNDA(response.id);
      return nda;
    } catch (error) {
      console.error('Virhe NDA:n generoinnissa:', error);
      throw error;
    }
  }

  /**
   * Päivittää NDA:n statuksen
   */
  async updateNDAStatus(ndaId: string, status: NDADocument['status']): Promise<void> {
    const { error } = await supabase
      .from('nda_documents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ndaId);

    if (error) {
      console.error('Virhe NDA:n päivityksessä:', error);
      throw new Error('NDA:n päivittäminen epäonnistui');
    }
  }

  /**
   * Hakee NDA:n latauslinkin Supabase Storagesta
   */
  async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('nda-documents')
      .createSignedUrl(storagePath, 60 * 60); // 1 tunti voimassa

    if (error) {
      console.error('Virhe latauslinkin luomisessa:', error);
      throw new Error('Latauslinkin luominen epäonnistui');
    }

    return data.signedUrl;
  }

  /**
   * Poistaa NDA-dokumentin (soft delete - vain statuksen muutos)
   */
  async deleteNDA(ndaId: string): Promise<void> {
    await this.updateNDAStatus(ndaId, 'expired');
  }

  /**
   * Lähettää NDA:n sähköpostilla (Vaihe 2)
   */
  async sendNDAByEmail(ndaId: string, recipientEmail: string, message?: string): Promise<void> {
    try {
      const response = await callEdgeFunction(
        'send-nda-email',
        {
          ndaId,
          recipientEmail,
          message
        }
      );

      if (!response.data?.success) {
        throw new Error('Sähköpostin lähetys epäonnistui');
      }
    } catch (error) {
      console.error('Virhe NDA:n lähetyksessä:', error);
      throw error;
    }
  }

  /**
   * Hakee yritystiedot Y-tunnuksella (Vaihe 2)
   */
  async searchCompanyByBusinessId(businessId: string): Promise<any> {
    try {
      const ytjData = await fetchYTJData(businessId);
      
      // Muunna YTJ-data NDA-lomakkeen muotoon
      return {
        name: ytjData.name,
        businessId: ytjData.business_id,
        address: ytjData.street_address,
        postalCode: ytjData.postal_code,
        city: ytjData.city
      };
    } catch (error) {
      console.error('Virhe yritystietojen haussa:', error);
      throw error;
    }
  }
}

export const ndaService = new NDAService();