import { spectrumColor } from './colors';
import { getColorDistance, getInkSimilarityPercentage } from './dithering';

describe('dithering', () => {
    test('color distance', () => {
        expect(getColorDistance([0, 0, 0], [0, 0, 0])).toEqual(0);
        expect(getColorDistance([255, 255, 255], [0, 0, 0])).toEqual(441.6729559300637);
        expect(getColorDistance([0, 0, 0], [0, 0, 0])).toEqual(0);
        expect(getColorDistance([123, 45, 77], [33, 44, 202])).toEqual(154.03246411065427);
        expect(getColorDistance([33, 44, 202], [123, 45, 77])).toEqual(154.03246411065427);
    });

    test('ink simliarity', () => {
        expect(getInkSimilarityPercentage(
            spectrumColor.normal[0],
            {
                ink: 0,
                paper: 3,
                bright: false
            }
        )).toEqual(1);
        expect(getInkSimilarityPercentage(
            spectrumColor.normal[7],
            {
                ink: 0,
                paper: 7,
                bright: false
            }
        )).toEqual(0);

        const green = spectrumColor.normal[4];
        expect(getInkSimilarityPercentage(
            green,
            {
                ink: 0,
                paper: 7,
                bright: false
            }
        )).toEqual(0.5547393956151675);

        expect(getInkSimilarityPercentage(
            [green[0] - 5, green[1], green[2] - 20], // darker
            {
                ink: 0,
                paper: 7,
                bright: false
            }
        )).toEqual(0.570836138666726);
        expect(getInkSimilarityPercentage(
            [green[0] + 5, green[1] + 20, green[2] + 20], // lighter
            {
                ink: 0,
                paper: 7,
                bright: false
            }
        )).toEqual(0.5162198859373603);

        expect(getInkSimilarityPercentage(
            [green[0] + 5, green[1] + 20, green[2] + 20],
            {
                ink: 4, // near this
                paper: 5,
                bright: false
            }
        )).toEqual(0.8690662653989726);

        const cyan = spectrumColor.normal[5];
        expect(getInkSimilarityPercentage(
            [cyan[0] + 5, cyan[1] + 20, cyan[2] + 20],
            {
                ink: 4,
                paper: 5, // near this
                bright: false
            }
        )).toEqual(0.11093757366743293);
        expect(getInkSimilarityPercentage(
            [cyan[0] + 5, cyan[1] + 20, cyan[2] + 20],
            {
                // other way around
                ink: 5, // near this ink
                paper: 4,
                bright: false
            }
        )).toEqual(0.889062426332567);

    });

});
