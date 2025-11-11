import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    // 👇 user opcional, y también id/rol opcionales
    user?: {
      id?: string;
      rol?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    rol?: string;
    imagen?: string;
  }
}
