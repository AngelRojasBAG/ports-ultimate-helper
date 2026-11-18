import {it,expect} from 'vitest';
import {extractMask,matchSample,addSample,type Sample} from '../src/core/ports-text-patterns';
it('matches only identical patterns in the same field',()=>{
 const mask={w:2,h:2,bits:'1011'};
 const samples=addSample([],{field:'level',text:'6',mask});
 expect(matchSample(samples,'level',mask)).toBe('6');
 expect(matchSample(samples,'ship',mask)).toBeNull();
 expect(matchSample(samples,'level',{...mask,bits:'1010'})).toBeNull();
 expect(()=>addSample(samples,{field:'level',text:'7',mask})).toThrow();
});
it('rejects invalid values and conflicting imported patterns',()=>{
 const mask={w:1,h:1,bits:'1'};
 expect(()=>addSample([],{field:'ship',text:'8',mask})).toThrow();
 const samples:Sample[]=[{field:'ship',text:'1',mask},{field:'ship',text:'2',mask}];
 expect(matchSample(samples,'ship',mask)).toBeNull();
});
it('extracts only the bounded visible pixels',()=>{
 const f={width:3,height:3,data:new Uint8ClampedArray(36)};
 f.data.set([255,255,255,255],16);
 expect(extractMask(f,0,0,3,3,'level')).toEqual({w:1,h:1,bits:'1'});
 expect(extractMask(f,-1,0,3,3,'level')).toBeNull();
});
