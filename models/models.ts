import mongoose, { HydratedDocument } from "mongoose";

const UserSchema = new mongoose.Schema<IUser>({
    email: {type: String, required: true},
    name: {type: String, required: true},
    image: {type: String, required: true},
}, {timestamps: true});

const VaxEventSchema = new mongoose.Schema<IVaxEvent>({
    date: {type: String, required: true},
    vaxId: {type: String, required: true},
    userId: mongoose.Schema.Types.ObjectId,
}, {timestamps: true});

export const UserModel = mongoose.models.user || mongoose.model("user", UserSchema);
export const VaxEventModel = mongoose.models.vaxEvent || mongoose.model("vaxEvent", VaxEventSchema);

export interface IUser {
    name: string,
    email: string,
    image: string,
}

export interface IVaxEvent {
    date: string,
    vaxId: string,
    userId: string,
}