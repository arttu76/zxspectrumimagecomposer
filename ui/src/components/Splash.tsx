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
                Manually edit pixels and attributes. Export as binary, assembler source or play back as audio to real hardware.
                <br />
                <br />
                Feel free to use generated images in your own projects, but I'd really
                appreciate if could you let me (arttu@solvalou.com) know if you have used this application.
                Thanks!
            </div>
        </div>
    </div>

};
