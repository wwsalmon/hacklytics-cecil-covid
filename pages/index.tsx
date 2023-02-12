import { GetServerSidePropsContext } from "next";
import { getSession, signOut } from "next-auth/react";
import mongoose, { HydratedDocument } from "mongoose";
import { IUser, IVaxEvent, UserModel } from "../models/models";
import { createAccount } from "../utils/createAccount";
import { cleanForJSON } from "../utils/cleanForJson";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import H2 from "../components/H2";
import H1 from "../components/H1";
import { addDays, differenceInDays, format } from "date-fns";
import { dateOnly } from "../utils/dateOnly";
import * as d3 from "d3";
import temp from "../data/temp.json";
import temp2 from "../data/temp2.json";
import vaxModels from "../data/vaxModels.json";
import primary from "../data/primary.json";

const chartPadding = {
    top: 8,
    left: 32,
    bottom: 48,
    right: 8,
};

function addImmunity(svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>, vaxEvents: HydratedDocument<IVaxEvent>[], data: {VE: number, days: number}[], xScale: d3.ScaleTime<number, number>, yScale: d3.ScaleLinear<number, number>, type: "infection" | "death" | "severe") {
    const color = {
        infection: "#ffa600",
        severe: "#ff0000",
        death: "black",
    }[type];

    const immunitySeries = vaxEvents.sort((a, b) => +new Date(a.date) - +new Date(b.date)).map((d, i, a) => {
        const numDays = differenceInDays(a[i + 1] ? dateOnly(a[i+1].date) : addDays(new Date(), 365), dateOnly(d.date));
        const thisData = primary.filter(x => x.vaccine === d.vaxId && x.outcome_category === type).filter(x => x.days < numDays).map(x => ({
            ...x,
            date: addDays(dateOnly(d.date), x.days),
        }));
        return thisData;
    });

    const seriesGroups = svg.selectAll("g.immunitySeries" + type).data(immunitySeries).join("g").attr("class", "immunitySeries" + type);

    svg.selectAll("path.immunity" + type).remove();
    svg.selectAll("path.immunityConfidence" + type).remove();

    for (let series of immunitySeries) {
        svg.append("path")
            .datum(series.sort((a, b) => +new Date(a.date) - +new Date(b.date)))
            .attr("class", "immunityConfidence" + type)
            .attr("d", d3.area()
                .x(d => xScale(dateOnly(d.date)) + chartPadding.left)
                .y0(d => yScale(d.LCL) + chartPadding.top)
                .y1(d => yScale(d.UCL) + chartPadding.top)
            )
            .attr("fill", color)
            .style("opacity", 0.2);

        svg.append("path")
            .datum(series.sort((a, b) => +new Date(a.date) - +new Date(b.date)))
            .attr("class", "immunity" + type)
            .attr("d", d3.line()
                .x(d => xScale(dateOnly(d.date)) + chartPadding.left)
                .y(d => yScale(d.VE) + chartPadding.top)
            )
            .attr("stroke", color)
            .attr("fill", "transparent")
            .attr("strokeWidth", 4);
    }

    seriesGroups.selectAll("circle.immunity" + type).data(d => d).join("circle").attr("class", "immunity" + type).attr("r", 5).attr("fill", color).attr("cx", d => xScale(d.date) + chartPadding.left).attr("cy", d => yScale(d.VE) + chartPadding.top);
}

