import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
import {signOut} from "next-auth/react";
import mongoose, { HydratedDocument } from "mongoose";
import { IUser, IVaxEventAgg, UserModel } from "../models/models";
import { createAccount } from "../utils/createAccount";
import { cleanForJSON } from "../utils/cleanForJson";
import { Fragment, useEffect, useRef, useState } from "react";
import axios from "axios";
import H2 from "../components/H2";
import H1 from "../components/H1";
import { addDays, differenceInDays, format } from "date-fns";
import { dateOnly } from "../utils/dateOnly";
import * as d3 from "d3";
import temp from "../data/temp.json";
import temp2 from "../data/temp2.json";

const chartPadding = {
    top: 8,
    left: 32,
    bottom: 32,
    right: 8,
};

function addImmunity(svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>, vaxEvents: HydratedDocument<IVaxEventAgg>[], data: {VE: number, days: number}[], xScale: d3.ScaleTime<number, number>, yScale: d3.ScaleLinear<number, number>, color: string, id: string) {
    const immunitySeries = vaxEvents.sort((a, b) => +new Date(a.date) - +new Date(b.date)).map((d, i, a) => {
        const numDays = differenceInDays(a[i + 1] ? new Date(a[i+1].date) : new Date(), new Date(d.date));
        const thisData = data.filter(x => x.days < numDays).map(x => ({
            ...x,
            date: addDays(new Date(d.date), x.days),
        }));
        return thisData;
    });

    const curveFunc = d3.line()
        .x(d => xScale(new Date(d.date)) + chartPadding.left)
        .y(d => yScale(d.VE) + chartPadding.top);

    const seriesGroups = svg.selectAll("g.immunitySeries" + id).data(immunitySeries).join("g").attr("class", "immunitySeries" + id);

    svg.selectAll("path.immunity" + id).remove();

    for (let series of immunitySeries) {
        svg.append("path").datum(series.sort((a, b) => +new Date(a.date) - +new Date(b.date))).attr("class", "immunity" + id).attr("d", curveFunc).attr("stroke", color).attr("fill", "transparent").attr("strokeWidth", 4);
    }

    seriesGroups.selectAll("circle.immunity" + id).data(d => d).join("circle").attr("class", "immunity" + id).attr("r", 5).attr("fill", color).attr("cx", d => xScale(d.date) + chartPadding.left).attr("cy", d => yScale(d.VE) + chartPadding.top);
}

export default function Index({ thisUser }: {
    thisUser: HydratedDocument<IUser>,
}) {
    const [vaxEvents, setVaxEvents] = useState<HydratedDocument<IVaxEventAgg>[]>([]);
    const [date, setDate] = useState<string>("");
    const [vaxId, setVaxId] = useState<string>("63e762e6d0f5352d49f1f0b1"); // temporarily fixed;
    const [iter, setIter] = useState<number>(0);

    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const svgWidth = svg.node().getBoundingClientRect().width;
        const svgHeight = 400;
        const chartWidth = svgWidth - chartPadding.left - chartPadding.right;
        const chartHeight = svgHeight - chartPadding.top - chartPadding.bottom;
        const xScale = d3.scaleTime().domain([new Date("2020-01-01"), new Date()]).range([0, chartWidth]);
        const xAxis = d3.axisBottom(xScale);
        const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);
        const yAxis = d3.axisLeft(yScale);
        svg.attr("height", svgHeight);

        svg.select("g.xAxis").node() && svg.select("g.xAxis").remove();
        svg.append("g").attr("class", "xAxis").attr("transform", `translate(${chartPadding.left}, ${chartPadding.top + chartHeight})`).call(xAxis);

        svg.select("g.yAxis").node() && svg.select("g.yAxis").remove();
        svg.append("g").attr("class", "yAxis").attr("transform", `translate(${chartPadding.left}, ${chartPadding.top})`).call(yAxis);

        // add vaxEvent lines
        svg.selectAll("line.vax").data(vaxEvents).join("line").attr("class", "vax").attr("x1", d => xScale(new Date(d.date)) + chartPadding.left).attr("x2", d => xScale(new Date(d.date)) + chartPadding.left).attr("y1", chartPadding.top).attr("y2", chartPadding.top + chartHeight).attr("stroke", "red").attr("strokeWidth", 4);

        // add vaxEvent immunity
        addImmunity(svg, vaxEvents, temp, xScale, yScale, "red", "red");
        addImmunity(svg, vaxEvents, temp2, xScale, yScale, "blue", "blue");

        svg.selectAll("path.vaxCurve").data(vaxEvents)
    }, [vaxEvents]);

    useEffect(() => {
        axios.get("/api/vaxEvent").then(res => {
            setVaxEvents(res.data.vaxEvents);
        }).catch(e => {
            console.log(e);
        });
    }, [iter]);

    function onAdd() {
        axios.post("/api/vaxEvent", {date, vaxId}).then(res => {
            setDate("");
            setIter(prev => prev + 1);
        }).catch(e => {
            console.log(e);
        });
    }

    function onDelete(id: string) {
        axios.delete("/api/vaxEvent", {
            data: {
                id: id,
            }
        }).then(res => {
            setIter(prev => prev + 1);
        }).catch(e => {
            console.log(e);
        });
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="p-4 bg-gray-100 rounded-md shadow-md border my-8">
                <H2>Account information</H2>
                <p>{thisUser.name} / {thisUser.email}</p>
                <img src={thisUser.image} alt="Profile picture" />
                <button onClick={() => signOut()}>Sign out</button>
            </div>
            <hr className="my-8"/>
            <H1>Vaccinations</H1>
            <H2>Add vaccination</H2>
            <div className="flex items-center">
                <input type="date" className="p-2 border mr-4" value={date} onChange={e => setDate(e.target.value)}/>
                <select className="p-2 border mr-4" value={vaxId} onChange={e => setVaxId(e.target.value)}>
                    <option value="63e762e6d0f5352d49f1f0b1">Pfizer dose 1</option>
                </select>
                <button onClick={onAdd} className="p-2 bg-black text-white">Add</button>
            </div>
            <H2>Vaccination record</H2>
            {vaxEvents.map(d => (
                <div className="p-4 border rounded-md my-2 shadow-md" key={d._id.toString()}>
                    <p>{format(dateOnly(d.date), "MMMM d, yyyy")}, {d.vax.brand} {d.vax.product}</p>
                    <button className="bg-black p-2 text-white" onClick={() => onDelete(d._id.toString())}>Delete</button>
                </div>
            ))}
            <hr className="my-8"/>
            <H1>Immunity graph</H1>
            <svg ref={svgRef} style={{width: "100%"}}/>
        </div>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context);

    if (!session) return { redirect: { permanent: false, destination: "/signin" } };

    try {
        await mongoose.connect(process.env.MONGODB_URL as string);

        let thisUser = await UserModel.findOne({email: session.user.email});

        if (!thisUser) thisUser = await createAccount(session.user);

        return {props: {thisUser: cleanForJSON(thisUser)}};
    } catch (e) {
        console.log(e);
        return { notFound: true };
    }
}
