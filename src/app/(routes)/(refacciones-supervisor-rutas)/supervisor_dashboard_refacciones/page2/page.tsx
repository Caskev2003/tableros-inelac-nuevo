import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import PaginateDashboard from "../components/paginateDashboard/PaginateDashboard";

export default async function page() {

  const session = await auth()
  
    if (!session || !session.user) {
      redirect("/login")
    }

  return (
    <div className="relative bg-[#2b2b2b] min-h-screen overflow-hidden">
      <PaginateDashboard/>
    </div>

  );
}
