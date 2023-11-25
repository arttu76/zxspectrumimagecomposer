import { pack8bit } from "./exportImport";

describe('export/import', () => {

    test('pack 8 bit', () => {
        expect(pack8bit([
            128,
            255,
            0,
            64,
            23,
            1,
            2,
            3,
            4
        ])).toBe('胿@ᜁȃЀ');
    });

});
