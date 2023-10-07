import './main.scss'
import 'material-symbols';
import 'react-tooltip/dist/react-tooltip.css';

import ReactDOM from 'react-dom/client'
import App from './components/App.tsx'

import { Provider } from "react-redux";
import store from "./store/store.ts";

import { Tooltip } from 'react-tooltip'

// no <React.StrictMode> because it breaks react-dnd
ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <App />
    <Tooltip id="my-tooltip" />
  </Provider>
)
