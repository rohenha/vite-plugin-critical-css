import { Plugin } from 'vite';
/**
 * @description Vite plugin to generate and inline critical CSS using Puppeteer
 * @param {object} options - Plugin configuration options
 * @param {number} [options.viewportWidth=1200] - Width of the viewport for Puppeteer
 * @param {number} [options.viewportHeight=800] - Height of the viewport for Puppeteer
 * @param {string} [options.outputDir='_site'] - Output directory where the CSS files are located
 * @param {number} [options.timeout=30000] - Timeout for Puppeteer operations in milliseconds
 * @returns {Plugin} - Vite plugin instance
 */
export default function CriticalCssPlugin({ viewportWidth, viewportHeight, outputDir, timeout }: {
    viewportWidth?: number;
    viewportHeight?: number;
    outputDir?: string;
    timeout?: number;
}): Plugin;
