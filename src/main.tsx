import 'material-symbols';
import 'react-tooltip/dist/react-tooltip.css';
import './main.scss';

import ReactDOM from 'react-dom/client';
import { App } from './components/App.tsx';

import { Provider } from "react-redux";
import store from "./store/store.ts";

import React from 'react';
import { Tooltip } from 'react-tooltip';
import { setLayerRequireAdjustedPixelsRefresh, setLayerRequirePatternCacheRefresh, setLayerRequireSpectrumPixelsRefresh, setLayerX } from './store/layersSlice.ts';

// trigger initial repaint
store.getState().layers.layers.forEach(layer => {
  store.dispatch(setLayerRequireAdjustedPixelsRefresh({ layer, required: true }));
  store.dispatch(setLayerRequireSpectrumPixelsRefresh({ layer, required: true }));
  store.dispatch(setLayerRequirePatternCacheRefresh({ layer, required: true }));
  // make real change to trigger change
  store.dispatch(setLayerX({ layer, x: layer.x }));
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <Tooltip id="my-tooltip" />
    </Provider>
  </React.StrictMode>
)
