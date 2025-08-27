// src/types/next-auth.d.ts
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      slug?: string | null   // 👈 our custom field
    }
  }

  interface User {
    slug?: string | null
  }

  interface JWT {
    id?: string
    slug?: string | null
  }
}
