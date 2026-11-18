import type {Alt1Api} from './bridge';
export function decodePixels(base64:string,expected:number):Uint8ClampedArray {
 const raw=atob(base64);if(raw.length!==expected*4)throw Error('Tamaño de captura incorrecto.');
 const data=new Uint8ClampedArray(raw.length);
 for(let i=0;i<raw.length;i+=4){data[i]=raw.charCodeAt(i+2);data[i+1]=raw.charCodeAt(i+1);data[i+2]=raw.charCodeAt(i);data[i+3]=255;}return data;
}
export function captureGame(api:Alt1Api|undefined):ImageData{
 if(!api?.permissionPixel)throw Error('Autoriza la lectura de pantalla en Alt1.');
 const w=api.rsWidth??0,h=api.rsHeight??0;
 if(api.rsLinked===false||!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>20000000)throw Error('Abre RuneScape y comprueba que Alt1 esté conectado.');
 if(api.capture){const buffer=api.capture(0,0,w,h);if(buffer.length!==w*h*4)throw Error('Captura incompleta.');const im=new ImageData(w,h);im.data.set(buffer);return im;}
 if(!api.bindRegion||!api.bindGetRegion)throw Error('La versión de Alt1 no expone captura compatible.');
 const id=api.bindRegion(0,0,w,h);if(id<=0)throw Error('Alt1 no pudo capturar el juego.');
 const im=new ImageData(w,h);
 const limit=Math.min(3000000,api.maxtransfer&&api.maxtransfer>0?Math.floor(api.maxtransfer*0.7):3000000);
 const rows=Math.max(1,Math.floor(limit/(w*4)));
 for(let y=0;y<h;y+=rows){const n=Math.min(rows,h-y);im.data.set(decodePixels(api.bindGetRegion(id,0,y,w,n),w*n),y*w*4);}
 return im;
}
