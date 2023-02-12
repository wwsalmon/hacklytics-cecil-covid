import mongoose, { HydratedDocument } from "mongoose";

const UserSchema = new mongoose.Schema<IUser>({
    email: {type: String, required: true},
    name: {type: String, required: true},
    image: {type: String, required: true},
}, {timestamps: true});

const VaxEventSchema = new mongoose.Schema<IVaxEvent>({
    date: {type: String, required: true},
    vaxId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId,
}, {timestamps: true});

const VaxSchema = new mongoose.Schema<IVax>({
    brand: {type: String, required: true},
    product: {type: String, required: true},
}, {timestamps: true});

export const UserModel = mongoose.models.user || mongoose.model("user", UserSchema);
export const VaxEventModel = mongoose.models.vaxEvent || mongoose.model("vaxEvent", VaxEventSchema);
export const VaxModel = mongoose.models.vaxModel || mongoose.model("vaxModel", VaxSchema);

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

export interface IVaxEventAgg extends IVaxEvent {
    vax: HydratedDocument<IVax>,
}

export interface IVax {
    brand: string,
    product: string,
}