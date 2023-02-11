import { GetServerSidePropsContext } from "next";
import {getSession, signIn} from "next-auth/react";

export default function SignIn() {
    return (
        <button onClick={() => signIn("google")}>Sign in</button>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context);

    if (!session) return {props: {}};

    return {redirect: {permanent: false, destination: "/"}}
}