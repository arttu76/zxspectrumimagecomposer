import '../styles/App.scss';

import { Layers } from "./Layers";
import { Screen } from "./Screen";
import { Toolbar } from "./Toolbar";

function App() {
  return (
    <>
      <div className="App">
        <Toolbar></Toolbar>
        <div className="AppContainer">
          <Screen />
          <Layers />
        </div>
      </div>
    </>
  )
}

export default App
