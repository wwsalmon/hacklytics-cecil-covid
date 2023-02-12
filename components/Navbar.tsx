import { HydratedDocument } from "mongoose";
import { signOut } from "next-auth/react";

import { IUser } from "../models/models";

export default function Navbar({thisUser}: {thisUser: HydratedDocument<IUser>}) {
    return (
        <div className="w-full fixed top-0 left-0 h-16 flex items-center px-4">
            <img src={thisUser.image} className="w-8 h-8 rounded-full" alt={`Profile picture of ${thisUser.name}`} />
            <span className="ml-4">{thisUser.name}</span>
            <button className="ml-auto" onClick={() => signOut()}>Sign out</button>
        </div>
    )
}