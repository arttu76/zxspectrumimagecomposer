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
    const { dimmed, tooltip, hotkey, icon, ...buttonProps } = props;
    return <button
        className="CustomElements"
        style={{ opacity: dimmed ? 0.5 : 1 }}
        {...buttonProps}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={tooltip + (hotkey ? ` (${hotkey})` : '')}>
        {icon && <Icon icon={icon} />}
        {props.children}
    </button>
}

export const Input: React.FC<
    CommonCustomElementProps
    & React.InputHTMLAttributes<HTMLInputElement>
> = (props) => {
    const { dimmed, tooltip, ...inputProps } = props;

    if (props.type === 'checkbox') {
        return <Icon
            className={"CustomElements InputCustomElements_" + props.type}
            style={{ opacity: dimmed ? 0.5 : 1 }}
            {...inputProps}
            onPaste={undefined}
            icon={props.checked ? 'select_check_box' : 'check_box_outline_blank'}
            onClick={props.onClick}
            tooltip={tooltip}
        />
    }


    return <input
        className="CustomElements"
        style={{ opacity: dimmed ? 0.5 : 1 }}
        {...inputProps}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={tooltip} />
}
