// Partial catalogue: observed equipment, cross-checked against RuneHQ and historical Wiki.
export type Stats=[number,number,number,number];
export type PartKind='ram'|'deck'|'rudder'|'hull';
export type Part={name:string;kind:PartKind;stats:Stats};
export const parts:Part[]=[
{name:'Weathered Ram',kind:'ram',stats:[0,50,0,0]},
{name:'Ghostly Figurehead',kind:'ram',stats:[500,0,0,0]},
{name:'Battle Ram',kind:'ram',stats:[0,500,0,0]},
{name:'Weathered Rigging',kind:'deck',stats:[0,0,100,0]},
{name:'Large Crate of Riches',kind:'deck',stats:[700,0,0,0]},
{name:'Cannon x3',kind:'deck',stats:[0,1000,0,0]},
{name:'Ornate Rigging',kind:'deck',stats:[0,0,1000,0]},
{name:'Barnacled Rudder',kind:'rudder',stats:[0,0,0,100]},
{name:'Polished Rudder',kind:'rudder',stats:[0,0,0,450]},
{name:'Barnacled Hull',kind:'hull',stats:[50,50,100,0]},
{name:'Golden Hull',kind:'hull',stats:[450,200,200,100]},
{name:'Hull of Storms',kind:'hull',stats:[400,400,900,300]}
];
export const partKinds:PartKind[]=['ram','deck','deck','rudder','hull'];
export const partSources=['https://www.runehq.com/minigame/player-owned-ports','https://runescape.fandom.com/wiki/Player-owned_port/Ship_upgrades','https://runescape.wiki/w/Player-owned_port'];
