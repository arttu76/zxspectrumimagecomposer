import { useEffect } from 'react';
import '../styles/App.scss';

import { useAppSelector } from '../store/store';
import { Error } from './Error';
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

          const screen: HTMLDivElement | null = document.querySelector('.Screen');
          if (screen) {
            const bestZoomLevel = Math.min(
              Math.floor(screen.offsetWidth / 256),
              Math.floor(screen.offsetHeight / 192)
            );
            const zoomButtons = Array.from(document.querySelectorAll('.ZoomButtonContainer button')) as HTMLElement[];
            const resetZoomButtons = () => zoomButtons.forEach(zb => zb.style.fontStyle = 'inherit');
            zoomButtons.forEach(zb => {
              if (parseInt(zb.innerText, 10) <= bestZoomLevel) {
                resetZoomButtons();
                zb.style.fontStyle = 'italic';
              }
            });
          }


        }, 50);
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
      <Error />
    </>
  )
}
