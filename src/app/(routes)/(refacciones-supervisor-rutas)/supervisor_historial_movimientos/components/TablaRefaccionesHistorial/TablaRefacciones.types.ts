export type Refaccion = {
    codigo: number
    descripcion: string
    noParte: string
    existenciaFisica: number
    existenciaSistema: number
    diferencias: number
    proveedores: string
    cantidadEntrada?: number
    cantidadSalida?: number
    cantidad?: number
    fechaIngreso: string | Date
    movimiento: string
    unidadMedidaId: string
    ubicacion: {
      rack: number
      fila: string
      posicion: string
    }
    usuarioReportado?: {
      nombre?: string
    }
    reportadoPorId: number
  }
  