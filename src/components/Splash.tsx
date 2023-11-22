import { useAppSelector } from '../store/store';
import '../styles/Splash.scss';


import { useState } from 'react';

export const Splash = () => {

    const [showSplash, setShowSplash] = useState(true);

    const numberOfLayers = useAppSelector(state => state.layers.layers).length;

    return showSplash && numberOfLayers === 0 && <div className="Splash" onClick={() => setShowSplash(false)}>
        <div className="SplashContent">
            <div className="SplashImageContent">&nbsp;</div>
            <div className="SplashTextContent">
                <h1>
                    ZX Spectrum Image Composer
                </h1>
                Compose &amp; edit images and convert them to ZX Spectrum format.
                Manually edit pixels and attributes. Export full screen or part of screen as
                binary, assembler source or play back as a fake tape audio to real hardware.
                <br />
                <br />
                Feel free to use generated images in your own projects, but I'd really
                appreciate if could you let me (arttu@solvalou.com) know if you have used this application.
                Thanks!
                <br />
                <br />
                <span style={{ float: 'right', opacity: 0.25, margin: '0 0 10px 0' }}>version {__APP_VERSION__}</span>
            </div>
        </div>
    </div>

};
