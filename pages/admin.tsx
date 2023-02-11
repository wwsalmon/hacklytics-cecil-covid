import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";

export default function Admin() {
    return (
        <>
            <p>admin panel</p>
        </>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context);

    if (!session || session.user.email !== "wwsamson12309@gmail.com") return { redirect: { permanent: false, destination: "/" } };

    return {props: {}};
}