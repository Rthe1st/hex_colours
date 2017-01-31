let standardMoveLimit = 4;

export let teams = [
    {
        number: 0,
        colour: 0xff0000,
        movesLeft: standardMoveLimit,
        moveLimit: standardMoveLimit
    },
    {
        number: 1,
        colour: 0xebff00,
        movesLeft: standardMoveLimit,
        moveLimit: standardMoveLimit
    },
    {
        number: 2,
        colour: 0x0000ff,
        movesLeft: standardMoveLimit,
        moveLimit: standardMoveLimit
    }
];

export function teamInfoSettingsGui(gui){
    gui.addColor(teams[0], 'colour');
    gui.addColor(teams[1], 'colour');
    gui.addColor(teams[2], 'colour');
    gui.add(teams[0], 'moveLimit', 1, 10).step(1);
    gui.add(teams[1], 'moveLimit', 1, 10).step(1);
    gui.add(teams[2], 'moveLimit', 1, 10).step(1);
}

export let currentTeam = teams[0];

export function makeMove(){
    currentTeam.movesLeft -= 1;
    if(currentTeam.movesLeft === 0){
        currentTeam = teams[(currentTeam.number + 1)%teams.length];
        currentTeam.movesLeft = currentTeam.moveLimit;
    }
}
