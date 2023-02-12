import { GetServerSidePropsContext } from "next";
import {getSession, signIn} from "next-auth/react";
import { useEffect } from "react";

export default function SignIn() {
    useEffect(() => {
        signIn("google");
    }, []);

    return (
        <></>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context);

    if (!session) return {props: {}};

    return {redirect: {permanent: false, destination: "/"}}
}