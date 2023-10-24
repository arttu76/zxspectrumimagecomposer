import { MouseEventHandler } from "react";
import { Undefinable } from "../types";

export const Icon: React.FC<{
    icon: string;
    onClick?: Undefinable<MouseEventHandler>;
    className?: string;

    onPaste?: (event: React.ClipboardEvent<HTMLDivElement>) => void
}> = ({ icon, onClick, className, onPaste }) => <>
    <span
        className={`Icon material-symbols-outlined ${className || ''}`}
        onClick={e => onClick && onClick(e)}
    >{icon}</span>
    {onPaste && <>
        <div
            className="IconPasteArea"
            data-tooltip-id="my-tooltip"
            data-tooltip-content="Copy image from somewhere, then right-click the icon and select 'Paste'"
            contentEditable={true}
            onPaste={onPaste}></div>
    </>}
</>