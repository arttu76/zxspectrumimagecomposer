import { useEffect, useRef } from "react";
import "../styles/CustomElements.scss";

import { Icon } from "./Icon";

interface CommonCustomElementProps {
    dimmed?: boolean;
    tooltip: string;
}

export const Button: React.FC<
    CommonCustomElementProps
    & {
        icon?: string;
        hotkey?: string;
    }
    & React.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
    const { dimmed = false, tooltip, hotkey, icon, ...buttonProps } = props;
    const tooltipContent = tooltip + (hotkey ? ` (${hotkey})` : '');

    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!hotkey) return;

        const handleKeyDown = (e: KeyboardEvent) => e.key.toLowerCase() === hotkey.toLowerCase() && buttonRef.current?.click();
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return <button
        ref={buttonRef}
        className="CustomElements"
        style={{ opacity: dimmed ? 0.5 : 1 }}
        {...buttonProps}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={tooltipContent}>
        {icon && <Icon icon={icon} tooltip={tooltipContent} />}
        {props.children}
    </button>
}

export const Input: React.FC<
    CommonCustomElementProps
    & React.InputHTMLAttributes<HTMLInputElement>
    & {
        hotkey?: string;
        hotkeyFunc?: () => void;
    }
> = (props) => {
    const { dimmed, tooltip, hotkey, hotkeyFunc, ...inputProps } = props;

    if (props.type === 'checkbox') {
        return <Icon
            className={"CustomElements InputCustomElements_" + props.type}
            style={{ opacity: dimmed ? 0.5 : 1 }}
            {...inputProps}
            onPaste={undefined}
            icon={props.checked ? 'select_check_box' : 'check_box_outline_blank'}
            onClick={props.onClick}
            data-tooltip-id="my-tooltip"
            tooltip={tooltip}
        />
    }

    useEffect(() => {
        if (!hotkey || !hotkeyFunc) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === hotkey.toLowerCase()) {
                hotkeyFunc();
            }
        }
        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return <input
        className="CustomElements"
        style={{ opacity: dimmed ? 0.5 : 1 }}
        {...inputProps}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={tooltip} />
}
