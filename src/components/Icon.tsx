import { MouseEventHandler } from "react";
import { Undefinable } from "../types";

export const Icon: React.FC<{
    icon: string;
    onClick?: Undefinable<MouseEventHandler>;
    className?: string;

    tooltip?: string;

    onPaste?: (event: React.ClipboardEvent<HTMLDivElement>) => void
}> = ({ icon, onClick, className, tooltip }) => <>
    <span
        className={`Icon material-symbols-outlined ${className || ''}`}
        onClick={e => onClick && onClick(e)}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={tooltip}
    >{icon}</span>
</>