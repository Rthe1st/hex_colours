export function relativeScaledHexPoints(sideLength){
    let corner_vertical = Math.sin(Math.PI/3)*sideLength;
    let corner_horizontal = Math.cos(Math.PI/3)*sideLength;
    return [
        {x: -corner_horizontal, y: -corner_vertical},
        {x: +corner_horizontal, y: -corner_vertical},
        {x: sideLength, y: 0},
        {x: +corner_horizontal, y: +corner_vertical},
        {x: -corner_horizontal, y: +corner_vertical},
        {x: -sideLength, y: 0}
    ];
}
