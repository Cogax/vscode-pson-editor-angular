import { Component, HostListener } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeButton } from "@vscode/webview-ui-toolkit";
import { PsonFile } from "./models/pson";
import { vscode } from "./utilities/vscode";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(vsCodeButton());

// To register more toolkit components, simply import the component
// registration function and call it from within the register
// function, like so:
//
// provideVSCodeDesignSystem().register(
//   vsCodeButton(),
//   vsCodeCheckbox()
// );
//
// Finally, if you would like to register all of the toolkit
// components at once, there's a handy convenience function:
//
// provideVSCodeDesignSystem().register(allComponents.register());

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "hello-world";
  psonFile: PsonFile | null = null;

  handleHowdyClick() {
    console.log('current psonFile', this.psonFile);
    vscode.postMessage({
      command: "hello",
      text: "Hey there partner! 🤠",
    });
  }

  @HostListener('window:message', ['$event'])
  handleMessage(event: MessageEvent) {
    console.log('received vscode message', event.data);

    if(event.data.type === 'document_update') {
      this.psonFile = <PsonFile>{...event.data.data};
    }
  }
}
