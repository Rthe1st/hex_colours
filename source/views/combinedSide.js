import * as geometry from "../geometry.js";

let lineStyle = {
    thickness: 5,
    alpha: 1
};

let combinedColours = {
    team_0_1: 0xffb000,
    team_1_2: 0x00ff00,
    team_2_0: 0xaf00ff
};

export function combinedSideSettingsGui(gui){
    gui.add(lineStyle, 'thickness', 0,20);
    gui.add(lineStyle, 'alpha', 0, 1);
    gui.addColor(combinedColours, 'team_0_1');
    gui.addColor(combinedColours, 'team_1_2');
    gui.addColor(combinedColours, 'team_2_0');
}

export class CombinedSide extends Phaser.Sprite{
    /*
    model API:
        property hexSideTeams -> array of teamNumbers of adjacent hex sides
        proerty cords -> {x,y, side} standard corodinate for addressing combined sides
    */
    constructor(game, x, y, boardView, model){
        super(game, x, y);
        this.data.boardView = boardView;
        this.data.model = model;
        this.data.graphics = new Phaser.Graphics(game, 0, 0);
        this.addChild(this.data.graphics);
    }

    refreshPosition(){
        let worldCords = this.data.boardView.calculateWorldCords(this.data.model.cords);
        this.x = worldCords.x;
        this.y = worldCords.y;
    }

    update(){
        this.refreshPosition();
        this.data.graphics.clear();
        let hexSideTeams = this.data.model.hexSideTeams;
        let firstTeam = hexSideTeams[0];
        let colour;
        if(hexSideTeams.length === 2){
            let secondTeam = hexSideTeams[1];
            colour = this.manualCombine(firstTeam, secondTeam);
        }else{
            colour = firstTeam.colour;
        }
        this.data.graphics.lineStyle(lineStyle.thickness, colour, lineStyle.alpha);
        let hexPoints = geometry.relativeScaledHexPoints(this.data.boardView.outerSideLength);
        let start = hexPoints[this.data.model.cords.side];
        this.data.graphics.moveTo(start.x, start.y);
        let end = hexPoints[(this.data.model.cords.side+1)%6];
        this.data.graphics.lineTo(end.x, end.y);
    }

    //this feels like its leaking the model a bit?
    manualCombine(first_team, second_team){
        function logError(){
            console.log("errror, invalid teams for combining sides");
            console.log(first_team);
            console.log(second_team);
        }
        if(first_team.number > second_team.number){
            let temp = first_team;
            first_team = second_team;
            second_team = temp;
        }
        if(first_team.number === second_team.number){
            return first_team.colour;
        }else if(first_team.number === 0 && second_team.number === 1){
                return combinedColours.team_0_1;
        }else if(first_team.number === 1 && second_team.number === 2){
                return combinedColours.team_1_2;
        }else if(first_team.number === 0 && second_team.number === 2){
                return combinedColours.team_2_0;
        }else{
            logError();
        }
    }
}
