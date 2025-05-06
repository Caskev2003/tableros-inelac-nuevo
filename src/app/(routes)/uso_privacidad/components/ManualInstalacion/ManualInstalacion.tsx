import React from 'react'

export default function ManualInstalacion() {
  return (
    <div className='gap-2 flex flex-col justify-center'>
      <label htmlFor="contrato-informatico" className="text-white text-lg font-bold mb-2">
        Haz click aqui para descargar el Manual de instalación
      </label>
      <button className="bg-blue-500 text-white px-4 py-2 w-30 h-10 rounded-2xl hover:bg-blue-400 transition duration-300">
        <a href="/manual-de-instalacion-tablerosdecontrol.pdf" download>
          Descargar
        </a>
      </button>
    </div>
  )
}
