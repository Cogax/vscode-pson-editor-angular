import { ExtensionContext } from "vscode";
import { PsonEditorProvider } from "./editors/PsonEditorProvider";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(PsonEditorProvider.register(context));
}
