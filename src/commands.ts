
import fs from 'fs'
import path from 'path'
import { Page } from 'puppeteer'
import { PurgeCSS } from 'purgecss'
import type { CssContentFile } from './types/css-content-file.js'

const cssFilesContent: CssContentFile[] = []

/**
 * @description Generate HTML with inline CSS to render it correctly in Puppeteer
 * @param {string} html The original HTML content
 * @param {string} outputDir The output directory where the CSS files are located
 * @returns {Promise<string>} The modified HTML content with inline CSS
 */
export const generateHtmlToCriticalCss = async (html: string, outputDir: string): Promise<{ html: string, cssIds: string[] }> => {
	let htmlWithInlineCSS = html
	const cssLinkRegex = /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g
	let match
	let existContent: CssContentFile | undefined = undefined
	const cssFiles: CssContentFile[] = []
	while ((match = cssLinkRegex.exec(html)) !== null) {
		cssFiles.push({
			id: match[1],
			content: match[0]
		})
	}

	const cssIds: string[] = []
	cssFiles.forEach((cssFile) => {
		let existContent = cssFilesContent.find(item => item.id === cssFile.id)
		if (!existContent) {
			const cssContent = fs.readFileSync(path.join(process.cwd(), outputDir, cssFile.id), 'utf-8')
			existContent = { id: cssFile.id, content: cssContent }
			cssFilesContent.push(existContent)
		}
		cssIds.push(existContent.id)
		htmlWithInlineCSS = htmlWithInlineCSS.replace(cssFile.content, `<style>${existContent.content}</style>`)
	})

	return {
		html: htmlWithInlineCSS,
		cssIds,
	}
}

/**
 * @description Get the critical CSS rules from the page
 * @param page The Puppeteer page instance
 * @returns An array of critical CSS selectors
 */
export const getCriticalHTML = async (page: Page): Promise<string> => {
	const criticalHTML = await page.evaluate(() => {
		/**
		 * @description Check if an element is in the viewport
		 * @param element The element to check
		 * @returns true if the element is in the viewport, false otherwise
		 */
		const isElementInViewport = (element: Element): boolean => {
			const rect = element.getBoundingClientRect()
			return (
				((rect.top < window.innerHeight && rect.top >= 0) ||
				(rect.top <= 0 && rect.bottom >= 0)) &&
				((rect.left < window.innerWidth && rect.left >= 0) ||
				(rect.left <= 0 && rect.right >= 0))
			)
		}

		const mapAttributes = (element: Element): string => {
			return Array.from(element.attributes)
				.map(attr => `${attr.name}="${attr.value}"`)
				.join(' ')
		}

		// Collect all elements in the body
		const elements = document.querySelectorAll('body *')
		const htmlElement = document.documentElement
		const bodyElement = document.body

		let html = `<html ${mapAttributes(htmlElement)}><head></head><body ${mapAttributes(bodyElement)}>`

		Array.from(elements).forEach(element => {
			if (isElementInViewport(element)) {
				const tag = element.tagName.toLowerCase();
				html += `<${tag} ${mapAttributes(element)}></${tag}>`
			}
		})

		html += '</body></html>'
		return html
	})

	return criticalHTML
}


/**
 * @description Extract critical CSS from the provided HTML and CSS files
 * @param {string} fictionalHtml The HTML content representing above-the-fold elements
 * @param {string[]} cssIds The list of CSS file IDs to consider
 * @returns {Promise<string>} The extracted critical CSS
 */
export const extractCriticalCss = async (fictionalHtml: string, cssIds: string[]): Promise<string> => {
	// Get all CSS
	let cssGlobal = ''
	cssIds.forEach((id) => {
		const cssFile = cssFilesContent.find((item) => item.id === id)
		if (cssFile) {
			cssGlobal += cssFile.content
		}
	})

	// Use purgeCSS to extract only the critical CSS
	const purgeCSSResults = await new PurgeCSS().purge({
		content: [{ raw: fictionalHtml, extension: 'html' }],
		css: [{ raw: cssGlobal }],
		defaultExtractor: (content) => {
			const defaultSelectors = content.match(/[A-Za-z0-9_-]+/g) || [];
			const extendedSelectors = content.match(/[^<>"=\s]+/g) || [];
			return [...defaultSelectors, ...extendedSelectors];
		},
		safelist: {
			standard: ['html', 'body', '*', '::before', '::after'],
			deep: [],
			greedy: [
				/\\\[.*?\\\]/,
				/-\\\[.*?\\\]/,
			]
		}
	})

	const criticalCSS = purgeCSSResults[0]?.css || ''
	return criticalCSS
}
