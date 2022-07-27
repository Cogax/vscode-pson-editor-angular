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
    public psonFile$: Observable<PsonFile>;

    constructor() {
      super();
      
      this.psonFile$ = this.psonFileSubject.pipe(
        takeUntil(this.destroy$), 
        filter(f => f != null), 
        map(f => f!)
      );
    
      fromEvent(window, 'message').pipe(takeUntil(this.destroy$)).subscribe((e) => {
        const event = e as MessageEvent;

        if(event.data.type === 'init' && event.data.body.value) {          
          console.log('received init msg from vscode');
          this.psonFileSubject.next(<PsonFile>{...event.data.body.value})
        }

        if(event.data.type === 'update') {
          console.log('received update msg from vscode');

          let psonFile = this.psonFileSubject.value;
          if(event.data.body.content) {
            psonFile = event.data.body.content;
          }

          for (let edit of event.data.body.edits) {
            let property = psonFile?.properties.find(p => p.name === edit.updatedProperty.name);
            if(!property) continue;
            console.log('replace property from -> to', property, edit.updatedProperty);
            property.value = edit.updatedProperty.value;
          }

          this.psonFileSubject.next(psonFile)
        }

        if(event.data.type === 'getPsonFile' && event.data.requestId) {
          console.log('received getPsonFile msg from vscode');
          const psonFile = this.psonFileSubject.value;
          vscode.postMessage({
            type: 'response',
            requestId: event.data.requestId,
            body: psonFile
          });
        }
      });

      vscode.postMessage({type: 'ready'});
    }

    public editProperty(name: string, newValue: string) {
      const psonFile = this.psonFileSubject.value;
      const property = psonFile?.properties.find(p => p.name === name);
      if(!property) return;
      console.log('edit property', name, newValue);
      property.value = newValue;
      this.psonFileSubject.next(psonFile);
      vscode.postMessage({
        type: 'edit',
        updatedProperty: property
      });
    }
  }