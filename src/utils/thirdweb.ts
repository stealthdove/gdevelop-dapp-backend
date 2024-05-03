
import { ThirdwebAuth, ThirdwebAuthUser } from "@thirdweb-dev/auth/express";
import { PrivateKeyWallet } from "@thirdweb-dev/auth/evm";
import { prisma } from "./prisma";

export const { authRouter, authMiddleware, getUser } = ThirdwebAuth({
  domain: process.env.THIRDWEB_AUTH_DOMAIN || "",
  wallet: new PrivateKeyWallet(process.env.THIRDWEB_AUTH_PRIVATE_KEY || ""),
  // the Auth flow will still work.
  callbacks: {
    onLogin: async (address: string) => {
      let user = await prisma.user.findUnique({
        where: {
          wallet: address
        }
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            wallet: address,
          }
        });
      }

      return { id: user.id, role: user.role };
    },
    onUser: async (user: ThirdwebAuthUser) => {
      // Here we can run side-effects whenever a user is fetched from the client side
      // And we can provide any extra user data to be sent to the client
      // along with the default user object.
    },
    onLogout: async (user: ThirdwebAuthUser) => {
      // Finally, we can run any side-effects whenever a user logs out.
    },
  },
});
