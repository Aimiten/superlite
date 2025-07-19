// User-friendly error messages in Finnish

export function getUserFriendlyError(error: any): string {
  const message = error.message?.toLowerCase() || '';
  
  // API-specific errors
  if (message.includes('timeout')) {
    return 'Taloustietojen haku kesti liian kauan. Yritä hetken kuluttua uudelleen.';
  }
  
  if (message.includes('rate limit')) {
    return 'Liian monta hakua lyhyessä ajassa. Odota hetki ja yritä uudelleen.';
  }
  
  if (message.includes('company not found')) {
    return 'Yritystä ei löytynyt. Tarkista yrityksen nimi tai y-tunnus.';
  }
  
  if (message.includes('no financial data')) {
    return 'Yrityksen taloustietoja ei löytynyt julkisista lähteistä.';
  }
  
  if (message.includes('invalid business id')) {
    return 'Virheellinen y-tunnus. Oikea muoto on 1234567-8.';
  }
  
  if (message.includes('search term too short')) {
    return 'Hakusana on liian lyhyt. Anna vähintään 3 merkkiä.';
  }
  
  if (message.includes('firecrawl')) {
    return 'Taloustietojen haku epäonnistui. Palvelu voi olla tilapäisesti ruuhkautunut.';
  }
  
  if (message.includes('perplexity')) {
    return 'Toimialakertoimien haku epäonnistui. Käytetään oletusarvoja.';
  }
  
  // Network errors
  if (message.includes('fetch failed') || message.includes('network')) {
    return 'Verkkovirhe. Tarkista internetyhteytesi ja yritä uudelleen.';
  }
  
  // Default message
  return 'Arvonmäärityksen laskenta epäonnistui. Yritä hetken kuluttua uudelleen.';
}

export class UserError extends Error {
  constructor(
    message: string, 
    public userMessage: string,
    public code?: string
  ) {
    super(message);
    this.name = 'UserError';
  }
}