import React from 'react';

/**
 * Yksinkertainen markdown → HTML muunnos
 */

export const cleanMarkdownText = (text: string): React.ReactNode => {
  if (!text) return text;

  // Muunna markdown HTML:ksi
  let htmlText = text
    // **bold** → <strong>bold</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // *italic* → <em>italic</em> (mutta älä koske bold-merkintöihin)
    .replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
    // `code` → <code>code</code>
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1 rounded text-sm">$1</code>')
    // Poista # otsikkomerkinnät
    .replace(/#{1,6}\s*/g, '')
    // Poista --- erottimet
    .replace(/^[-*]{3,}$/gm, '')
    // Poista ylimääräiset rivinvaihdot
    .replace(/\n{3,}/g, '\n\n')
    // Muunna rivinvaihdot <br> tageiksi
    .replace(/\n/g, '<br/>')
    .trim();

  // Käytä dangerouslySetInnerHTML renderöimään HTML
  return React.createElement('span', {
    dangerouslySetInnerHTML: { __html: htmlText }
  });
};

export const cleanMarkdownObject = (data: any): any => {
  if (!data) return data;

  // Jos kyseessä on merkkijono, puhdista se
  if (typeof data === 'string') {
    return cleanMarkdownText(data);
  }

  // Jos kyseessä on objekti, käy läpi kaikki kentät rekursiivisesti
  if (typeof data === 'object' && data !== null) {
    const result = Array.isArray(data) ? [...data] : {...data};

    for (const key in result) {
      if (result.hasOwnProperty(key)) {
        result[key] = cleanMarkdownObject(result[key]);
      }
    }

    return result;
  }

  return data;
};