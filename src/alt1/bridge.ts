export interface Alt1Api {
 identifyAppUrl?: (url:string)=>void;
 permissionPixel?: boolean;
 permissionGameState?: boolean;
 rsWidth?: number;
 rsHeight?: number;
 version?: string;
 permissionOverlay?: boolean;
 overLayRect?: (color:number,x:number,y:number,w:number,h:number,time:number,lineWidth:number)=>boolean;
 overLaySetGroup?: (group:string)=>void;
 overLayFreezeGroup?: (group:string)=>void;
 overLayContinueGroup?: (group:string)=>void;
 overLayClearGroup?: (group:string)=>void;
 rsLinked?: boolean;
 maxtransfer?: number;
 capture?: (x:number,y:number,w:number,h:number)=>Uint8ClampedArray;
 bindRegion?: (x:number,y:number,w:number,h:number)=>number;
 bindReadString?: (id:number,font:string,x:number,y:number)=>string;
 bindGetRegion?: (id:number,x:number,y:number,w:number,h:number)=>string;
}
declare global { interface Window { alt1?: Alt1Api } }
export function getStatus(api:Alt1Api|undefined) {
 return { connected: Boolean(api), pixel: api?.permissionPixel === true, gameState: api?.permissionGameState === true, width: api?.rsWidth ?? 0, height: api?.rsHeight ?? 0 };
}
export function identify() {
 window.alt1?.identifyAppUrl?.(new URL('./appconfig.json',location.href).href);
}
