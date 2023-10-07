import '../styles/LayerPropertyGroup.scss';

import React from 'react';
import { Button } from './CustomElements';

export const LayerProperyGroup: React.FC<React.PropsWithChildren<{
    title: string;
}>> = ({ title, children }) => {
    const [expanded, setExpanded] = React.useState(true);
    return <div className="LayerPropertyGroup">
        <div className="title"
            onClick={() => setExpanded(!expanded)}>
            {title}
            <Button
                tooltip={expanded ? 'Hide attributes' : 'Show attributes'}
                icon={expanded ? 'do_not_disturb_on' : 'add_circle'}
            />
        </div>
        {expanded && children}
    </div>
}
