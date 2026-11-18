// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
vi.mock('../src/alt1/roster-ocr',()=>({readPanel:vi.fn()}));
vi.mock('../src/alt1/capture',()=>({captureGame:()=>({width:800,height:600,data:new Uint8ClampedArray(800*600*4)})}));
vi.mock('../src/core/roster-anchor',()=>({findRosterAnchor:()=>({x:400,y:30,scale:1,score:1}),mask:[]}));
vi.mock('../src/core/fast-reader',()=>({anchorStillVisible:()=>true,panelKey:()=>'',selectionKey:()=>''}));
const slot={id:'0:1',kind:'crew' as const,fingerprint:'abc',selected:false,x:0,y:0,w:43,h:43};
vi.mock('../src/core/crew-grid',()=>({inspectGrid:()=>[slot],selectedSlot:()=>null,sameGrid:()=>true}));
import {mountRosterReader} from '../src/components/roster-reader';
import {KEY} from '../src/core/sync-storage';
it('opens in-app confirmation and resets visual progress without deleting stored snapshot',()=>{localStorage.clear();const stored=JSON.stringify({records:{'0:1':{kind:'crew',fingerprint:'abc',observedAt:'2026-11-18',reading:{name:'Cartographer',level:7,morale:0,combat:0,seafaring:1275,speed:0}}},grid:[slot],savedAt:'2026-11-18'});localStorage.setItem(KEY,stored);const root=document.createElement('div');mountRosterReader(root);const click=(id:string)=>root.querySelector<HTMLButtonElement>('#'+id)!.click();click('reader-start');expect(root.querySelector('#reader-progress')?.textContent).toContain('1/1');click('reader-rescan');expect(root.querySelector<HTMLElement>('#reader-rescan-dialog')?.hidden).toBe(false);click('reader-rescan-no');expect(root.querySelector('#reader-progress')?.textContent).toContain('1/1');click('reader-rescan');click('reader-rescan-yes');expect(root.querySelector('#reader-progress')?.textContent).toContain('0/1');expect(localStorage.getItem(KEY)).toBe(stored);click('reader-stop');localStorage.clear()});