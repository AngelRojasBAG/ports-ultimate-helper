import {it,expect} from 'vitest';
import {observationFromRows,matchingRecords} from '../src/core/verified-roster';
import type {Slot} from '../src/core/crew-grid';
const slot:Slot={id:'0:1',kind:'crew',fingerprint:'abc',x:0,y:0,w:43,h:43,selected:true};
const rows=Object.entries({'Nombre':'Golden Katana Clansman','Nivel':'7','Barco':'-','Traits':'Plucky','Morale':'10','Combat':'860','Seafaring':'10','Speed':'-10'}).map(([label,value])=>({label,value,source:'test'}));
it('accepts complete signed stats and rejects missing fields',()=>{
 const o=observationFromRows(slot,rows)!;expect(o.reading.speed).toBe(-10);expect(o.details?.assignedShip).toBeNull();
 expect(observationFromRows(slot,rows.filter(r=>r.label!=='Traits'))).toBeNull();
 expect(observationFromRows(slot,rows.map(r=>r.label==='Speed'?{...r,value:null}:r))).toBeNull();
 expect(observationFromRows({...slot,kind:'captain'},rows)).toBeNull();
});
it('keeps only compatible slot snapshots and never remaps portraits',()=>{
 const o=observationFromRows(slot,rows)!;
 const saved={records:{'0:1':o},grid:[slot],savedAt:''};
 expect(matchingRecords(saved,[slot])['0:1']).toEqual(o);
 expect(matchingRecords(saved,[{...slot,id:'0:2'}])).toEqual({});
});
