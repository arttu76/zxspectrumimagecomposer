import React from "react";

import {Screen} from "./Screen";
import {Layers} from "./Layers";
import {Toolbar} from "./Toolbar";

const reset=() => {
    localStorage.clear();
    window.location.reload();
}

const App = () => (
    <div>
    <div style={{margin: '5px', borderRadius: '10px', padding: "10px", backgroundColor: "#333333", color: "#999" }}>
        <Toolbar></Toolbar>
        <div style={{display: 'flex', alignItems: 'flex-start'}}>
            <div style={{flex: '1px 1px auto', margin: '20px' }}>
                <Screen/>
            </div>
            <div style={{flex: '0 0 570px', margin: '20px 20px 20px 0'}}>
                <Layers/>
            </div>
        </div>
    </div>
    <button onClick={reset}>Reset</button>
    </div>
);

export default App;
