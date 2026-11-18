import {it,expect} from 'vitest';
import {overlayRect} from '../src/core/overlay-coordinates';
it('converts 125% overlay geometry without modifying capture geometry',()=>{
 const r={x:610,y:240,w:43,h:43};
 expect(overlayRect(r,1.25)).toEqual({x:488,y:192,w:34,h:34});
 expect(overlayRect(r,1)).toEqual(r);
 expect(overlayRect(r,NaN)).toEqual(r);
});
