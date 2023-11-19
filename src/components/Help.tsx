import { useAppDispatch, useAppSelector } from '../store/store';
import { showHelp } from '../store/toolsSlice';
import '../styles/Help.scss';
import { loadEverything } from '../utils/exportImport';
import { Button } from './CustomElements';

export const Help = () => {

    const helpSHown = useAppSelector(state => state.tools.showHelp);

    const dispatch = useAppDispatch();
    const hideHelp = () => {
        dispatch(showHelp(false));
    }

    const loadExample = async (url: string) => {
        if (confirm("Loading this example will replace your current project. Are you sure?")) {
            const response = await fetch(url);
            const data = await response.text();
            loadEverything(data);
        }
    }

    return helpSHown && <div className="Help">
        Create a layer with the "Add layer"-button. Layers are placed on top of each other.
        <br /><br />
        If a layer contains pixels or attributes, pixels/attributes of lower layers will be ignored.
        <br />
        Layer visiblity can be toggled and layer order can be changed. Tip: name your layers - it makes navigating the layer easier!
        <br /><br />
        When a layer is added, you can upload an image to it. You can then use the various color/brightness/etc controls
        and tools to adjust it. The important part is the Algorithm - it defines how the image is converted to Spectrum format.
        Don't hesistate to use the custom pattern: it makes the image the most "hand drawn".
        Also, don't care about the image adjustment parameters too much before turning on the dithering algotith: set your
        dithering algorith and then adjust the sliders to "dig out" the detail.
        <br /><br />
        Toolbar tools (top left):
        <ol>
            <li>Nudge - moves your layer around</li>
            <li>Mask - allows you to select only parts of a layer to be visible</li>
            <li>Pixels - allows you to manually draw pixels (set pixels as INK or PAPER or transparent)</li>
            <li>Attributes - allows you to manually set color attributes</li>
            <li>Export - allows you to export your image as binary or assembler source code or play it back as tape audio</li>
        </ol>
        <br />
        FAQ:<br /><br />
        <i>"The tools do not seem to do anything."</i><br />
        Make sure you have selected the correct layer.
        <br /><br />
        <i>"Converted image looks too bright and messy by default."</i><br />
        Yes, it often does that.
        Recommended first steps are to reduce the brightness and/or limit the available colors.
        <br /><br />
        <i>"I don't wan to convert an image, I want to draw it myself."</i><br />
        You don't have to upload an image: just use pixel and attribute tools.
        <br /><br />
        <i>"Editing ink/paper pixels is annoying!"</i><br />
        Click "using attributes" icon (or press X) to toggle attributes on or off - if attributes are turned off, it is
        easier to see is some pixel is ink or paper, so you know which brush to use.
        <br /><br />
        <i>"When editing attributes the brush does not seem to do anything."</i><br />
        Make sure you have selected the correct attribute brush type (all, ink, paper, bright or eraser).
        You are probaly altering, for example, just brightness, when you expect to alter all the attributes (ink+paper+brightness).
        <br /><br />
        <i>"UI feels sluggish."</i><br />
        Make sure:
        <br />
        A) You do not have Chrome developer tools open - just having them open slows the app down a lot
        <br />
        or
        <br />
        B) The layer source images are not massive - the bigger the source images, the slower the app
        <br /><br />
        <i>"Minimap is obstructing my view."</i><br />
        Either:
        <br />
        A) Click on the minimap to make it smaller
        <br />
        or
        <br />
        B) Change zoom level to 1

        <br /><br />
        Last but not least:<br />
        The idea behind the user interface is that your left hand rests on q-a-z keys and your right hand operates the mouse/touchpad.
        All keyboard shortcuts (shown in icon tooltips, enclosed in parentheses) are defined so that you can access them without having to move your left hand.

        <br /><br />
        Below you will find some example projects.
        You can load them by clicking the "Load example" button.
        They're not masterpieces, but demonstrate how quickly you can create something with this tool: each image took only one or two minutes!
        What can you create? Let me know and I'll add your project to the list!


        <div className="HelpButtonContainer">
            <Button icon='image'
                tooltip='Load example project'
                onClick={() => loadExample('/ferrari.zxc')}>Load example "ferrari"</Button>
            <Button icon='image'
                tooltip='Load example project'
                onClick={() => loadExample('/cat.zxc')}>Load example "cat"</Button>
            <Button icon='close'
                tooltip='Close this help'
                onClick={hideHelp}>Close</Button>
        </div>
    </div>

};
