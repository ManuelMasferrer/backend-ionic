import { Component, OnInit } from '@angular/core';
import { Cancion } from '../cancion';
import { CancionService } from '../cancion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-cancion-list',
  templateUrl: './cancion-list.component.html',
  styleUrls: ['./cancion-list.component.css']
})
export class CancionListComponent implements OnInit {

  constructor(
    private cancionService: CancionService,
    private routerPath: Router,
    private router: ActivatedRoute,
    private toastr: ToastrService
  ) { }

  userId: number
  token: string
  canciones: Array<Cancion>
  listaCanciones: Array<Cancion>
  mostrarCanciones: Array<Cancion>
  cancionSeleccionada: Cancion
  indiceSeleccionado: number = 0
  selectedFilter:string='titulo'
  processing_favorite: boolean = false
  busqueda: string = '';

  ngOnInit() {
    if(!parseInt(this.router.snapshot.params.userId) || this.router.snapshot.params.userToken === " "){
      this.showError("No hemos podido identificarlo, por favor vuelva a iniciar sesión.")
    }
    else{
      this.userId = parseInt(this.router.snapshot.params.userId)
      this.token = this.router.snapshot.params.userToken
      this.getCanciones();
    }
  }

  getCanciones():void{
    this.cancionService.getCanciones()
    .subscribe(canciones => {
      // if(canciones.length > 0){
        this.canciones = canciones
        function alfa (a: Cancion, b:Cancion) {
          if (a.titulo > b.titulo) {
            return 1;
          }
          if (a.titulo < b.titulo) {
            return -1;
          }
          return 0;
        }
      this.listaCanciones = canciones.sort( alfa )
      function compararFav (a: Cancion, b:Cancion){return Number(b.es_favorita) - Number(a.es_favorita);}
      this.mostrarCanciones = this.listaCanciones.sort( compararFav )
      let cancionDefault: any = this.mostrarCanciones[0]
      let defaultIndex: number = 0
      if(this.cancionSeleccionada) {
        cancionDefault = canciones.find(e => e.id == this.cancionSeleccionada.id)
        defaultIndex = this.canciones.findIndex(e => e.id == cancionDefault.id)
      }
      this.onSelect(cancionDefault, defaultIndex)
    // }
    })
  }



  onSelect(cancion: Cancion, indice: number){
    this.indiceSeleccionado = indice
    this.cancionSeleccionada = cancion
    this.cancionService.getAlbumesCancion(cancion.id)
    .subscribe(albumes => {
      this.cancionSeleccionada.albumes = albumes
    },
    error => {
      this.showError(`Ha ocurrido un error: ${error.message}`)
    })

  }

  buscarCancion(busqueda: string, filter = this.selectedFilter){
    this.busqueda = busqueda;
    let cancionesBusqueda: Array<Cancion> = []
    this.canciones.map( cancion => {
      if (filter==='interprete'){
        if(cancion.interprete?.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())){
          cancionesBusqueda.push(cancion)
        }
      }
      else if (filter==='genero'){
        if(cancion.genero.llave?.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())){
          cancionesBusqueda.push(cancion)
        }
      }
      else{
        if(cancion.titulo?.toLocaleLowerCase().includes(busqueda.toLocaleLowerCase())){
          cancionesBusqueda.push(cancion)
        }
      }
    })
    function alfa (a: Cancion, b:Cancion) {
      if (a.titulo > b.titulo) {
        return 1;
      }
      if (a.titulo < b.titulo) {
        return -1;
      }
      return 0;
    }
    this.listaCanciones = cancionesBusqueda.sort(alfa)
    // this.mostrarCanciones = this.listaCanciones.sort((a)=>a.es_favorita===true?-1:1)
    function compararFav (a: Cancion, b:Cancion){return Number(b.es_favorita) - Number(a.es_favorita);}
    this.mostrarCanciones = this.listaCanciones.sort(compararFav)
  }

  changeFavorite() {
    if(this.processing_favorite) {
      return
    }

    this.processing_favorite = true
    this.cancionService.changeFavoriteState(this.cancionSeleccionada.id)
      .subscribe(cancion => {

    console.log(this.cancionSeleccionada)
        this.processing_favorite = false
        this.ngOnInit()
        let message = cancion.es_favorita ? `La canción '${cancion.titulo}' fue agregada a tus favoritos` : `La canción '${cancion.titulo}' fue eliminada de tus favoritos`
        this.toastr.success(message);
      },
      error=> {
        this.showError("Ha ocurrido un error. " + error.message)
      })

  }

  eliminarCancion(){
    this.cancionService.eliminarCancion(this.cancionSeleccionada.id)
    .subscribe(cancion => {
      this.ngOnInit()
      this.showSuccess()
    },
    error=> {
      this.showError("Ha ocurrido un error. " + error.message)
    })
  }

  irCrearCancion(){
    this.routerPath.navigate([`/canciones/create/${this.userId}/${this.token}`])
  }

  showError(error: string){
    this.toastr.error(error, "Error de autenticación")
  }

  showSuccess() {
    this.toastr.success(`La canción fue eliminada`, "Eliminada exitosamente");
  }

  radioChangeHandler(event:any){
    this.selectedFilter=event.target.value;
    this.buscarCancion(this.busqueda);
    console.log(this.selectedFilter)
  }
}
