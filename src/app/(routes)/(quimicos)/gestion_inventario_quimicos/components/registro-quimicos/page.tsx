import { auth } from "../../../../../../../auth"
import { QuimicosForm } from "./QuimicosForm"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  return (
    <div>
      <p className="text-3xl font-bold text-left mb-7 text-[#20232d]">
        REGISTRAR QUÍMICO
      </p>
      <QuimicosForm/>
    </div>
  )
}