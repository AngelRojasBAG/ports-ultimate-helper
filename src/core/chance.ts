/** Uses FINAL ship totals, including all bonuses already applied in game. No rounding assumption. */
export function chance(totals:readonly number[],requirements:readonly number[]):number|null{
 if(totals.length!==3||requirements.length!==3||[...totals,...requirements].some(x=>!Number.isFinite(x)||x<0))throw new Error('Invalid stats');
 const ratios=requirements.flatMap((r,i)=>r>0?[totals[i]/r]:[]);
 return ratios.length?Math.min(1,...ratios)*100:null;
}
