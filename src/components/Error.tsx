import { useState } from 'react';
import { useAppSelector } from '../store/store';
import '../styles/Error.scss';

export const Error = () => {
    const error = useAppSelector(state => state.housekeeping.error);
    const [errorHidden, setErrorHidden] = useState(false);

    return error && <div
        className={"Error" + (errorHidden ? ' hidden' : '')}
        onClick={() => setErrorHidden(!errorHidden)}>{error}</div>
};
