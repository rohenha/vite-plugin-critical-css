import { Page } from 'puppeteer';
/**
 * @description Generate HTML with inline CSS to render it correctly in Puppeteer
 * @param {string} html The original HTML content
 * @param {string} outputDir The output directory where the CSS files are located
 * @returns {Promise<string>} The modified HTML content with inline CSS
 */
export declare const generateHtmlToCriticalCss: (html: string, outputDir: string) => Promise<{
    html: string;
    cssIds: string[];
}>;
/**
 * @description Get the critical CSS rules from the page
 * @param page The Puppeteer page instance
 * @returns An array of critical CSS selectors
 */
export declare const getCriticalHTML: (page: Page) => Promise<string>;
/**
 * @description Extract critical CSS from the provided HTML and CSS files
 * @param {string} fictionalHtml The HTML content representing above-the-fold elements
 * @param {string[]} cssIds The list of CSS file IDs to consider
 * @returns {Promise<string>} The extracted critical CSS
 */
export declare const extractCriticalCss: (fictionalHtml: string, cssIds: string[]) => Promise<string>;
