import {Hexagon} from "./hexagon.js";
import {CombinedSide} from "./combinedSide.js";

export class Dashboard extends Phaser.Sprite{
    //depending on what thee controls look like
    //might be better to make this with normal html/css
    constructor(game, x, y, width, teamInfo, boardModel){
        super(game, x, y);
        this.data.teamInfo = teamInfo;
        this.data.width = width;
        this.data.height = game.height;
        this.outline();
        this.data.teamsDisplay = [];
        this.data.currentStateTeamDisplay = [];
        this.addChild(new Phaser.Text(this.game, 0, 70, "Total Scores:"));
        this.addChild(new Phaser.Text(this.game, 0, 150, "Current Round:"));
        this.data.boardModel = boardModel;
        for(let [index, team] of teamInfo.teams.entries()){
            let teamDisplayGroup = this.teamHighlights(team, index*50, 110, 30, 30);
            this.data.teamsDisplay.push(teamDisplayGroup);
            this.addChild(teamDisplayGroup);
            let currentStateTeamDisplayGroup = this.currentStateTeamHighlights(team, index*50, 190, 30, 30);
            this.data.currentStateTeamDisplay.push(currentStateTeamDisplayGroup);
            this.addChild(currentStateTeamDisplayGroup);
        }
        this.moveCounter = new Phaser.Graphics(game, 0, this.data.height/2);
        this.addChild(this.moveCounter);
        this.data.highlightedSectionScore = new Phaser.Text(game, 0, 10, "", {wordWrap: true, wordWrapWidth: width, fontSize: 15});
        this.addChild(this.data.highlightedSectionScore);
        this.data.highlightedSectionScoreBonus = new Phaser.Text(game, 0, 40, "", {wordWrap: true, wordWrapWidth: width, fontSize: 15});
        this.addChild(this.data.highlightedSectionScoreBonus);
    }

    currentStateTeamHighlights(team, x, y, width, height){
        let group = new Phaser.Group(this.game, this);
        let teamHighlight = new Phaser.Graphics(this.game, x, y);
        teamHighlight.beginFill(team.colour);
        teamHighlight.drawRect(0,0, width, height);
        teamHighlight.endFill();
        teamHighlight.inputEnabled = true;
        teamHighlight.events.onInputOver.add(function(){
            this.data.boardModel.teamHighlight(team);
        }, this);
        group.addChild(teamHighlight);
        let scoreText = new Phaser.Text(this.game, x, y, "");
        group.addChild(scoreText);
        this.data.boardModel.teamHighlight(team)
        this.data.boardModel.currentStateScore(team);
        let boardModel = this.data.boardModel;
        scoreText.update = function(){
            this.text = boardModel.currentStateScore(team);
        };
        return group;
    }

    teamHighlights(team, x, y, width, height){
        let group = new Phaser.Group(this.game, this);
        let teamHighlight = new Phaser.Graphics(this.game, x, y);
        teamHighlight.beginFill(team.colour);
        teamHighlight.drawRect(0,0, width, height);
        teamHighlight.endFill();
        group.addChild(teamHighlight);
        let scoreText = new Phaser.Text(this.game, x, y, "");
        group.addChild(scoreText);
        scoreText.update = function(){
            this.text = team.score;
        };
        return group;
    }

    outline(){
        this.data.outline = new Phaser.Graphics(this.game, 0, 0);
        this.data.outline.beginFill('0xff6600');
        this.data.outline.drawRect(0,0, this.data.width, this.data.height);
        this.data.outline.endFill();
        this.addChild(this.data.outline);
    }

    update(){
        for(let teamDisplayGroup of this.data.teamsDisplay){
            teamDisplayGroup.update();
        }
        for(let currentStateTeamDisplayGroup of this.data.currentStateTeamDisplay){
            currentStateTeamDisplayGroup.update();
        }
        this.moveCounter.clear();
        let score;
        let bonus;
        if(this.data.boardModel.selected === undefined){
            score = 0;
        }else{
            score = this.data.boardModel.selected.score;
        }
        bonus = 0;
        this.data.highlightedSectionScore.text = "Highlighted Score: " + score;
        this.data.highlightedSectionScoreBonus.text = "Size Bonus: " + bonus;
        const currentTeam = this.data.teamInfo.currentTeam;
        const moveLimit = this.data.teamInfo.settings.standardMoveLimit;
        this.moveCounter.beginFill(currentTeam.colour);
        let radius = Math.min(this.data.width, this.data.height)/2;
        let center = {x: this.data.width/2, y: 0};
        if(currentTeam.movesLeft == moveLimit){
            //arc draws in discreat segments, so leaves a gap for full circles
            this.moveCounter.drawCircle(center.x, center.y, radius*2);
        }else{
            let percentOfCircle = currentTeam.movesLeft/moveLimit;
            let endAngleRadians = -Math.PI*2*percentOfCircle;
            let topOffset = -Math.PI/2;
            this.moveCounter.arc(center.x, center.y, radius, topOffset, topOffset+endAngleRadians, true, 128);
        }
        this.moveCounter.endFill();
    }
}
