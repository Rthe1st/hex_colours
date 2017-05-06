export let settings = {
    standardMoveLimit: 4
};

export let teams = [
    {
        number: 0,
        colour: 0xff0000,
        movesLeft: settings.standardMoveLimit,
        score: 0
    },
    {
        number: 1,
        colour: 0x666666,//0xebff00,
        movesLeft: settings.standardMoveLimit,
        score: 0
    },
    {
        number: 2,
        colour: 0x666666,//0x0000ff,
        movesLeft: settings.standardMoveLimit,
        score: 0
    }
];

export function teamInfoSettingsGui(gui){
    let folder = gui.addFolder('team settins');
    folder.addColor(teams[0], 'colour');
    folder.addColor(teams[1], 'colour');
    folder.addColor(teams[2], 'colour');
    folder.add(settings, 'standardMoveLimit', 1, 10).step(1);
}

export let currentTeam = teams[0];
export let currentRound = 0;
export function endOfRound(){
    return currentTeam.number === 0 && currentTeam.movesLeft === settings.standardMoveLimit;
}

export function makeMove(){
    currentTeam.movesLeft -= 1;
    if(currentTeam.movesLeft === 0){
        currentTeam = teams[(currentTeam.number + 1)%teams.length];
        currentTeam.movesLeft = settings.standardMoveLimit;
    }
}
