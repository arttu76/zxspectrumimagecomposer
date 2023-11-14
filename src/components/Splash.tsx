import '../styles/Splash.scss';


import { useState } from 'react';

export const Splash = () => {

    const [showSplash, setShowSplash] = useState(true);

    return showSplash && <div className="Splash" onClick={() => setShowSplash(false)}>
        <div className="SplashContent">
            <img src="/title.png" />
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
                <span style={{ float: 'right', opacity: 0.25, margin: '0 0 10px 0' }}>v0.1</span>
            </div>
        </div>
    </div>

};