export default function Index({ thisUser }: {
    thisUser: HydratedDocument<IUser>,
}) {
    const [vaxEvents, setVaxEvents] = useState<HydratedDocument<IVaxEvent>[]>([]);
    const [date, setDate] = useState<string>("");
    const [vaxId, setVaxId] = useState<string>("Pfizer 1st and 2nd doses"); // temporarily fixed;
    const [iter, setIter] = useState<number>(0);

    const svgRef = useRef<SVGSVGElement | null>(null);
    const axisRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        const axisSvg = d3.select(axisRef.current);
        const svgWidth = axisSvg.node().getBoundingClientRect().width;
        const svgHeight = 400;
        const chartWidth = svgWidth - chartPadding.left - chartPadding.right;
        const chartHeight = svgHeight - chartPadding.top - chartPadding.bottom;

        const xMax = addDays(new Date(), 365);
        const xMin = dateOnly("2019-01-01");
        const xRangeDays = differenceInDays(xMax, xMin);
        const xPerDay = chartWidth / (365);
        const xRange = xRangeDays * xPerDay;

        svg.attr("width", xRange);
        svg.attr("height", svgHeight);

        const xScale = d3.scaleTime().domain([xMin, xMax]).range([0, xRange]);
        const xAxis = d3.axisBottom(xScale).ticks(xRangeDays / (365/12)).tickFormat(d3.timeFormat("%b"));
        const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);
        const yAxis = d3.axisLeft(yScale);

        svg.selectAll(".xAxis").remove();
        svg.append("g").attr("class", "xAxis").attr("transform", `translate(${chartPadding.left}, ${chartPadding.top + chartHeight})`).call(xAxis);

        axisSvg.selectAll(".yAxis").remove();
        axisSvg.append("g")
            .attr("class", "yAxis")
            .attr("transform", `translate(${chartPadding.left}, ${chartPadding.top})`)
            .call(yAxis)
            .call(g => {
                g.selectAll(".domain").remove();

                g.selectAll(".tickExtended").remove();

                g.selectAll(".tick line").clone()
                    .attr("x2", chartWidth)
                    .attr("class", "tickExtended")
                    .attr("stroke-opacity", 0.05);
            });

        // add vaxEvent lines
        svg.selectAll("line.vax").data(vaxEvents).join("line").attr("class", "vax").attr("x1", d => xScale(dateOnly(d.date)) + chartPadding.left).attr("x2", d => xScale(dateOnly(d.date)) + chartPadding.left).attr("y1", chartPadding.top).attr("y2", chartPadding.top + chartHeight).attr("stroke", "red").attr("stroke-width", 2);
        svg.selectAll("text.vax").data(vaxEvents).join("text").attr("class", "vax").attr("x", d => xScale(dateOnly(d.date)) + chartPadding.left + 8).attr("y", chartPadding.top + 8).text(d => `${format(dateOnly(d.date), "MMMM d, yyyy")} ${d.vaxId}`).attr("fill", "red");

        // add vaxEvent immunity
        addImmunity(svg, vaxEvents, temp, xScale, yScale, "infection");
        addImmunity(svg, vaxEvents, temp, xScale, yScale, "death");
        addImmunity(svg, vaxEvents, temp, xScale, yScale, "severe");

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
            <H1>Immunity graph</H1>
            <div className="relative overflow-y-hidden" style={{height: 400, width: "100%"}}>
                <svg ref={axisRef} className="absolute top-0 left-0 w-full" style={{height: 400}}/>
                <div className="absolute top-0 left-0 w-full overflow-x-auto overflow-y-hidden" style={{height: 400}}>
                    <svg ref={svgRef}/>
                </div>
            </div>
            <hr className="my-8"/>
            <H1>Vaccinations</H1>
            <H2>Add vaccination</H2>
            <div className="flex items-center">
                <input type="date" min="2019-01-01" max={format(addDays(new Date(), 1), "yyyy-MM-dd")} className="p-2 border mr-4" value={date} onChange={e => setDate(e.target.value)}/>
                <select className="p-2 border mr-4" value={vaxId} onChange={e => setVaxId(e.target.value)}>
                    {vaxModels.map(d => (
                        <option value={d} key={d}>{d}</option>
                    ))}
                </select>
                <button onClick={onAdd} className="p-2 bg-black text-white disabled:opacity-50" disabled={!date}>Add</button>
            </div>
            <H2>Vaccination record</H2>
            {vaxEvents.map(d => (
                <div className="p-4 border rounded-md my-2 shadow-md" key={d._id.toString()}>
                    <p>{format(dateOnly(d.date), "MMMM d, yyyy")}, {d.vaxId}</p>
                    <button className="bg-black p-2 text-white" onClick={() => onDelete(d._id.toString())}>Delete</button>
                </div>
            ))}
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
