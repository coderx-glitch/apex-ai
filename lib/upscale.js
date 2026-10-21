// Browser-only image upscaling. This is interpolation plus a mild sharpen
// convolution - it makes an image larger, it does not invent real detail.
// Honest labeling matters: this is not AI super-resolution.
export const UPSCALE_LIMIT=40000000; // 40 megapixels output cap, same as resize
export function upscaleDimensions(width,height,scale){
 const factor=Number(scale);
 if(![2,4].includes(factor))throw Error('Choose a 2x or 4x upscale.');
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw Error('Image dimensions are invalid.');
 const out={width:width*factor,height:height*factor};
 if(out.width*out.height>UPSCALE_LIMIT)throw Error('Upscaling would exceed 40 megapixels. Try a smaller source or 2x.');
 return out;
}
// Two-step upscale: canvas smoothing first, then a light unsharp mask so the
// result is not as soft as plain interpolation. amount 0..1.
export function sharpenImageData(data,amount=0.35){
 const{width,height,data:px}=data,k=Number(amount);
 if(!(k>0))return data;
 const src=new Uint8ClampedArray(px);
 for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const i=(y*width+x)*4;
  for(let c=0;c<3;c++){
   const lap=5*src[i+c]-src[i-4+c]-src[i+4+c]-src[i-width*4+c]-src[i+width*4+c];
   px[i+c]=src[i+c]+k*(lap-src[i+c]);
  }
 }
 return data;
}
