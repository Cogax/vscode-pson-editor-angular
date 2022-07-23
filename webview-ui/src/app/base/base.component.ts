import { Component, Injector } from "@angular/core";
import { finalize, MonoTypeOperatorFunction, Observable, tap } from "rxjs";
import { Destroy } from "./destroy";
import { LoadingService } from "./loading.service";

@Component({
template: '',
})
  export abstract class BaseComponent extends Destroy {
    static componentName: string | null = null;
  
    isLoading$: Observable<boolean>;
  
    id: string;
    private loading: LoadingService;
    constructor(private injector: Injector) {
      super();
  
      this.id = Math.random().toString(36).substr(2, 9);
      this.loading = injector.get(LoadingService);
      this.isLoading$ = this.loading.isLoading$;
    }
  
    startLoading(): MonoTypeOperatorFunction<any> {
      return tap(() => this.loading.startLoading());
    }
  
    endLoading(): MonoTypeOperatorFunction<any> {
      return finalize(() => this.loading.endLoading());
    }
  }