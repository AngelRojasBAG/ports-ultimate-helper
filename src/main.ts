import {mountGlyphTrainer} from './components/ports-glyph-trainer';
import {compactSections} from './components/compact-sections';
import {mountUnifiedReader} from './components/ports-unified-reader';
import {mountTextCalibration} from './components/ports-text-calibration';
import {mountAlt1Lab} from './components/alt1-ocr-lab';
import {mountAssistant} from './components/assistant';
import {mountMechanics} from './components/mechanics';
import {mountUpdate} from './components/update';
import {mountCatalog} from './components/catalog';
import './styles/main.css';
import {getStatus,identify} from './alt1/bridge';
import {loadSettings,saveSettings} from './core/storage';
const root=document.querySelector<HTMLElement>('#app')!;
const regions=['The Arc','The Skull','The Hook','The Scythe','The Bowl','The Pincers','The Loop','The Shield'];
root.innerHTML=`<header><img src="./icon.svg" alt="" width="42"><div><h1>Ports Ultimate Helper</h1><small>RS3 · v0.4.30 · Asistente</small></div></header><section><h2>Conexión con Alt1</h2><dl id="status"></dl><button id="refresh">Comprobar conexión</button><p id="hint"></p><a id="install">Agregar a Alt1</a></section><section><h2>Mi puerto</h2><label for="ships">Barcos disponibles</label><select id="ships"><option>1</option><option>2</option><option>3</option><option>4</option></select><label for="region">Región actual</label><select id="region"></select><button id="save">Guardar configuración</button><p id="saved" role="status"></p></section><section><h2>Próximos módulos</h2><p>Tripulación · Componentes · Expediciones · Optimizador</p><small>Captura guiada experimental. No controla el juego.</small></section>`;
const status=root.querySelector('#status')!;
const hint=root.querySelector('#hint')!;
const ships=root.querySelector<HTMLSelectElement>('#ships')!;
const region=root.querySelector<HTMLSelectElement>('#region')!;
for(const name of regions){const op=document.createElement('option');op.textContent=name;region.append(op);}
const settings=loadSettings();ships.value=String(settings.ships);region.value=regions.includes(settings.region)?settings.region:regions[0];
root.querySelector<HTMLAnchorElement>('#install')!.href='alt1://addapp/'+new URL('./appconfig.json',location.href).href;
function refresh(){const s=getStatus(window.alt1);status.replaceChildren(); for(const [k,v] of Object.entries({'Alt1':s.connected?'Detectado':'No detectado','Permiso de pantalla':s.pixel?'Concedido':'No concedido','Estado del juego':s.gameState?'Concedido':'No concedido','Resolución RS3':s.width&&s.height?s.width+' × '+s.height:'No disponible'})){const dt=document.createElement('dt');dt.textContent=k;const dd=document.createElement('dd');dd.textContent=v;status.append(dt,dd);}hint.textContent=s.connected?'Alt1 detectado. Comprueba los permisos antes de continuar.':'Abre esta aplicación desde Alt1 Toolkit para comprobar la integración.';}
root.querySelector('#refresh')!.addEventListener('click',refresh);
root.querySelector('#save')!.addEventListener('click',()=>{const out=root.querySelector('#saved')!;try{saveSettings({ships:Number(ships.value),region:region.value});out.textContent='Configuración guardada localmente.';}catch{out.textContent='No se pudo guardar: almacenamiento no disponible.';}});
try{identify();}catch{ /* Refresh remains available. */ }refresh();

const assistantRoot=document.createElement('div');root.insertBefore(assistantRoot,root.children[1]??null);mountUnifiedReader(assistantRoot);const diagnostics=document.createElement('details');diagnostics.className='advanced';diagnostics.innerHTML='<summary>Diagnóstico avanzado</summary>';assistantRoot.append(diagnostics);mountAlt1Lab(diagnostics);mountTextCalibration(diagnostics);mountGlyphTrainer(diagnostics);mountAssistant(diagnostics);
const library=document.createElement('details');library.className='advanced';library.innerHTML='<summary>Catálogos y herramientas manuales</summary>';root.append(library);mountCatalog(library);

mountMechanics(library);
mountUpdate(root);

compactSections(root);
