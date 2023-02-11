import {useState, useEffect} from "react";
import axios from "axios";
import Post from "../components/Post";
import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import mongoose from "mongoose";
import { UserModel } from "../models/user";

export default function Feed(props: {
    thisUser: {
        _id: string,
        name: string,
        image: string,
    } | null,
}) {
    const [posts, setPosts] = useState<{
        body: string,
        _id: string,
        createdAt: string,
        user: {
            name: string,
            image: string
        }
    }[]>([]);

    useEffect(() => {
        axios.get("/api/feed").then(res => {
            setPosts(res.data.posts);
        }).catch(e => console.log(e));
    }, []);

    return (
        <>
            {posts.map(d => (
                <Post key={d._id} post={d} thisUser={props.thisUser}/>
            ))}
        </>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context);

    if (!session) return {props: {thisUser: null}};

    let thisUser = null;

    try {
        await mongoose.connect(process.env.MONGODB_URL as string);

        thisUser = await UserModel.findOne({ email: session.user.email });

        if (!thisUser) thisUser = await UserModel.create({
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
        });
    } catch (e) {
        console.log(e);
        return { notFound: true };
    }

    return { props: { thisUser: JSON.parse(JSON.stringify(thisUser)) } };
}
