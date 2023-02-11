import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
    postId: {type: mongoose.Types.ObjectId, required: true},
    userId: {type: mongoose.Types.ObjectId, required: true},
    body: {type: String, required: true},
}, {
    timestamps: true,
});

export const CommentModel = mongoose.models.comment || mongoose.model("comment", CommentSchema);