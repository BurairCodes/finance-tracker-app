/**
 * Decodes HTML entities to their corresponding characters
 * @param text - The text containing HTML entities
 * @returns The decoded text
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    .replace(/&#x2B;/g, '+')
    .replace(/&#x23;/g, '#')
    .replace(/&#x25;/g, '%')
    .replace(/&#x40;/g, '@')
    .replace(/&#x5B;/g, '[')
    .replace(/&#x5D;/g, ']')
    .replace(/&#x5E;/g, '^')
    .replace(/&#x7B;/g, '{')
    .replace(/&#x7C;/g, '|')
    .replace(/&#x7D;/g, '}')
    .replace(/&#x7E;/g, '~');
}
