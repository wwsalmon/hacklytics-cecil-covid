import { addDays, format } from "date-fns";
import { useState } from "react";
import { IUser, UserModel } from "../models/models";
import { createAccount } from "../utils/createAccount";
import { cleanForJSON } from "../utils/cleanForJson";
import mongoose, { HydratedDocument } from "mongoose";
import { GetServerSidePropsContext } from "next";
import { getSession, signOut } from "next-auth/react";
import classNames from "classnames";
import axios from "axios";
import { useRouter } from "next/router";
import Navbar from "../components/Navbar";

export default function Onboarding({thisUser}: {thisUser: HydratedDocument<IUser>}) {
    const [brand, setBrand] = useState<string>("");
    const [date, setDate] = useState<string>("");
    const [stage, setStage] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();

    const q1fill = {
        0: "",
        1: "were your primary doses (two for Pfizer and Moderna, one for J&J)?",
        2: "was your first booster?",
        3: "was your second booster?",
    }[stage];

    const q2fill = {
        0: "",
        1: "your last primary dose (second for Pfizer and Moderna, first for J&J)?",
        2: "your first booster?",
        3: "your second booster?",
    }[stage];

    function onNext() {
        if (stage === 0) return setStage(1);

        setIsLoading(true);

        axios.post("/api/vaxEvent", {
            vaxId: (stage === 1 ? (brand + " " + (brand === "J&J" ? "1st dose" : "1st and 2nd doses")) : stage === 2 ? "First booster" : "Second booster"),
            date: date,
        }).then(res => {
            if (stage === 3) {
                router.push("/");
            } else {
                setStage(prev => prev + 1);
                setBrand("");
                setDate("");
            }
        }).catch(e => {
            console.log(e);
        }).finally(() => {
            setIsLoading(false);
        })
    }

    return (
        <>
            <Navbar thisUser={thisUser}/>
            <div className="max-w-2xl mx-auto px-4 py-8">
                {stage === 0 ? (
                    <div className="relative top-[50vh] transform -translate-y-1/2 -mt-8">
                        <img src="/logo.png" className="w-64 mx-auto block" alt="BoostOnTime logo" />
                        <h1 style={{fontFamily: "EB Garamond"}} className="font-semibold text-5xl text-center">Welcome to BoostOnTime</h1>
                        <p className="text-lg my-4 opacity-75 text-center">Share some info about your vaccination history and we'll help you estimate your COVID immunity.</p>
                        <button onClick={() => setStage(prev => prev + 1)} className="p-4 bg-black text-white my-8 block w-full shadow-lg">Get started</button>
                    </div>
                ) : (
                    <>
                        <div className="w-full h-2 bg-gray-300 relative mt-16">
                            <div className={classNames("h-full absolute left-0 top-0 bg-[#FC3142]", {1: "w-4", 2: "w-1/3", 3: "w-2/3"}[stage])}/>
                            <img src="/bullet.png" alt="silly goofy bullet point" className="h-12 rotate-90 absolute -top-5" style={{left: (stage - 1) / 3 * 100 + "%"}}/>
                        </div>
                        {stage === 1 && (
                            <>
                                <p className="text-2xl mt-16 mb-8">What brand {q1fill}</p>
                                <select value={brand} onChange={e => setBrand(e.target.value)} className="p-4 border w-full block shadow-lg">
                                    {["Pfizer", "Moderna", "J&J", ""].map(d => (
                                        <option value={d} key={d}>{d}</option>
                                    ))}
                                </select>
                            </>
                        )}
                        <p className="text-2xl mt-16 mb-8">When did you receive {q2fill}</p>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} min="2019-01-01"
                               max={format(addDays(new Date(), 1), "yyyy-MM-dd")} className="p-4 border w-full block shadow-lg" />
                        <button onClick={onNext} className="p-4 bg-black text-white mt-16 block w-full shadow-lg disabled:opacity-50 hover:shadow-xl hover:bg-neutral-900 transition" disabled={isLoading || !date || !(brand || stage !== 1)}>{isLoading ? "loading..." : "Next"}</button>
                        {stage > 1 && (
                            <button className="p-4 border border-black mt-4 w-full shadow-lg block hover:bg-gray-100 hover:shadow-xl transition" onClick={() => router.push("/")}>Haven't received {{
                                2: "first booster",
                                3: "second booster",
                            }[stage]}</button>
                        )}
                        <button onClick={() => setStage(prev => prev + 1)}>DEV SKIP</button>
                    </>
                )}
            </div>
        </>
    )
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