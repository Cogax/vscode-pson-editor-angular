import * as vscode from 'vscode';
import { Disposable } from 'vscode';
import { PsonEditorPanel } from '../panels/PsonEditorPanel';

interface PsonFile {
    name: string;
    id: string;
    class: string;
    properties: PsonProperty[];
    relations: PsonRelation[] | null;
}

interface PsonProperty {
    name: string;
    type: string;
    comment: string;
    value: string;
}

interface PsonRelation {
    name: string;
    id: string;
    source: string;
    target: string;
}

interface PsonEdit {
	readonly updatedProperty: PsonProperty;
}

interface PsonDocumentDelegate {
	getFileData(): Promise<Uint8Array>;
}

interface PsonDocumentChangeEvent {
    readonly content?: PsonFile;
    readonly edits: readonly PsonEdit[]
}

interface PsonChangeEvent {
    readonly label: string;
	undo(): void;
	redo(): void;
}

class PsonDocument extends Disposable implements vscode.CustomDocument {
    static async create(
		uri: vscode.Uri,
		backupId: string | undefined,
		delegate: PsonDocumentDelegate,
	): Promise<PsonDocument | PromiseLike<PsonDocument>> {
		// If we have a backup, read that. Otherwise read the resource from the workspace
		const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
		const fileData = await PsonDocument.readFile(dataFile);
		return new PsonDocument(uri, fileData, delegate);
	}

    private static async readFile(uri: vscode.Uri): Promise<PsonFile> {
		const empty = <PsonFile>{};
        if (uri.scheme === 'untitled') {
			return empty;
		}

        const readData = await vscode.workspace.fs.readFile(uri);
		const readStr = Buffer.from(readData).toString('utf8');

        if (readStr.trim().length === 0) {
            return empty;
        }

        try {
            return JSON.parse(readStr);
        } catch {
            throw new Error('Could not get document as pson. Content is not valid pson');
        }
	}

    private readonly _uri: vscode.Uri;
    private _documentData: PsonFile;
	private _edits: Array<PsonEdit> = [];
	private _savedEdits: Array<PsonEdit> = [];
    private readonly _delegate: PsonDocumentDelegate;
    private readonly _onDidChangeDocument = new vscode.EventEmitter<PsonDocumentChangeEvent>();
    private readonly _onDidChange = new vscode.EventEmitter<PsonChangeEvent>();
    private readonly _onDidDispose = new vscode.EventEmitter<void>();

    public get uri() { 
        return this._uri; 
    }

    public get documentData(): PsonFile { 
        return this._documentData; 
    }

    public get onDidChangeDocument(): vscode.Event<PsonDocumentChangeEvent> {
        return this._onDidChangeDocument.event;
    }

    public get onDidChange(): vscode.Event<PsonChangeEvent> {
        return this._onDidChange.event;
    }

    public get onDidDispose(): vscode.Event<void> {
        return this._onDidDispose.event;
    }

    private constructor(
		uri: vscode.Uri,
		initialContent: PsonFile,
		delegate: PsonDocumentDelegate
	) {
        super(() => {
            this._onDidDispose.fire();

            this._onDidChangeDocument.dispose();
            this._onDidChange.dispose();
            this._onDidDispose.dispose();
        });
		this._uri = uri;
		this._documentData = initialContent;
		this._delegate = delegate;
	}

    public makeEdit(edit: PsonEdit): void {
        this._edits.push(edit);
        this._onDidChange.fire({
            label: 'Edit',
            undo: async() => {
                this._edits.pop();
                this._onDidChangeDocument.fire({
                    edits: this._edits
                });
            },
            redo: async() => {
                this._edits.push(edit);
                this._onDidChangeDocument.fire({
                    edits: this._edits
                });
            }
        });
    }

    public async save(cancellation: vscode.CancellationToken): Promise<void> {
        await this.saveAs(this.uri, cancellation);
        this._savedEdits = Array.from(this._edits);
    }

    public async saveAs(targetResource: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
        const fielData = await this._delegate.getFileData();
        if(cancellation.isCancellationRequested) {
            return;
        }
        await vscode.workspace.fs.writeFile(targetResource, fielData);
    }

    public async revert(cancellation: vscode.CancellationToken): Promise<void> {
        const diskContent = await PsonDocument.readFile(this.uri);
        this._documentData = diskContent;
        this._edits = this._savedEdits;
        this._onDidChangeDocument.fire({
            content: diskContent,
            edits: this._edits
        });
    }

    public async backup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
        await this.saveAs(destination, cancellation);

        return <vscode.CustomDocumentBackup>{
            id: destination.toString(),
            delete: async () => {
                try {
                    await vscode.workspace.fs.delete(destination);
                } catch {
                    // noop
                }
            }
        };
    }
}

