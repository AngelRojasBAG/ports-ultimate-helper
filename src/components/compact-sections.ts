export function compactSections(root:HTMLElement){
 const all=Array.from(root.querySelectorAll<HTMLElement>('section')).filter(s=>!s.parentElement?.closest('section'));
 const key='ports-helper.accordion.v1';
 let saved:Record<string,boolean>={};
 try{saved=JSON.parse(localStorage.getItem(key)??'{}')??{}}catch{}
 for(const section of all){
  const heading=section.querySelector(':scope > h2');
  if(!heading)continue;
  const name=heading.textContent??'Módulo';
  const details=document.createElement('details');details.className='module-accordion';details.open=saved[name]??(name==='Leer unidad seleccionada');
  const summary=document.createElement('summary');summary.textContent=name;
  section.before(details);details.append(summary,section);heading.remove();
  details.addEventListener('toggle',()=>{saved[name]=details.open;try{localStorage.setItem(key,JSON.stringify(saved))}catch{}});
 }
 const controls=document.createElement('nav');controls.className='accordion-tools';
 for(const [label,open] of [['Abrir todo',true],['Cerrar todo',false]] as const){
  const b=document.createElement('button');b.textContent=label;b.onclick=()=>root.querySelectorAll<HTMLDetailsElement>('.module-accordion, .advanced').forEach(d=>{d.open=open});controls.append(b);
 }
 root.querySelector('header')?.after(controls);
}
