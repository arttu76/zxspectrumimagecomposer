import { useAppDispatch, useAppSelector } from '../store/store';
import { showHelp } from '../store/toolsSlice';
import '../styles/Help.scss';
import { loadEverything } from '../utils/exportImport';
import { Button } from './CustomElements';
import { Group } from './Group';

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

    return helpSHown && <div className="Help" onClick={hideHelp}>
        <div className="HelpContent">
            <Group title="Getting started" disableClose={true}>
                Create a layer with the "Add layer"-button. Layers are placed on top of each other.
                <br /><br />
                If a layer contains pixels or attributes, pixels/attributes of lower layers will be ignored.
                <br />
                Layer visiblity can be toggled and layer order can be changed. Tip: name your layers - it makes managing the layers much easier!
                <br /><br />
                When a layer is added, you can upload an image to it. You can then use the various colour/brightness/etc controls
                and tools to adjust it. The important part is the Algorithm - it defines how the image is converted to Spectrum format.
                Try thecustom pattern and fine-tune its parameters: it is often the best algorithm to use, as it makes the image look "hand drawn".
                Also, don't care about the image adjustment parameters too much before turning on the dithering algorithm: set your
                preferred dithering algorith and then adjust the various sliders and parameters to "dig out" the detail.
                <br /><br />
                Toolbar tools (top left):
                <ol>
                    <li>Nudge - moves your layer around (along with source image, mask, manual pixels and attributes)</li>
                    <li>Mask - allows you to select which  parts of the source image are visible</li>
                    <li>Pixels - allows you to manually draw pixels (set pixels as INK or PAPER or transparent)</li>
                    <li>Attributes - allows you to manually set color attributes</li>
                    <li>Export - allows you to export your image as binary or assembler source code or play it back as tape audio</li>
                </ol>
            </Group>

            &nbsp;

            <Group title="Frequently asked questions" disableClose={true}>
                <i>"The tools do not seem to do anything."</i><br />
                Make sure you have selected the correct layer. Just click it on the right to activate it: the inactive layers are darkened, active layer is "normal".
                <br /><br />
                <i>"Converted image looks too bright and messy by default."</i><br />
                Yes, it often does that: recommended first step is to reduce the brightness and/or limit the available colors.
                A common second step is to increase contrast, emphasize edges and/or boost shadows and midtones to bring out extra detail.
                <br /><br />
                <i>"I don't want to convert an image, I want to draw it myself."</i><br />
                By all means! You don't have to upload an image: create a layer and just use the pixel and attribute tools.
                <br /><br />
                <i>"Editing ink/paper pixels is annoying!"</i><br />
                Click "using attributes" icon (or press X) to toggle attributes on or off - if attributes are turned off, it is
                easier to see is some pixel is ink or paper, so you know which brush to use. Another trip: You don't even have to know
                if a pixel is ink or paper if you just want to toggle them: use the 1x1 brush that automatically toggles between ink/paper.
                <br /><br />
                <i>"When editing attributes the brush does not seem to do anything."</i><br />
                Make sure you have selected the correct attribute brush type (all, ink, paper, bright or eraser).
                You are probaly altering, for example, just brightness, when you expect to alter all the attributes (ink+paper+brightness).
                Another alternative is that you have no pixels: you must have INK or PAPER pixels in order to see any changes in the image
                when changing attributes - if you have no pixels (=pixel layer is transparent), changing attributes does not do anything visible
                until you do draw some actual pixels using, for example, the brush in with Pixels-tool.
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
                <i>"How do I copy/paste"</i><br />
                Good question! There is no copy/paste functionality in the tranditional sense.
                Instead, to duplicate a section of the image, duplicate the layer and move it.
                Remember, that you can use the mask tool to further define the area you want to be duplicated.
            </Group>

            &nbsp;

            <Group title="Keyboard shortcuts" disableClose={true}>
                The idea behind the user interface is that your left hand rests on q-a-z keys and your right hand operates the mouse/touchpad.
                All keyboard shortcuts (shown in icon tooltips, enclosed in parentheses) are defined so that you can access them without having to move your left hand.
            </Group>

            &nbsp;

            <Group title="Example images" disableClose={true}>
                Below you will find some example projects.
                You can load them by clicking the "Load example" button.
                They're not masterpieces, but demonstrate how quickly you can create something with this tool: each image took only one or two minutes!
                What can you create? Let me know and I'll add your project to the list!
            </Group>

            &nbsp;

            <Group title="Feel free to ask for help!" disableClose={true}>
                Don't hesitate to contact me: all kinds of feedback is very welcome!
                Find "Arttu Ylärakkola" in Facebook or email arttu@solvalou.com
                <br /><br />
                Source code is available in <a
                    href="https://github.com/arttu76/zxspectrumimagecomposer"
                    target="_blank"
                    style={{ color: "#888" }}>https://github.com/arttu76/zxspectrumimagecomposer</a>
            </Group>

            <div className="HelpButtonContainer">
                <Button icon='image'
                    tooltip='Load example project'
                    onClick={() => loadExample('/antattack.zxc')}>Load example "ant attack"</Button>
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
    </div>

};
