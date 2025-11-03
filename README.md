<p align="center"><img src="https://www.11ty.dev/img/logo-github.svg" width="200" height="200" alt="11ty Logo">&#160;&#160;<img src="https://v1.image.11ty.dev/https%3A%2F%2Fvitejs.dev%2Flogo.svg/png/200x200/" alt="Vite logo" width="200" height="200"></p>

# Vite plugin Critical CSS

Vite plugin to use inline critical CSS in html pages and lazyload CSS file in build mode

## Configuration

```.env
VITE_PUPPETEER_EXECUTABLE_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

```javascript
import criticalCssPlugin from "@rohenha/vite-plugin-critical-css"

export default defineConfig({
  plugins: [
    criticalCssPlugin({
      viewportWidth: 1440,
      viewportHeight: 930,
      outputDir: '_site',
      timeout: 30000
    }),
  ]
})
```


## Options

| Option | Type | Défaut | Description |
|--------|------|--------|-------------|
| `viewportWidth` | `number` | `1440` | Window width to render each page |
| `viewportHeight` | `number` | `'930'` | Window height to render each page |
| `outputDir` | `string` | `'_site'` | Vite output folder |
| `timeout` | `number` | `3000` | Timeout to read each page |


## Usage

### Prod
```bash
npm run build
```

Read each html pages, extract critical CSS and inline it in head
