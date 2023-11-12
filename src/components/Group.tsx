import '../styles/Group.scss';

import React from 'react';
import { Button } from './CustomElements';

export const Group: React.FC<React.PropsWithChildren<{
    title: string;
    disableClose?: boolean;
    cornerIcon?: string;
    cornerIconTooltip?: string;
    cornerIconOnClick?: () => void;
    className?: string;
}>> = ({
    title,
    disableClose = false,
    children,
    cornerIcon = '',
    cornerIconTooltip = '',
    cornerIconOnClick = () => { },
    className = ''
}) => {
        const [expanded, setExpanded] = React.useState(true);
        return <div className={"Group " + className}>
            {cornerIcon && <Button
                className="removePropertyGroupButton"
                tooltip={cornerIconTooltip}
                icon={cornerIcon}
                onClick={cornerIconOnClick} />}

            <div className={"GroupTitle" + (disableClose ? '' : ' canBeClosed')}
                onClick={() => !disableClose && setExpanded(!expanded)}>
                {title}
                {!disableClose && <Button
                    tooltip={expanded ? 'Minimize related attributes' : 'Show related attributes'}
                    icon={expanded ? 'do_not_disturb_on' : 'add_circle'}
                />}
            </div>
            {expanded && <div className="GroupContent">
                {children}
            </div>}
        </div>
    }
