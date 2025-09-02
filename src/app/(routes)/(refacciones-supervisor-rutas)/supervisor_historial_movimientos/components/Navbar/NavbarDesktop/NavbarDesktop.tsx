"use client"
import { cn } from '@/lib/utils'
import React from 'react'
import { itemsNavbar } from '@/data/itemsNavbar'
import Link from 'next/link'
import { UserProfileCard } from "@/components/shared/UserProfileCard"
import { useScrollPosition } from '@/hooks/useScrollPosition'


export function NavbarDesktop() {
    const scrollPosition = useScrollPosition();

  return (
    <div className={cn("z-30 left-0 right-0 top-0 h-16 fixed w-full transition-all duration-300",
        scrollPosition > 20 ? "bg-black" : "bg-transparent"
    )}>
        <div className='px-[4%] mx-auto h-full bg-black'>
            <div className='flex gap-4 justify-between h-full items-center'>
                <div className='flex gap-2 items-center'>
                    <p>INELAC</p>
                    <div className='ml-10 flex gap-4'>
                        {itemsNavbar.map((item)=>(
                            <Link key={item.name} href={item.link} 
                            className='hover:text-green-700 transition-all duration-300'>
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
                <div className='flex gap-4 items-center'>
                    <div className='flex gap-2 items-center'>
                        <UserProfileCard />
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
