"use client";
import { useRouter } from 'next/navigation';

export function ButtonRegresar() {

    const router = useRouter();
    const backToHome = () => {
        router.push('/gestion_almacen');
    };

  return (
    <button  className="bg-blue-500 text-white px-4 py-2 rounded-2xl hover:bg-blue-400 transition duration-300"
        onClick={backToHome}>
        <p>
            Regresar        
        </p>
    </button>
  )
}
