let moveLimit = 3;

export let teams = [
    {
        number: 0,
        colour: 0xff0000,
        movesLeft: moveLimit
    },
    {
        number: 1,
        colour: 0xebff00,
        movesLeft: 0
    },
    {
        number: 2,
        colour: 0x0000ff,
        movesLeft: 0
    }
];

export function teamInfoSettingsGui(gui){
    gui.addColor(teams[0], 'colour');
    gui.addColor(teams[1], 'colour');
    gui.addColor(teams[2], 'colour');
}
