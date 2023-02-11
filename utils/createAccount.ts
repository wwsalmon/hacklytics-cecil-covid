import mongoose from "mongoose";
import { UserModel } from "../models/models";
import { Session } from "next-auth";

export async function createAccount(user: Session["user"]) {
    await mongoose.connect(process.env.MONGODB_URL as string);

    return UserModel.create({
        email: user.email,
        name: user.name,
        image: user.image,
    });
}