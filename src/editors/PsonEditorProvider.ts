import * as vscode from 'vscode';
import { PsonEditorPanel } from '../panels/PsonEditorPanel';
import { getUri } from '../utilities/getUri';

export class PsonEditorProvider implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new PsonEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(PsonEditorProvider.viewType, provider);
    return providerRegistration;
  }

  private static readonly viewType = 'wacosoft.psonEditor';
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    PsonEditorPanel.render(webviewPanel, this.context.extensionUri);

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.updateWebview(document, webviewPanel);
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case 'editor_update':
          this.editProperty(document, e.property, e.data);
          return;
      }
    });

    this.updateWebview(document, webviewPanel);
  }

  getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'psonEditor.js')
    );

    const toolkitUri = getUri(webview, this.context.extensionUri, [
      'node_modules',
      '@vscode',
      'webview-ui-toolkit',
      'dist',
      'toolkit.js',
    ]);

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script type="module" src="${toolkitUri}"></script>
          <script type="module" src="${scriptUri}"></script>
          <title>Hello World!</title>
        </head>
        <body>
          <div class="main"></div>
        </body>
      </html>
    `;
  }

  private updateWebview(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    webviewPanel.webview.postMessage({
      type: 'document_update',
      data: this.getDocumentAsJson(document),
    });
  }

  private editProperty(document: vscode.TextDocument, propertyName: string, value: string) {
    const json = this.getDocumentAsJson(document);
    for (const property of json.properties) {
      if (property.name === propertyName) {
        property.value = value;
        return this.updateTextDocument(document, json);
      }
    }
  }

  private getDocumentAsJson(document: vscode.TextDocument): any {
    const text = document.getText();
    if (text.trim().length === 0) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Could not get document as json. Content is not valid json');
    }
  }

  private updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), JSON.stringify(json, null, 4));
    return vscode.workspace.applyEdit(edit);
  }
}
