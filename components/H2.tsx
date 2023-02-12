import { ComponentProps } from "react";
import classNames from "classnames";

export default function H2(props: ComponentProps<"h2">) {
    let domProps = {...props};
    delete domProps.className;

    return (
        <h2 className={classNames("font-bold uppercase my-6", props.className)} {...domProps}/>
    )
}