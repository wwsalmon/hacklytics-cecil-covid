import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import mongoose from "mongoose";
import { UserModel } from "../../../models/models";
import { createAccount } from "../../../utils/createAccount";

export default NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        signIn: async ({user}) => {
            await mongoose.connect(process.env.MONGODB_URL as string);

            const foundItem = await UserModel.findOne({ email: user.email }).exec();

            if (foundItem) return true;

            // @ts-ignore
            await createAccount(user);

            return true;
        }
    }
});