import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { RequestsService } from '../requests/requests.service';
import Swal from 'sweetalert2'

@Injectable({
  providedIn: 'root'
})
export class TokenInjectionService implements HttpInterceptor {
  constructor(
  private router:Router,
  private requestService:RequestsService
  ) { }

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if(request.url.includes('/accounts/login/') || request.url.includes('/accounts/registration')){
      return next.handle(request);
    }
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE' ) {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        const clonedRequest = request.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        return next.handle(clonedRequest).pipe(
          catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
              return this.requestService.renovaToken().pipe(
                switchMap((response) => {
                  let newToken = response.access
                  localStorage.setItem('access_token', response.access);
                  const updatedRequest = request.clone({
                    setHeaders: {
                      Authorization: `Bearer ${newToken}`,
                    },
                  });
                  return next.handle(updatedRequest);
                }),
                catchError(() => {
                  if (error.status === 401) {
                  this.requestService.logout()}
                  return throwError(() => error);
                })
              );
            } else {
              this.requestService.logout()
              Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Erro. Tente novamente.',
                timer:1500,
              })
              this.router.navigate(['/login']);
              return throwError(() => error);
            }
          })
        );
      }
    //ou se o token não exitir.
      else{
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Realize o login novamente.',
          timer:1500,
        })
        this.router.navigate(['/login']);
      }
    }

    // Se não for uma solicitação POST, PUT ou DELETE 
    return next.handle(request);
  }
}
