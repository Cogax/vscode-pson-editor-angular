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

## Links

- [Visual Studio Code Extension API](https://code.visualstudio.com/api)
- [Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [Custom Editor - Sample](https://github.com/microsoft/vscode-extension-samples/tree/main/custom-editor-sample)
- [Webview UI Toolkit](https://github.com/microsoft/vscode-webview-ui-toolkit)
- [Webview UI Toolkit - Getting Started Guide](https://github.com/microsoft/vscode-webview-ui-toolkit/blob/main/docs/getting-started.md)
- [Webview UI Toolkit - Framework Samples](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks)
- [Webview UI Toolkit - Extended Sample](https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/notepad)
