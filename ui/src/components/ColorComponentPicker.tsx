export const ColorComponentPicker: React.FC<{
    chooseColorComponent: (colorComponent: number) => void;
    bright: boolean;
    colorComponent: number;
}> = ({ chooseColorComponent, bright, colorComponent }) =>
        <div className="ColorComponentPicker">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(c => <div
                key={c}
                onClick={() => chooseColorComponent(c)}
                className={`color color${c}${bright ? ' bright' : ''}${c === colorComponent ? ' selected' : ''}`}
            >{c}</div>
            )}
        </div >

