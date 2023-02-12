import { NextApiHandler } from "next";
import nextApiEndpoint from "../../utils/nextApiEndpoint";
import { VaxEventModel } from "../../models/models";
import { res200, res400, res403, res404 } from "next-response-helpers";

const handler: NextApiHandler = nextApiEndpoint({
    getFunction: async (req, res, session, thisUser) => {
        const vaxEvents = await VaxEventModel.find({userId: thisUser._id});

        return res200(res, {vaxEvents});
    },
    postFunction: async (req, res, session, thisUser) => {
        const {vaxId, date} = req.body;

        if (!vaxId || !date) return res400(res);

        await VaxEventModel.create({
            vaxId,
            date,
            userId: thisUser._id,
        });

        return res200(res);
    },
    deleteFunction: async (req, res, session, thisUser) => {
        if (!req.body.id) return res400(res);

        const thisItem = await VaxEventModel.findById(req.body.id);

        if (!thisItem) return res404(res);

        if (!thisItem.userId.equals(thisUser._id)) return res403(res);

        await VaxEventModel.deleteOne({_id: req.body.id});

        return res200(res);
    }
});

export default handler;