export const steps=[
 {id:'overview',title:'Vista general',instruction:'Entra a Player-Owned Ports y abre la interfaz de gestión de barcos.'},
 {id:'crew',title:'Tripulación',instruction:'Abre Edit Ship → Edit Crew. Deja visible la lista de tripulantes.'},
 {id:'tooltip',title:'Estadísticas de tripulante',instruction:'En Edit Crew, coloca el cursor sobre un tripulante para mostrar sus estadísticas. Vuelve a la ventana del juego después de activar la captura.'},
 {id:'captain',title:'Capitán',instruction:'Abre la selección de capitán y deja visibles sus estadísticas.'},
 {id:'voyage',title:'Expedición',instruction:'Selecciona una expedición y deja visibles los requisitos Morale, Combat y Seafaring.'},
 {id:'parts',title:'Componentes',instruction:'Abre Edit Ship y deja visibles las mejoras disponibles.'}
] as const;
export function nextStep(done:readonly string[]){return steps.find(s=>!done.includes(s.id))??null;}
