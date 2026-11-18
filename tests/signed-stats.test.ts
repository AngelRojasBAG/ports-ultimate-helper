import {it,expect} from 'vitest';import {parseReading} from '../src/core/roster-reader';import {sanitize,snapshot,restore} from '../src/core/sync-storage';import {validUnit} from '../src/core/roster';import type {Slot} from '../src/core/crew-grid';
const reading={name:'STORM RIDERS CLANSMAN',level:7,morale:0,combat:-10,seafaring:860,speed:0};
const lines=['STORM RIDERS CLANSMAN','Level 7','Morale: 0 Seafaring: 860','Combat: -10 Speed: 0'];
it('reads the actual reported negative combat value',()=>expect(parseReading(lines)).toEqual(reading));
it('accepts Unicode minus',()=>expect(parseReading(lines.map(x=>x.replace('-10','−10')))).toEqual(reading));
it('rejects negative level and missing stat',()=>{expect(parseReading(lines.map(x=>x.replace('Level 7','Level -7')))).toBeNull();expect(parseReading(lines.slice(0,3))).toBeNull()});
it('retains signed stats on snapshot and restoration',()=>{const s:Slot={id:'2:2',kind:'crew',fingerprint:'sample',selected:true,x:0,y:0,w:43,h:43};const records={'2:2':{kind:'crew' as const,fingerprint:'sample',reading,observedAt:'2026-11-18'}};expect(sanitize(records)).toEqual(records);expect(restore(snapshot(records,[s]),[s])).toEqual(records)});
it('accepts signed manual unit stats',()=>expect(validUnit({id:'1',name:reading.name,kind:'crew',level:7,stats:[0,-10,860,0],traits:'Cowardly',available:true})).toBe(true));