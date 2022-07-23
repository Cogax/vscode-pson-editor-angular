import { Webview, WebviewPanel, Uri } from "vscode";
import { getUri } from "../utilities/getUri";

export class PsonEditorPanel {
  public static render(panel: WebviewPanel, extensionUri: Uri) {
    panel.webview.options = {
      enableScripts: true,
    };

    panel.webview.html = this._getWebviewContent(panel.webview, extensionUri);
  }

  private static _getWebviewContent(webview: Webview, extensionUri: Uri) {
    // The CSS file from the Angular build output
    const stylesUri = getUri(webview, extensionUri, ["webview-ui", "build", "styles.css"]);
    // The JS files from the Angular build output
    const runtimeUri = getUri(webview, extensionUri, ["webview-ui", "build", "runtime.js"]);
    const polyfillsUri = getUri(webview, extensionUri, ["webview-ui", "build", "polyfills.js"]);
    const scriptUri = getUri(webview, extensionUri, ["webview-ui", "build", "main.js"]);

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <app-root></app-root>
          <script type="module" src="${runtimeUri}"></script>
          <script type="module" src="${polyfillsUri}"></script>
          <script type="module" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
