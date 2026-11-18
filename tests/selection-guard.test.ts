import {it,expect} from 'vitest';
import {sameReading,overlayColor,isSelectionYellow} from '../src/core/selection-guard';
const reading={name:'Golden Katana Clansman',level:5,morale:0,combat:750,seafaring:0,speed:0};
it('rejects the reported level 7 reading for the level 5 slot',()=>{
 expect(sameReading(reading,{...reading,level:7,combat:850})).toBe(false);
});
it('accepts matching stats and case differences',()=>{
 expect(sameReading(reading,{...reading,name:reading.name.toUpperCase()})).toBe(true);
});
it('keeps every overlay color outside the yellow selection predicate',()=>{
 for(const state of ['done','active','next','partial','pending'] as const){
  expect(isSelectionYellow(...overlayColor(state))).toBe(false);
 }
});