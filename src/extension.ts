import { ExtensionContext } from "vscode";
import { PsonCustomEditorProvider } from "./editors/PsonCustomEditorProvider";

export function activate(context: ExtensionContext) {
  context.subscriptions.push(PsonCustomEditorProvider.register(context));
}