export class PsonCustomEditorProvider implements vscode.CustomEditorProvider<PsonDocument> {
    private static newPsonFileId = 1;
    private static readonly viewType = 'wacosoft.customPsonEditor';

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(
            PsonCustomEditorProvider.viewType,
            new PsonCustomEditorProvider(context),
            {
                // TODO:
                // For this demo extension, we enable `retainContextWhenHidden` which keeps the
				// webview alive even when it is not visible. You should avoid using this setting
				// unless is absolutely required as it does have memory overhead.
                webviewOptions: {
                    retainContextWhenHidden: true
                },
                supportsMultipleEditorsPerDocument: false
            }
        );
    }

    private readonly _webviews = new WebviewCollection();
    private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<PsonDocument>>();
	private readonly _callbacks = new Map<number, (response: any) => void>();
    private _requestId = 1;

    public get onDidChangeCustomDocument(): vscode.Event<vscode.CustomDocumentEditEvent<PsonDocument>> {
        return this._onDidChangeCustomDocument.event;
    }

    constructor(
		private readonly _context: vscode.ExtensionContext
	) { }
    
    public resolveCustomEditor(
        document: PsonDocument, 
        webviewPanel: vscode.WebviewPanel, 
        token: vscode.CancellationToken): void | Thenable<void> {
        this._webviews.add(document.uri, webviewPanel);
        PsonEditorPanel.render(webviewPanel, this._context.extensionUri);
        webviewPanel.webview.onDidReceiveMessage(e => this.onMessage(document, e));
        webviewPanel.webview.onDidReceiveMessage(e => {
            if(e.type !== 'ready') return;

            if(document.uri.scheme === 'untitled') {
                this.postMessage(webviewPanel, 'init', {
                    untitled: true,
                    editable: true
                });
            } else {
                const editable = vscode.workspace.fs.isWritableFileSystem(document.uri.scheme);
                this.postMessage(webviewPanel, 'init', {
                    value: document.documentData,
                    editable
                });
            }
        });
    }

    public saveCustomDocument(document: PsonDocument, cancellation: vscode.CancellationToken): Thenable<void> {
        return document.save(cancellation);
    }

    public saveCustomDocumentAs(document: PsonDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
        return document.saveAs(destination, cancellation);
    }

    public revertCustomDocument(document: PsonDocument, cancellation: vscode.CancellationToken): Thenable<void> {
        return document.revert(cancellation);
    }

    public backupCustomDocument(document: PsonDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
        return document.backup(context.destination, cancellation);
    }

    public async openCustomDocument(
        uri: vscode.Uri, openContext: 
        vscode.CustomDocumentOpenContext, 
        token: vscode.CancellationToken): Promise<PsonDocument> {
        const document: PsonDocument = await PsonDocument.create(uri, openContext.backupId, {
            getFileData: async() => {
                const webviewsForDocument = Array.from(this._webviews.get(document.uri));
                if(!webviewsForDocument.length) {
                    throw new Error('Could not find webview to save for');
                }
                const panel = webviewsForDocument[0];
                const response = await this.postMessageWithResponse<PsonFile>(panel, 'getPsonFile', {});
                
                return new Uint8Array(Buffer.from(JSON.stringify(response, null, 4), 'utf8'));
            }
        });

        const listeners: vscode.Disposable[] = [];

        listeners.push(document.onDidChange(e => {
            // Tell VS Code that the document has been edited by the use.
            this._onDidChangeCustomDocument.fire({
                document,
                ...e
            });
        }));

        listeners.push(document.onDidChangeDocument(e => {
            // Update all webviews when the document changes
            for(const webviewPanel of this._webviews.get(document.uri)) {
                this.postMessage(webviewPanel, 'update', {
                    edits: e.edits,
                    content: e.content
                });
            }
        }));

        document.onDidDispose(() => {
            for(const listener of listeners) {
                listener.dispose();
            }
        });

        return document;
    }

    private postMessageWithResponse<R = unknown>(panel: vscode.WebviewPanel, type: string, body: any): Promise<R> {
		const requestId = this._requestId++;
		const p = new Promise<R>(resolve => this._callbacks.set(requestId, resolve));
		panel.webview.postMessage({ type, requestId, body });
		return p;
	}

    private postMessage(panel: vscode.WebviewPanel, type: string, body: any): void {
		panel.webview.postMessage({ type, body });
	}

    private onMessage(document: PsonDocument, message: any) {
		switch (message.type) {
			case 'edit':
				document.makeEdit(message as PsonEdit);
				return;

			case 'response':
            {
                const callback = this._callbacks.get(message.requestId);
                callback?.(message.body);
                return;
            }
		}
	}
}

class WebviewCollection {

	private readonly _webviews = new Set<{
		readonly resource: string;
		readonly webviewPanel: vscode.WebviewPanel;
	}>();

	/**
	 * Get all known webviews for a given uri.
	 */
	public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
		const key = uri.toString();
		for (const entry of this._webviews) {
			if (entry.resource === key) {
				yield entry.webviewPanel;
			}
		}
	}

	/**
	 * Add a new webview to the collection.
	 */
	public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
		const entry = { resource: uri.toString(), webviewPanel };
		this._webviews.add(entry);

		webviewPanel.onDidDispose(() => {
			this._webviews.delete(entry);
		});
	}
}