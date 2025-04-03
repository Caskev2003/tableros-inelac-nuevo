import {
    Sheet,
    SheetContent,
    SheetTrigger,
  } from "@/components/ui/sheet"

import { BellRing, Menu, Search } from "lucide-react";
import { itemsNavbar } from "@/data/itemsNavbar";
import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { UserProfileCard } from "@/components/shared/UserProfileCard"

export function NavbarMobile() {
  return (
    <div className='p-4 flex justify-between'>
        <p>INELAC</p>
        <Sheet>
  <SheetTrigger>
    <Menu/>
  </SheetTrigger>
  <SheetContent side= "left" className="bg-neutral-900">
  {/*Mapeo de las opciones de navegación de PC a telefono */}
   <div className="flex flex-col gap-4 ml-4 mt-4">
    {itemsNavbar.map((item) => (
      <Link key={item.name} href={item.link} 
        className="hover:text-green-700 transition-all duration-300"> 
          {item.name} 
      </Link>
    ))}
   </div>

     {/*Creación de iconos search y notifications de la barra de navegación de PC a telefono */}
   <div className="border-[1px] border-white/70 my-5"/>
   <div className="mx-2 cursor-pointer">
      <UserProfileCard />
    </div>

   <div className="flex justify-center mt-35">
   <Logo/>
   </div>

  </SheetContent>
</Sheet>
    </div>
  )
}
