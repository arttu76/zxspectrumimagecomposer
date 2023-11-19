import { useEffect } from 'react';
import '../styles/App.scss';

import { useAppSelector } from '../store/store';
import { Layers } from "./Layers";
import { Screen } from "./Screen";
import { Splash } from './Splash';
import { Toolbar } from "./Toolbar";

export const App = () => {

  const currentTool = useAppSelector((state) => state.tools.tool);

  useEffect(() => {
    const resize = () => {
      setTimeout(
        () => {

          const toolbarHeight = document.querySelector('.Toolbar')?.clientHeight;
          if (toolbarHeight) {
            document.querySelectorAll('.AppContainer > *').forEach(
              el => (el as HTMLElement).style.height = `calc(100vh - ${toolbarHeight}px)`
            );
          }
        }, 500);
    }

    window.addEventListener('resize', resize);
    resize();

    return () => window.removeEventListener('resize', resize);
  }, [currentTool]);

  return (
    <>
      <div className="App">
        <Toolbar></Toolbar>
        <div className="AppContainer">
          <Screen />
          <Layers />
        </div>
      </div>
      <Splash />
    </>
  )
}
