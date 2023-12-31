import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RequestsService } from 'src/app/services/requests/requests.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  form!: FormGroup;
  fieldTextType: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private requestService: RequestsService,
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility() {
    if (this.fieldTextType) { this.fieldTextType = false }
    else {
      this.fieldTextType = true
    }
  }

  accountLogin(username: string, password: string) {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    this.requestService.login(formData).pipe(
      catchError(() => {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Dados invalidos. Verifique se todos os campos estão preenchidos corretamente.',
        });
        return throwError('Erro ocorreu'); // Retorna um erro para parar a cadeia de observação
      })
    ).subscribe(
      (response): void => {
        console.log(response)
        if (response.access && response.refresh) {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          localStorage.setItem('user_PK', response.user.pk)
          this.form.reset()
          this.router.navigate(['usuario/perfil', response.user.pk])
        }
      })
  }
}
