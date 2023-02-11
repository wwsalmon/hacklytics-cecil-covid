import { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { PostModel } from "../../models/post";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method === "GET") {
            await mongoose.connect(process.env.MONGODB_URL as string);

            const posts = await PostModel.aggregate([
                {$match: {}},
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

            return res.status(200).json({posts: posts});
        } else {
            return res.status(405).send("Method not allowed");
        }
    } catch (e) {
        return res.status(500).json({message: e});
    }
}