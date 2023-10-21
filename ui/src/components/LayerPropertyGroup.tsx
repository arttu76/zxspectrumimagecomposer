import '../styles/LayerPropertyGroup.scss';

import React from 'react';
import { Button } from './CustomElements';

export const LayerProperyGroup: React.FC<React.PropsWithChildren<{
    title: string;
    disableClose?: boolean;
    cornerIcon?: string;
    cornerIconTooltip?: string;
    cornerIconOnClick?: () => void;
}>> = ({
    title,
    disableClose = false,
    children,
    cornerIcon = '',
    cornerIconTooltip = '',
    cornerIconOnClick = () => { }
}) => {
        const [expanded, setExpanded] = React.useState(true);
        return <div className="LayerPropertyGroup">
            {cornerIcon && <Button
                className="removePropertyGroupButton"
                tooltip={cornerIconTooltip}
                icon={cornerIcon}
                onClick={cornerIconOnClick} />}

            <div className={"LayerPropertyGroupTitle" + (disableClose ? '' : ' canBeClosed')}
                onClick={() => !disableClose && setExpanded(!expanded)}>
                {title}
                {!disableClose && <Button
                    tooltip={expanded ? 'Minimize related attributes' : 'Show related attributes'}
                    icon={expanded ? 'do_not_disturb_on' : 'add_circle'}
                />}
            </div>
            {expanded && <div className="LayerPropertyGroupContent">
                {children}
            </div>}
        </div>
    }
