# VSCode PSON Editor Extension

## Development

```bash
# Install dependencies for both the extension and webview UI source code
npm run install:all

# Build webview UI source code
npm run build:webview
```

## Deployment

```bash
# 1. Install vsce:
npm install -g vsce

# 2. Upgrade version in package.json

# 3. Package
vsce package
```
