import {Unidad_medida } from "@prisma/client"

export interface Quimico {
  codigo: number;
  descripcion: string;
  noLote: string;
  existenciaFisica: number;
  existenciaSistema: number;
  diferencias: number;
  cantidadEntrada: number;
  cantidadSalida: number;
  proveedores: string;
  unidadMedidaId: Unidad_medida; // Asegúrate de que esto esté definido
  unidad?: string; // Opcional por si usas el campo mapeado
  ubicacion?: {
    rack: number;
    posicion: string;
    fila: string;
  };
  fechaIngreso: string | Date;
  fechaVencimiento: string | Date;
  diasDeVida?: number;
  retenidos: number;
  productoLiberado: string;
  usuarioReportado?: {
    nombre?: string
  }
  reportadoPorId: number
}