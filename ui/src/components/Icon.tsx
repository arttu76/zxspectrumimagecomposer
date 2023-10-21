import { MouseEventHandler } from "react";
import { Undefinable } from "../types";

export const Icon: React.FC<{
    icon: string;
    onClick?: Undefinable<MouseEventHandler>;
    className?: string;
}> = ({ icon, onClick, className }) => <span
    className={`Icon material-symbols-outlined ${className || ''}`}
    onClick={e => onClick && onClick(e)}
>{icon}</span>
