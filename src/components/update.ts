const current='0.4.23';
export function mountUpdate(root:HTMLElement){
 const section=document.createElement('section');section.innerHTML='<h2>Actualizaciones</h2><p role="status">Versión instalada: '+current+'</p><button id="check-version">Buscar actualización</button><button id="reload-version">Recargar sin caché</button>';root.insertBefore(section,root.children[1]??null);
 const status=section.querySelector('[role=status]')!;
 async function check(){try{const url=new URL('./version.json',location.href);url.searchParams.set('t',String(Date.now()));const response=await fetch(url.href,{cache:'no-store'});if(!response.ok)throw Error();const latest=await response.json();status.textContent=typeof latest.version!=='string'?'Respuesta inválida.':latest.version===current?'Versión actual: '+current:'Versión publicada: '+latest.version+' · instalada: '+current;}catch{status.textContent='No se pudo consultar la versión publicada.'}}
 section.querySelector('#check-version')!.addEventListener('click',()=>void check());section.querySelector('#reload-version')!.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('reload',String(Date.now()));location.replace(url.href)});void check();
}
