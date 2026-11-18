import {it,expect} from 'vitest';import {parseReading} from '../src/core/roster-reader';
const lines=['CARD SHARP','Level 6','Morale: 1200 Seafaring: O','Combat: 0 Speed: 70'];
it('reads reported Card Sharp sample',()=>expect(parseReading(lines)).toEqual({name:'CARD SHARP',level:6,morale:1200,combat:0,seafaring:0,speed:70}));
it('accepts isolated lowercase o',()=>expect(parseReading(lines.map(x=>x.replace('Seafaring: O','Seafaring: o')))?.seafaring).toBe(0));
it('rejects ambiguous mixed tokens and partial numbers',()=>{for(const value of ['O70','1O','10.5','1,2','OO','OTHER'])expect(parseReading(lines.map(x=>x.replace('Seafaring: O','Seafaring: '+value))).toBeNull()});
it('preserves name and signed stats',()=>expect(parseReading(['STORM RIDERS CLANSMAN','Level 7','Morale: O Seafaring: 860','Combat: -10 Speed: 0'])).toEqual({name:'STORM RIDERS CLANSMAN',level:7,morale:0,combat:-10,seafaring:860,speed:0}));