import {trainGlyphs,type Glyph,type GlyphField} from './ports-glyph-font';
import {trainDetailGlyphs} from './ports-detail-characters';
import type {Sample,Mask} from './ports-text-patterns';
export type Family=GlyphField|'details';
export type Entry=Glyph&{family:Family};
export const families:Family[]=['title','level','ship','details'];
const KEY='ports-helper.individual-glyphs.v1';
export function permitted(f:Family,c:string){return c.length===1&&(f==='title'?/^[A-Z.'-]$/.test(c):f==='level'?/^\d$/.test(c):f==='ship'?/^[1-4-]$/.test(c):/^[A-Za-z0-9,.'-:]$/.test(c));}
export function validEntry(e:Entry){return !!e&&families.includes(e.family)&&typeof e.chr==='string'&&permitted(e.family,e.chr)&&!!e.mask&&Number.isInteger(e.mask.w)&&e.mask.w>0&&e.mask.w<=24&&Number.isInteger(e.mask.h)&&e.mask.h>0&&e.mask.h<=12&&typeof e.mask.bits==='string'&&e.mask.bits.length===e.mask.w*e.mask.h&&/^[01]+$/.test(e.mask.bits)&&e.mask.bits.includes('1');}
const key=(m:Mask)=>m.w+'/'+m.h+'/'+m.bits;
export function mergeGlyphs(a:Glyph[],b:Glyph[]){
 const map=new Map<string,Glyph>(),bad=new Set<string>();
 for(const t of [...a,...b]){const k=key(t.mask);if(map.has(k)&&map.get(k)!.chr!==t.chr)bad.add(k);else map.set(k,t);}
 return [...map].filter(([k])=>!bad.has(k)).map(([,v])=>v);
}
export function addEntry(entries:Entry[],entry:Entry,learned:Glyph[]=[]){
 if(!validEntry(entry))throw Error('Carácter o máscara inválidos.');
 const same=[...entries.filter(e=>e.family===entry.family),...learned].filter(e=>key(e.mask)===key(entry.mask));
 if(same.some(e=>e.chr!==entry.chr))throw Error('Este patrón ya corresponde a otro carácter.');
 if(entries.some(e=>e.family===entry.family&&key(e.mask)===key(entry.mask)))return entries;
 if(entries.length>=1000)throw Error('Límite de caracteres.');
 return [...entries,entry];
}
let rawCache:string|undefined,entryCache:Entry[]=[];
export function loadEntries(){
 const raw=localStorage.getItem(KEY)??'[]';
 if(raw===rawCache)return entryCache;
 const v:unknown=JSON.parse(raw);if(!Array.isArray(v)||v.length>1000||!v.every(validEntry))throw Error('Registro de caracteres inválido.');
 let result:Entry[]=[];for(const e of v)result=addEntry(result,e);
 rawCache=raw;entryCache=result;return result;
}
export function saveEntry(e:Entry,learned:Glyph[]){
 const next=addEntry(loadEntries(),e,learned);
 localStorage.setItem(KEY,JSON.stringify(next));rawCache=undefined;
}
const cache=new WeakMap<Sample[],{entries:Entry[];fonts:Record<Family,Glyph[]>}>();
export function learnedGlyphs(samples:Sample[],f:Family){return f==='details'?trainDetailGlyphs(samples):trainGlyphs(samples,f);}
export function combinedFonts(samples:Sample[]){
 const entries=loadEntries(),old=cache.get(samples);if(old?.entries===entries)return old.fonts;
 const fonts={} as Record<Family,Glyph[]>;
 for(const f of families)fonts[f]=mergeGlyphs(learnedGlyphs(samples,f),entries.filter(e=>e.family===f));
 cache.set(samples,{entries,fonts});return fonts;
}
export function labelMask(mask:Mask,glyphs:Glyph[]){
 const matches=[...new Set(glyphs.filter(g=>key(g.mask)===key(mask)).map(g=>g.chr))];
 return matches.length===1?matches[0]:null;
}
