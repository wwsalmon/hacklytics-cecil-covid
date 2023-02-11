import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import {signOut} from "next-auth/react";
import mongoose, { HydratedDocument } from "mongoose";
import { IUser, IVaxEvent, UserModel } from "../models/models";
import { createAccount } from "../utils/createAccount";
import { cleanForJSON } from "../utils/cleanForJson";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Index({ thisUser }: {
    thisUser: HydratedDocument<IUser>,
}) {
    const [vaxEvents, setVaxEvents] = useState<HydratedDocument<IVaxEvent>[]>([]);
    const [date, setDate] = useState<string>("");
    const [vaxId, setVaxId] = useState<string>("63e762e6d0f5352d49f1f0b1"); // temporarily fixed;
    const [iter, setIter] = useState<number>(0);

    useEffect(() => {
        axios.get("/api/vaxEvent").then(res => {
            setVaxEvents(res.data.vaxEvents);
        }).catch(e => {
            console.log(e);
        });
    }, [iter]);

    function onAdd() {
        axios.post("/api/vaxEvent", {date, vaxId}).then(res => {
            setDate("");
            setIter(prev => prev + 1);
        }).catch(e => {
            console.log(e);
        });
    }

    return (
        <>
            <p>name: {thisUser.name}</p>
            <p>email: {thisUser.email}</p>
            <img src={thisUser.image} alt="Profile picture" />
            <button onClick={() => signOut()}>Sign out</button>
            <hr/>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}/>
            <button onClick={onAdd}>Add</button>
            <hr/>
            {vaxEvents.map(d => (
                <p>{d.date}, {d.vaxId}, {d.userId}</p>
            ))}
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
