import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export abstract class Destroy implements OnDestroy {
  private destroy: Subject<boolean> = new Subject<boolean>();

  protected get destroy$(): Observable<boolean> {
    return this.destroy.asObservable();
  }

  ngOnDestroy(): void {
    this.destroy.next(true);
    this.destroy.unsubscribe();
  }
}