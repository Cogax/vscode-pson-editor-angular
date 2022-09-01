import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDivider, vsCodePanels, vsCodePanelTab, vsCodePanelView, vsCodeTextField } from "@vscode/webview-ui-toolkit";
import { Subject } from "rxjs";
import { BaseService } from "./base/base.service";
import { PsonProperty } from "./models/pson";
import { PsonFileService } from "./services/pson-file.service";

provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTextField(),
  vsCodePanels(),
  vsCodePanelTab(),
  vsCodePanelView(),
  vsCodeDivider()
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
  private propertySubject = new Subject<PsonProperty>();
  public property$ = this.propertySubject.asObservable();

  constructor(public psonFileService: PsonFileService) {
    super(); 
  }

  ngOnInit(): void { }

  onEditProperty(e: Event): void {
    const inputElement = (e.target as HTMLInputElement);
    this.psonFileService.editProperty(inputElement.name, inputElement.value);
  }

  onPropertySelect(name: string): void {
    console.log('click', name);
    const property = this.psonFileService.psonFile?.properties.find(p => p.name == name);
    if(!property) return;
    
    console.log('property', property);
    this.propertySubject.next(property);
  }
}
