import { useEffect } from 'react';
import '../styles/App.scss';

import { Layers } from "./Layers";
import { Screen } from "./Screen";
import { Toolbar } from "./Toolbar";

export const App = () => {

  useEffect(() => {
    const resize = () => {

      const toolbarHeight = document.querySelector('.Toolbar')?.clientHeight;
      if (toolbarHeight) {
        document.querySelectorAll('.AppContainer > *').forEach(
          el => (el as HTMLElement).style.height = `calc(100vh - ${toolbarHeight}px)`
        );
      }
    }

    window.addEventListener('resize', resize);
    resize();

    return () => window.removeEventListener('resize', resize);
  }, []);

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
