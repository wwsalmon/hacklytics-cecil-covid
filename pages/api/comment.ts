import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import {CommentModel} from "../../models/comment";
import { getSession } from "next-auth/react";
import { UserModel } from "../../models/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "POST") {
            const session = await getSession({ req });

            if (!session) return res.status(403).send("Not logged in");

            if (!req.body.body || !req.body.postId) return res.status(400).send("Missing post body");

            await mongoose.connect(process.env.MONGODB_URL as string);

            const thisUser = await UserModel.findOne({ email: session.user.email });

            if (!thisUser) return res.status(403).send("No account found");

            await CommentModel.create({
                postId: req.body.postId,
                body: req.body.body,
                userId: thisUser._id,
            });

            return res.status(200).send("Success");
        } else if (req.method === "GET") {
            await mongoose.connect(process.env.MONGODB_URL as string);

            if (!req.query.postId) return res.status(405).send("missing post id");

            const comments = await CommentModel.aggregate([
                {$match: {postId: new mongoose.Types.ObjectId(req.query.postId as string)}},
                {
                    $lookup: {
                        from: "users",
                        foreignField: "_id",
                        localField: "userId",
                        as: "user"
                    }
                },
                {$unwind: "$user"},
            ]);

            return res.status(200).json({ comments: comments });
        } else if (req.method === "DELETE") {
            const session = await getSession({ req });

            if (!session) return res.status(403).send("Not logged in");
            if (!req.body.id) return res.status(400).send("Missing post ID");

            await mongoose.connect(process.env.MONGODB_URL as string);

            const thisUser = await UserModel.findOne({ email: session.user.email });

            if (!thisUser) return res.status(403).send("No account found");

            const thisComment = await CommentModel.findById(req.body.id);

            if (!thisComment) return res.status(404).send("Comment not found");

            if (thisComment.userId.toString() !== thisUser._id.toString()) return res.status(403).send("You do not have permission to delete this comment");

            await CommentModel.deleteOne({ _id: req.body.id });

            return res.status(200).send("Success");
        } else {
            return res.status(405).send("Method not allowed");
        }
    } catch (e) {
        return res.status(500).json({ message: e });
    }
}