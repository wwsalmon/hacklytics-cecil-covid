import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import H1 from "../components/H1";

export default function Lander() {
    const router = useRouter();

    return (
        <div className="w-full bg-gray-100 min-h-screen">
            <div className="flex items-center justify-center pt-8">
                <img src="/logo.png" className="w-24" alt="BoostOnTime logo" />
                <div className="ml-4">
                    <span className="font-garamond text-4xl">BoostOnTime</span><br/>
                    <span>a <a href="https://github.com/wwsalmon/hacklytics-cecil-covid" className="underline">Hacklytics project</a></span>
                </div>
            </div>
            <div className="flex items-center max-w-7xl mx-auto border-b py-8">
                <div className="w-1/2 pr-16">
                    <H1 className="text-7xl">How safe are COVID vaccines actually keeping you?</H1>
                    <p className="text-2xl mt-8 opacity-75 leading-normal">Find out how protected you are <b>based off of your personal vaccination history</b> — and the latest peer-reviewed studies.</p>
                    <button onClick={() => router.push("/signin")} className="p-4 text-xl bg-accent text-white font-bold mt-8 rounded-md hover:opacity-75 transition hover:shadow-xl shadow-md">Find out your number</button>
                </div>
                <img src="/top.png" alt="screenshot of app" className="shadow-2xl w-1/2 ml-auto my-8 rounded-md"/>
            </div>
            <div className="max-w-7xl mx-auto py-16 border-b">
                <H1 className="text-center">Make better decisions about COVID safety</H1>
                <img src="/timeline.png" alt="screenshot of app" className="my-16 rounded-md shadow-2xl"/>
                <div className="flex items-center justify-center">
                    <button onClick={() => router.push("/signin")} className="p-4 text-xl bg-accent text-white font-bold mt-8 rounded-md hover:opacity-75 transition hover:shadow-xl shadow-md">Get your timeline</button>
                </div>
            </div>
            <div className="max-w-7xl mx-auto py-16">
                <H1 className="text-center">Driven by peer-reviewed, large-scale research</H1>
                <img src="/sources.jpg" alt="collage of sources" className="my-4"/>
            </div>
        </div>
    )
}