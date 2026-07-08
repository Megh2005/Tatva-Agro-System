import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    
    interface Session {
        user: {
            /** The user's unique identifier */
            id: string;
            /** The user's avatar URL */
            avatar?: string;
            /** The user's preferred language code */
            language?: string;
        } & DefaultSession["user"];
    }

    interface User {
        avatar?: string;
        language?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        avatar?: string;
        language?: string;
    }
}
