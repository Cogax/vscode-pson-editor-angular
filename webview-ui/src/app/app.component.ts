import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTextField } from "@vscode/webview-ui-toolkit";
import { debounceTime, Observable, Subject, takeUntil } from "rxjs";
import { BaseService } from "./base/base.service";
import { PsonProperty } from "./models/pson";
import { PsonFileService } from "./services/pson-file.service";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTextField(),
);

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
  public title = "Wacosoft PSON Editor - Proof of Concept";
  
  constructor(public psonFileService: PsonFileService) {
    super(); 
  }

  ngOnInit(): void { }

  onEditProperty(e: Event){
    const inputElement = (e.target as HTMLInputElement);
    this.psonFileService.editProperty(inputElement.name, inputElement.value);
  }
}
