import {teams} from "./teamInfo.js";
import * as geometry from "./geometry.js";

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

export class CombinedSide{
    constructor(game, hexagonInfos, length){
        if(hexagonInfos.length !== 1 && hexagonInfos.length !== 2){
            console.log("combined side expects to combine 1 or 2 hexagons, not: " . hexagonInfos.length);
        }
        this.length = length;
        this.hexagonInfos = hexagonInfos;
        this.graphics = game.add.graphics(this.worldCords.x,this.worldCords.y);
    }

    destroy(){
        this.graphics.destroy();
    }

    refreshPosition(){
        this.graphics.x = this.worldCords.x;
        this.graphics.y = this.worldCords.y;
    }

    get worldCords(){
        //all calulates are done relative to first hexagon
        return {
            x: this.hexagonInfos[0].hexagon.x,
            y: this.hexagonInfos[0].hexagon.y
        };
    }

    draw(){
        this.graphics.clear();
        let firstTeam = this.hexagonInfos[0].hexagon.data.sidesData[this.hexagonInfos[0].side];
        let colour;
        if(this.hexagonInfos.length === 2){
            let secondTeam = this.hexagonInfos[1].hexagon.data.sidesData[this.hexagonInfos[1].side];
            colour = this.manualCombine(firstTeam, secondTeam);
        }else{
            colour = firstTeam.colour;
        }
        this.graphics.lineStyle(lineStyle.thickness, colour, lineStyle.alpha);
        let hexPoints = geometry.relativeScaledHexPoints(this.length);
        let start = hexPoints[this.hexagonInfos[0].side];
        this.graphics.moveTo(start.x, start.y);
        let end = hexPoints[(this.hexagonInfos[0].side+1)%6];
        this.graphics.lineTo(end.x, end.y);
    }

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
        for(let team of [first_team, second_team]){
            if(team.number < 0 || team.number > teams.length){
                logError();
            }
        }
        if(first_team === second_team){
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
