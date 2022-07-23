import { ChangeDetectionStrategy, Component, HostListener, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTextField } from "@vscode/webview-ui-toolkit";
import { map, Observable, Subject, takeUntil } from "rxjs";
import { BaseService } from "./base/base.service";
import { PsonFile, PsonProperty } from "./models/pson";
import { vscode } from "./utilities/vscode";

// In order to use the Webview UI Toolkit web components they
// must be registered with the browser (i.e. webview) using the
// syntax below.
provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTextField(),
);

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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent extends BaseService implements OnInit {

  private psonFileSubject = new Subject<PsonFile>();
  private psonFile: PsonFile | null = null;

  public title = "hello-world";
  public properties$: Observable<PsonProperty[]>;
  
  constructor() {
    super();   
    this.properties$ = this.psonFileSubject.pipe(takeUntil(this.destroy$), map(f => f.properties));
  }

  ngOnInit(): void {}

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
      this.psonFileSubject.next(<PsonFile>{...event.data.data})
    }
  }
}
