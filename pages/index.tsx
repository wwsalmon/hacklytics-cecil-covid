import { GetServerSidePropsContext } from "next";
import { getSession } from "next-auth/react";
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
import vaxModels from "../data/vaxModels.json";
import primary from "../data/primary.json";
import Navbar from "../components/Navbar";

const chartPadding = {
    top: 8,
    left: 32,
    bottom: 48,
    right: 8,
};

function getSeriesData(vaxEvents: HydratedDocument<IVaxEvent>[], type: "infection" | "death" | "severe") {
    if (!vaxEvents.length) return [];

    return vaxEvents.sort((a, b) => +new Date(a.date) - +new Date(b.date)).map((d, i, a) => {
        const endDate = a[i + 1] ? dateOnly(a[i+1].date) : addDays(new Date(), 365);
        const numDays = differenceInDays(endDate, dateOnly(d.date));
        const thisSeriesData = primary.filter(x => x.vaccine === d.vaxId && x.outcome_category === type).sort((a, b) => a.days - b.days);
        let thisData = thisSeriesData.filter(x => x.days < numDays).map(x => ({
            ...x,
            date: addDays(dateOnly(d.date), x.days),
        }));

        if (!thisData.length) return [];

        if (thisData.length < thisSeriesData.length) {
            const lastPoint = thisData[thisData.length - 1];
            const nextPoint = thisSeriesData[thisData.length];
            const diffDays = nextPoint.days - lastPoint.days;
            const extraDays = numDays - lastPoint.days;

            let extraPoint = {
                date: endDate,
                VE: 0,
                UCL: 0,
                LCL: 0,
            }

            for (let property of ["VE", "UCL", "LCL"]) {
                const change = nextPoint[property] - lastPoint[property];
                const rate = change / diffDays;
                extraPoint[property] = lastPoint[property] + rate * extraDays;
            }

            thisData.push(extraPoint);
        }
        return thisData;
    });
}

function getCurrentStat(vaxEvents: HydratedDocument<IVaxEvent>[], type: "infection" | "death" | "severe") {
    const thisStat = getSeriesData(vaxEvents, type).reduce((a, b) => [...a, ...b], []).sort((a, b) => +new Date(a.date) - +new Date(b.date));

    if (!thisStat.length) return 0;

    if (+new Date(thisStat[thisStat.length - 1].date) < +new Date()) {
        return "<" + thisStat[thisStat.length - 1].VE.toPrecision(3);
    }

    const nextStatIndex = thisStat.findIndex(d => +new Date(d.date) > +new Date());
    if (nextStatIndex === 0) return 0;

    const nextStat = thisStat[nextStatIndex];
    const prevStat = thisStat[nextStatIndex - 1];
    const change = nextStat.VE - prevStat.VE;
    const diffDays = differenceInDays(nextStat.date, prevStat.date);
    const rate = change / diffDays;
    const daysToPresent = differenceInDays(new Date(), prevStat.date);
    return (prevStat.VE + rate * daysToPresent).toPrecision(3);
}

