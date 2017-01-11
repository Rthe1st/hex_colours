export const colours = new Map([
    ["red", 0xff0000],
    ["yellow", 0xebff00],
    ["blue", 0x0000ff],
    ["orange", 0xffb000],
    ["purple", 0xaf00ff],
    ["green", 0x00ff00],
]);

export const teams = [
    {
        number: 0,
        colour: colours.get("red")
    },
    {
        number: 1,
        colour: colours.get("yellow")
    },
    {
        number: 2,
        colour: colours.get("blue")
    }
];
