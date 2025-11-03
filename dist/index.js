import { loadEnv } from 'vite';
import puppeteer from 'puppeteer';
import { generateHtmlToCriticalCss, getCriticalHTML, extractCriticalCss } from './commands.js';
/**
 * @description Vite plugin to generate and inline critical CSS using Puppeteer
 * @param {object} options - Plugin configuration options
 * @param {number} [options.viewportWidth=1200] - Width of the viewport for Puppeteer
 * @param {number} [options.viewportHeight=800] - Height of the viewport for Puppeteer
 * @param {string} [options.outputDir='_site'] - Output directory where the CSS files are located
 * @param {number} [options.timeout=30000] - Timeout for Puppeteer operations in milliseconds
 * @returns {Plugin} - Vite plugin instance
 */
export default function CriticalCssPlugin({ viewportWidth = 1200, viewportHeight = 800, outputDir = '_site', timeout = 30000 }) {
    let browser = null;
    // let page: Page | null = null
    return {
        name: 'critical-css',
        enforce: 'post',
        async config(config, { command }) {
            if (command === 'build') {
                const env = loadEnv('production', process.cwd(), '');
                browser = await puppeteer.launch({
                    headless: true, // Mode headless standard
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process', // Important pour macOS
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor'
                    ],
                    executablePath: env.VITE_PUPPETEER_EXECUTABLE_PATH,
                });
            }
        },
        async transformIndexHtml(html, context) {
            if (!browser) {
                return html;
            }
            const tags = [];
            const bundle = context.bundle;
            try {
                const page = await browser.newPage();
                await page.setViewport({
                    width: viewportWidth,
                    height: viewportHeight
                });
                // Inject CSS inline in HTML
                const { html: htmlWithInlineCSS, cssIds } = await generateHtmlToCriticalCss(html, outputDir);
                // Load the HTML content in Puppeteer
                await page.setContent(htmlWithInlineCSS, {
                    waitUntil: 'networkidle0',
                    timeout: timeout
                });
                const criticalHTML = await getCriticalHTML(page);
                const criticalCss = await extractCriticalCss(criticalHTML, cssIds);
                // Find the position of the first stylesheet link
                const stylesheetLinkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*>/;
                const match = html.match(stylesheetLinkRegex);
                if (match && match.index !== undefined) {
                    // Inject critical CSS just before the first stylesheet link
                    const beforeLink = html.substring(0, match.index);
                    const afterLink = html.substring(match.index);
                    html = beforeLink + `<style>${criticalCss}</style>` + afterLink;
                }
                else {
                    // Fallback: add to head if no stylesheet links found
                    tags.push({
                        tag: 'style',
                        children: criticalCss,
                        injectTo: 'head-prepend',
                    });
                }
                console.log('✅ Critical CSS generated for:', context.filename);
                // 2. Threat only CSS files that are in the HTML
                const cssMatches = html.match(/<link[^>]*href="[^"]*\.css"[^>]*>/g) || [];
                cssMatches.forEach(cssLink => {
                    const hrefMatch = cssLink.match(/href="([^"]*)"/);
                    if (hrefMatch) {
                        const cssPath = hrefMatch[1];
                        // Replace the original link with a deferred loading link
                        html = html.replace(cssLink, `<link rel="stylesheet" href="${cssPath}" media="print" onload="this.media='all'; this.onload=null; this.isLoaded=true">`);
                        // 2. Add noscript fallback
                        tags.push({
                            tag: 'noscript',
                            children: [
                                {
                                    tag: 'link',
                                    attrs: {
                                        rel: 'stylesheet',
                                        href: cssPath,
                                    },
                                },
                            ],
                            injectTo: 'body',
                        });
                    }
                });
                // 3. Treat only JS scripts that are in the HTML
                const scriptMatches = html.match(/<script[^>]*src="[^"]*\.js"[^>]*><\/script>/g) || [];
                scriptMatches.forEach(scriptTag => {
                    const srcMatch = scriptTag.match(/src="([^"]*)"/);
                    const typeMatch = scriptTag.match(/type="([^"]*)"/);
                    if (srcMatch) {
                        const jsPath = srcMatch[1];
                        const scriptType = typeMatch ? typeMatch[1] : 'module';
                        // Remove the original script tag
                        html = html.replace(scriptTag, '');
                        // Add the script to the footer with defer
                        tags.push({
                            tag: 'script',
                            attrs: {
                                type: scriptType,
                                src: jsPath,
                                defer: true,
                            },
                            injectTo: 'body',
                        });
                    }
                });
                return {
                    html,
                    tags
                };
            }
            catch (error) {
                console.warn('⚠️ Erreur Puppeteer:', error);
                return html; // Fallback to original HTML on error
            }
        },
        async closeBundle() {
            if (!browser)
                return;
            await browser.close();
        }
    };
}
