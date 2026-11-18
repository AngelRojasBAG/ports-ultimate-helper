// @vitest-environment jsdom
import {it,expect,vi} from 'vitest';
vi.mock('../src/alt1/roster-ocr',()=>({readPanel:vi.fn()}));
vi.mock('../src/alt1/capture',()=>({captureGame:()=>{throw Error('Captura de prueba')}}));
import {mountRosterReader} from '../src/components/roster-reader';
import {LEGACY,KEY} from '../src/core/sync-storage';
it('mounts and starts with persisted legacy observations',()=>{
 localStorage.clear();
 localStorage.setItem(LEGACY,JSON.stringify({'0:1':{kind:'crew',fingerprint:'abc',observedAt:'2026-11-18',reading:{name:'Cartographer',level:7,morale:0,combat:0,seafaring:1275,speed:0}}}));
 const root=document.createElement('div');mountRosterReader(root);
 expect(root.querySelector('#reader-saved-list')?.textContent).toContain('Cartographer');
 const start=root.querySelector<HTMLButtonElement>('#reader-start')!;const stop=root.querySelector<HTMLButtonElement>('#reader-stop')!;
 expect(start.onclick).toBeTypeOf('function');start.click();
 expect(start.disabled).toBe(true);expect(root.querySelector('#reader-status')?.textContent).toContain('Captura de prueba');stop.click();
 expect(start.disabled).toBe(false);expect(localStorage.getItem(LEGACY)).not.toBeNull();localStorage.clear();
});
it('mounts with an empty storage',()=>{localStorage.removeItem(KEY);localStorage.removeItem(LEGACY);const root=document.createElement('div');mountRosterReader(root);expect(root.querySelector('#reader-saved-list')?.textContent).toContain('Sin lecturas recuperables');expect(root.querySelector<HTMLButtonElement>('#reader-start')?.onclick).toBeTypeOf('function')});
