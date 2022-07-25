import { HostListener, Injectable } from "@angular/core";
import { BehaviorSubject, filter, fromEvent, map, Observable, Subject, takeUntil } from "rxjs";
import { BaseService } from "../base/base.service";
import { PsonFile, PsonProperty } from "../models/pson";
import { vscode } from "../utilities/vscode";

@Injectable({
    providedIn: 'root',
  })
  export class PsonFileService extends BaseService {
    private psonFileSubject = new BehaviorSubject<PsonFile | null>(null);
    public properties$: Observable<PsonProperty[]>;

    constructor() {
      super();
      this.properties$ = this.psonFileSubject.pipe(takeUntil(this.destroy$), filter(f => f != null), map(f => f!.properties));
    
      fromEvent(window, 'message').pipe(takeUntil(this.destroy$)).subscribe((e) => {
        const event = e as MessageEvent;
        console.log('received vscode message', event.data);

        if(event.data.type === 'document_update') {
          this.psonFileSubject.next(<PsonFile>{...event.data.data})
        }
      });
    }

    public updateProperty(property: PsonProperty) {
      vscode.postMessage({
        type: "property_update",
        property: {
          name: property.name,
          value: property.value
        }
      });
    }

    // @HostListener('window:message', ['$event'])
    // public handleMessage(event: MessageEvent) {
    //   console.log('received vscode message', event.data);

    //   if(event.data.type === 'document_update') {
    //     this.psonFileSubject.next(<PsonFile>{...event.data.data})
    //   }
    // }
  }