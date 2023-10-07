interface CommonCustomElementProps {
    dimmed?: boolean;
    tooltip: string;
}

export const Button: React.FC<
    CommonCustomElementProps
    & {
        icon?: string;
        content?: string;
        hotkey?: string;
    }
    & React.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
    const { dimmed, tooltip, hotkey, icon, content, ...buttonProps } = props;
    return <button
        style={{ opacity: dimmed ? 0.5 : 1 }}
        {...buttonProps}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={tooltip + (hotkey ? ` (${hotkey})` : '')}>
        {icon
            ? <span className="Icon material-symbols-outlined">{icon}</span>
            : content}
    </button>
}

export const Input: React.FC<
    CommonCustomElementProps
    & React.InputHTMLAttributes<HTMLInputElement>
> = (props) => {
    const { dimmed, tooltip, ...inputProps } = props;
    return <input
        style={{ opacity: dimmed ? 0.5 : 1 }}
        {...inputProps}
        data-tooltip-id="my-tooltip"
        data-tooltip-content={tooltip} />
}
