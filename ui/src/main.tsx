import 'material-symbols';
import 'react-tooltip/dist/react-tooltip.css';
import './main.scss';

import ReactDOM from 'react-dom/client';
import App from './components/App.tsx';

import { Provider } from "react-redux";
import store from "./store/store.ts";

import { Tooltip } from 'react-tooltip';
import { setLayerX } from './store/layersSlice.ts';

// trigger initial repaint
store.getState().layers.layers.forEach(layer => {
  // triggers change in adjusted pixels and speccy pixels
  store.dispatch(setLayerX({ layer, x: layer.x }));
});

// no <React.StrictMode> because it breaks react-dnd
ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
    <Tooltip id="my-tooltip" />
  </Provider>
)
