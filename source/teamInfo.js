export function teamInfoSettingsGui(gui){
    gui.addColor(teams[0], 'colour');
    gui.addColor(teams[1], 'colour');
    gui.addColor(teams[2], 'colour');
}

export const teams = [
    {
        number: 0,
        colour: 0xff0000
    },
    {
        number: 1,
        colour: 0xebff00
    },
    {
        number: 2,
        colour: 0x0000ff
    }
];
