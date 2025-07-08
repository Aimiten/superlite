import { marked } from 'marked';

/**
 * Muuntaa markdown-tekstin HTML-muotoon
 */
export const generateHtmlFromMarkdown = (markdown: string): string => {
  // Konfiguroi marked tarvittaessa
  marked.setOptions({
    headerIds: false,
    mangle: false
  });

  // Muunna markdown HTML:ksi
  const htmlContent = marked.parse(markdown);

  // Lisää HTML-kehys
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generoitu dokumentti</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #2563eb; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f1f5f9; }
    code { background-color: #f1f5f9; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #f1f5f9; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
};