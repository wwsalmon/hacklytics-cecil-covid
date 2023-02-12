import { ComponentProps } from "react";
import classNames from "classnames";

export default function H1(props: ComponentProps<"h1">) {
    let domProps = {...props};
    delete domProps.className;

    return (
        <h1 className={classNames("font-semibold text-5xl font-garamond", props.className)} {...domProps}/>
    )
}