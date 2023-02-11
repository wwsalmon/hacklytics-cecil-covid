import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import {signOut} from "next-auth/react";
import mongoose, { HydratedDocument } from "mongoose";
import { IUser, UserModel } from "../models/models";
import { Session } from "next-auth";
import { createAccount } from "../utils/createAccount";
import { cleanForJSON } from "../utils/cleanForJson";

export default function Index({ thisUser }: {
    thisUser: HydratedDocument<IUser>,
}) {

    return (
        <>
            <p>name: {thisUser.name}</p>
            <p>email: {thisUser.email}</p>
            <img src={thisUser.image} alt="Profile picture" />
            <button onClick={() => signOut()}>Sign out</button>
        </>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context);

    if (!session) return { redirect: { permanent: false, destination: "/signin" } };

    try {
        await mongoose.connect(process.env.MONGODB_URL as string);

        let thisUser = await UserModel.findOne({email: session.user.email});

        if (!thisUser) thisUser = await createAccount(session.user);

        return {props: {thisUser: cleanForJSON(thisUser)}};
    } catch (e) {
        console.log(e);
        return { notFound: true };
    }
}
