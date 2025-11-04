import { db } from "@/lib/db";
import { sendResetPasswordEmail } from "@/lib/email/sendResetPasswordEmail";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { correo } = await req.json();

    if (!correo) {
      return NextResponse.json({ message: "Correo requerido." }, { status: 400 });
    }

    const user = await db.usuario.findUnique({
      where: { correo },
    });

    if (!user) {
      return NextResponse.json({ message: "No existe una cuenta con este correo." }, { status: 404 });
    }

    const token = crypto.randomBytes(32).toString("hex");

    
    await db.usuario.update({
      where: { correo },
      data: {
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    

    await sendResetPasswordEmail({ correo, token });

    return NextResponse.json({ message: "Correo enviado." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al enviar el correo, intenta de nuevo." }, { status: 500 });
  }
}
