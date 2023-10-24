import { repaint } from "./repaintSlice";

const repaintScreenMiddleware = (storeApi: any) => (next: any) => (action: any) => {

    const originalActionResult = next(action);

    if (['x'
    ].includes(action.type)) {
        storeApi.dispatch(repaint());
    }

    return originalActionResult;
};

export default repaintScreenMiddleware;
