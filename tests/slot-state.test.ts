import {it,expect} from 'vitest';
import {slotComplete,slotState} from '../src/core/slot-state';
import type {Slot} from '../src/core/crew-grid';
import type {Records} from '../src/core/sync-session';
const s:Slot={id:'0:0',kind:'captain',fingerprint:'abc',x:0,y:0,w:43,h:43,selected:false};
const records:Records={'0:0':{kind:'captain',fingerprint:'abc',observedAt:'now',reading:{name:'Sebastian Wytche',level:7,morale:430,combat:410,seafaring:430,speed:950},details:{assignedShip:null,assignmentKnown:true,traitsText:'Multi-Talented',personality:null}}};
it('shows basic data as complete only in basic mode',()=>{
 expect(slotComplete(s,records,false)).toBe(true);
 expect(slotComplete(s,records,true)).toBe(false);
 expect(slotState(s,records,true,null,null)).toBe('partial');
});
it('requires captain personality in detail mode',()=>{
 const updated:Records={'0:0':{...records['0:0'],details:{assignedShip:null,assignmentKnown:true,traitsText:'Multi-Talented',personality:'Calm'}}};
 expect(slotState(s,updated,true,null,null)).toBe('done');
});
it('does not mark a changed fingerprint complete',()=>{
 expect(slotComplete({...s,fingerprint:'other'},records,false)).toBe(false);
});