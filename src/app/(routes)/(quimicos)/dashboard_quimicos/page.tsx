import { Navbar } from "@/components/shared/Navbar";
import { auth } from "../../../../../auth";
import { redirect } from "next/navigation";
import DashboardQuimicos from "./components/DashboardQuimicos/DashboardQuimicos";

export default async function page() {

  const session = await auth()
  
    if (!session || !session.user) {
      redirect("/login")
    }

  return (
    <div className="relative bg-[#2b2b2b] min-h-screen overflow-hidden">
      
      <DashboardQuimicos/>
      </div>

  );
}
