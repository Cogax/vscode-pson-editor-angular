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
  private propertyChangedSubject = new Subject<PsonProperty>();

  public title = "hello-world";
  public properties$: Observable<PsonProperty[]>;
  
  constructor(private service: PsonFileService) {
    super(); 
    this.properties$ = this.service.properties$.pipe(takeUntil(this.destroy$));
  }

  ngOnInit(): void {
    this.propertyChangedSubject.pipe(takeUntil(this.destroy$), debounceTime(150))
    .subscribe(p => this.service.updateProperty(p));
  }

  public propertyChanged(property: PsonProperty, eventTarget: EventTarget | null): void {
    const target = eventTarget as HTMLInputElement;
    this.propertyChangedSubject.next(<PsonProperty>{ ...property, value: target.value });
  }
}