function addImmunity(svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>, vaxEvents: HydratedDocument<IVaxEvent>[], xScale: d3.ScaleTime<number, number>, yScale: d3.ScaleLinear<number, number>, type: "infection" | "death" | "severe") {
    const color = {
        infection: "#FED752",
        severe: "#FC3142",
        death: "black",
    }[type];

    const immunitySeries = getSeriesData(vaxEvents, type);

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
            .attr("stroke-width", 4);
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
    const divRef = useRef<HTMLDivElement | null>(null);

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
        const xPerDay = chartWidth / (365 * 2);
        const xRange = xRangeDays * xPerDay;

        svg.attr("width", xRange);
        svg.attr("height", svgHeight);

        const xScale = d3.scaleTime().domain([xMin, xMax]).range([0, xRange]);
        const xAxis = d3.axisBottom(xScale).ticks(xRangeDays / (365/12)).tickFormat(d3.timeFormat("%b"));
        const yScale = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);
        const yAxis = d3.axisLeft(yScale);

        if (vaxEvents.length) {
            const firstDay = vaxEvents.sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
            const firstX = xScale(new Date(firstDay.date));

            divRef.current.scrollLeft = firstX - 32;
        }

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
        svg.selectAll("line.vax").data(vaxEvents).join("line").attr("class", "vax").attr("x1", d => xScale(dateOnly(d.date)) + chartPadding.left).attr("x2", d => xScale(dateOnly(d.date)) + chartPadding.left).attr("y1", chartPadding.top).attr("y2", chartPadding.top + chartHeight).attr("stroke", "#FC3142").attr("stroke-width", 2).attr("stroke-dasharray", 4);
        svg.selectAll("text.vaxDate").data(vaxEvents).join("text").attr("class", "vaxDate").attr("x", d => xScale(dateOnly(d.date)) + chartPadding.left + 12).attr("y", chartPadding.top + chartHeight - 32).text(d => format(dateOnly(d.date), "MMMM d, yyyy")).attr("fill", "#FC3142").attr("font-size", 12).style("text-transform", "uppercase").style("font-weight", 700);
        svg.selectAll("text.vax").data(vaxEvents).join("text").attr("class", "vax").attr("x", d => xScale(dateOnly(d.date)) + chartPadding.left + 12).attr("y", chartPadding.top + chartHeight - 12).text(d => d.vaxId).attr("fill", "#FC3142");

        svg.selectAll("line.present").data([0]).join("line").attr("class", "present").attr("x1", xScale(new Date()) + chartPadding.left).attr("x2", xScale(new Date()) + chartPadding.left).attr("y1", chartPadding.top).attr("y2", chartPadding.top + chartHeight).attr("stroke", "black").attr("stroke-width", 2).attr("stroke-dasharray", 4);
        svg.selectAll("text.present").data([0]).join("text").attr("class", "present").attr("x", xScale(new Date()) + chartPadding.left + 12).attr("y", chartPadding.top + 12).text("today").attr("font-size", 12).style("text-transform", "uppercase").style("font-weight", 700);

        // add vaxEvent immunity
        addImmunity(svg, vaxEvents, xScale, yScale, "infection");
        addImmunity(svg, vaxEvents, xScale, yScale, "death");
        addImmunity(svg, vaxEvents, xScale, yScale, "severe");

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
        <>
            <Navbar thisUser={thisUser}/>
            <div className="w-full mx-auto px-4 py-8">
                <H2 className="text-center text-2xl my-6">Your current<br/>vaccine effectiveness</H2>
                <p className="text-center text-9xl font-garamond font-extrabold"><span className="bg-infection leading-none inline-block px-4">{getCurrentStat(vaxEvents, "infection")}%</span></p>
                <p className="text-center opacity-75 mt-8 mb-8">less likely to get infected compared to unvaccinated</p>
                <hr className="my-8"/>
                <p className="text-center text-lg"><span className="font-garamond font-bold text-xl text-accent">{getCurrentStat(vaxEvents, "death")}%</span> less likely to <b>die</b> from COVID</p>
                <p className="text-center text-lg"><span className="font-garamond font-bold text-xl text-accent">{getCurrentStat(vaxEvents, "severe")}%</span> less likely to suffer <b>severe illness</b> from COVID</p>
                <hr className="my-8"/>
                <H1 className="text-center mb-8 mt-16">Effectiveness over time</H1>
                <div className="flex items-center justify-center -mx-6 mb-16">
                    <span className="opacity-75 mr-6">Against:</span>
                    <div className="flex items-center px-6">
                        <div className="w-4 h-4 bg-accent mr-3"/>
                        <span>Severe illness</span>
                    </div>
                    <div className="flex items-center px-6">
                        <div className="w-4 h-4 bg-[#FED752] mr-3"/>
                        <span>Infection</span>
                    </div>
                    <div className="flex items-center px-6">
                        <div className="w-4 h-4 bg-black mr-3"/>
                        <span>Death</span>
                    </div>
                </div>
                <div className="relative overflow-y-hidden" style={{height: 400, width: "100%"}}>
                    <svg ref={axisRef} className="absolute top-0 left-0 w-full" style={{height: 400}}/>
                    <div className="absolute top-0 left-0 w-full overflow-x-auto overflow-y-hidden" style={{height: 400}} ref={divRef}>
                        <svg ref={svgRef}/>
                    </div>
                </div>
                <div className="max-w-lg mx-auto my-12 text-sm opacity-50">
                    <p>Sources:</p>
                    <ul className="list-disc pl-4 my-2">
                        <li className="my-2"><b>Primary series: Lin, Dan-Yu, et al. 2022 (n = 10.6 million)</b>. “Association of Primary and Booster Vaccination and Prior Infection with SARS-COV-2 Infection and Severe COVID-19 Outcomes.” JAMA, vol. 328, no. 14, 2022, p. 1415., https://doi.org/10.1001/jama.2022.17876.</li>
                        <li className="my-2"><b>First booster: Tseng, Hung Fu, et al. 2023 (n = 123,236)</b>. “Effectiveness of Mrna-1273 Vaccination against SARS-COV-2 Omicron Subvariants BA.1, Ba.2, Ba.2.12.1, Ba.4, and Ba.5.” Nature Communications, vol. 14, no. 1, 2023, https://doi.org/10.1038/s41467-023-35815-7.</li>
                        <li className="my-2"><b>Second booster: Ferdinants, Jill M, et al. 2022 (n = 893,461)</b>. “Waning of Vaccine Effectiveness against Moderate and Severe COVID-19 among Adults in the US from the Vision Network: Test Negative, Case-Control Study.” BMJ, 2022, https://doi.org/10.1136/bmj-2022-072141.</li>
                    </ul>
                </div>
                <hr className="my-8"/>
                <div className="max-w-lg mx-auto">
                    <H1 className="text-center mb-8 mt-16">Vaccinations</H1>
                    {vaxEvents.map(d => (
                        <div className="p-4 border rounded-md my-4 shadow-md flex items-center" key={d._id.toString()}>
                            <div>
                                <p className="font-bold uppercase text-sm">{format(dateOnly(d.date), "MMMM d, yyyy")}</p>
                                <p className="text-lg">{d.vaxId}</p>
                            </div>
                            <button className="bg-red-500 hover:bg-red-700 p-2 text-white ml-auto text-sm rounded-md" onClick={() => onDelete(d._id.toString())}>Delete</button>
                        </div>
                    ))}
                    <div className="p-4 border rounded-md my-2 bg-gray-100">
                        <H2 className="mb-4">Add vaccination</H2>
                        <div className="flex items-center">
                            <input type="date" min="2019-01-01" max={format(addDays(new Date(), 1), "yyyy-MM-dd")} className="p-2 border mr-4" value={date} onChange={e => setDate(e.target.value)}/>
                            <select className="p-2 border mr-4" value={vaxId} onChange={e => setVaxId(e.target.value)}>
                                {vaxModels.map(d => (
                                    <option value={d} key={d}>{d}</option>
                                ))}
                            </select>
                            <button onClick={onAdd} className="p-2 rounded-md text-sm ml-auto w-24 bg-black text-white disabled:opacity-50" disabled={!date}>Add</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context);

    if (!session) return { redirect: { permanent: false, destination: "/signin" } };

    try {
        mongoose.set("strictQuery", false);

        await mongoose.connect(process.env.MONGODB_URL as string);

        let thisUser = await UserModel.findOne({email: session.user.email});

        if (!thisUser) thisUser = await createAccount(session.user);

        return {props: {thisUser: cleanForJSON(thisUser)}};
    } catch (e) {
        console.log(e);
        return { notFound: true };
    }
}
