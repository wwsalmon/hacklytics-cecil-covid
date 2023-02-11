import {NextApiRequest, NextApiResponse} from "next";
import mongoose from "mongoose";
import { PostModel } from "../../models/post";
import { getSession } from "next-auth/react";
import { UserModel } from "../../models/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "POST") {
            const session = await getSession({req});
            
            if (!session) return res.status(403).send("Not logged in");

            if (!req.body.body) return res.status(400).send("Missing post body");

            await mongoose.connect(process.env.MONGODB_URL as string);

            const thisUser = await UserModel.findOne({email: session.user.email});

            if (!thisUser) return res.status(403).send("No account found");

            await PostModel.create({
                body: req.body.body,
                userId: thisUser._id,
            });

            return res.status(200).send("Success");
        } else if (req.method === "GET") {
            const session = await getSession({ req });

            if (!session) return res.status(403).send("Not logged in");

            await mongoose.connect(process.env.MONGODB_URL as string);

            const thisUser = await UserModel.findOne({ email: session.user.email });

            if (!thisUser) return res.status(403).send("No account found");

            const posts = await PostModel.find({userId: thisUser._id});

            return res.status(200).json({posts: posts});
        } else if (req.method === "DELETE") {
            const session = await getSession({ req });

            if (!session) return res.status(403).send("Not logged in");
            if (!req.body.id) return res.status(400).send("Missing post ID");

            await mongoose.connect(process.env.MONGODB_URL as string);

            const thisUser = await UserModel.findOne({ email: session.user.email });

            if (!thisUser) return res.status(403).send("No account found");

            const thisPost = await PostModel.findById(req.body.id);

            if (!thisPost) return res.status(404).send("Post not found");

            if (thisPost.userId.toString() !== thisUser._id.toString()) return res.status(403).send("You do not have permission to delete this post");

            await PostModel.deleteOne({_id: req.body.id});

            return res.status(200).send("Success");
        } else {
            return res.status(405).send("Method not allowed");
        }
    } catch (e) {
        return res.status(500).json({message: e});
    }
}