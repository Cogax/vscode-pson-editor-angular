import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, MonoTypeOperatorFunction, Observable, Subscription } from 'rxjs';
import { finalize, map, takeUntil, tap } from 'rxjs/operators';
import { BaseService } from './base.service';

@Injectable({
  providedIn: 'root',
})
export class LoadingService extends BaseService {
  private stateSubject = new BehaviorSubject<boolean>(false);
  private internalLoadingSubject = new BehaviorSubject<boolean>(false);
  private subscription: Subscription;
  private states$: Observable<boolean>;
  private counter = 0;

  constructor() {
    super();
    this.states$ = this.internalLoadingSubject.asObservable();

    this.subscription = this.states$.pipe(takeUntil(this.destroy$)).subscribe((x) => this.stateSubject.next(x));
  }

  get isLoading$(): Observable<boolean> {
    return this.stateSubject.asObservable();
  }

  trackLoadingState(state$: Observable<boolean>): void {
    this.subscription.unsubscribe();
    this.states$ = combineLatest([this.states$, state$]).pipe(map((x) => !(!x[0] && !x[1])));

    this.subscription = this.states$.pipe(takeUntil(this.destroy$)).subscribe((x) => this.stateSubject.next(x));
  }

  start(): void {
    this.counter++;
    if (this.internalLoadingSubject.value === false) {
      this.internalLoadingSubject.next(true);
    }
  }

  end(): void {
    this.counter--;
    if (this.counter <= 0) {
      this.counter = 0;
      this.internalLoadingSubject.next(false);
    }
  }

  startLoading<T>(): MonoTypeOperatorFunction<T> {
    return tap<T>(() => this.start());
  }

  endLoading<T>(): MonoTypeOperatorFunction<T> {
    return finalize<T>(() => this.end());
  }
}
