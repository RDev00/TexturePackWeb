// Función principal simplificada
async function generarTextura({ imageSources, w, h, colorPrin, colorSec }) {
  //creamos la funcion para obtener el HSB (HUE (color), Saturation (intensidad de color), Brightness (luminosidad))
  function hsbToRgb(h, s, v) {
    //Ni yo se como funciona esto, son matematicas, hijo :v xdxdxd
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r, g, b;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }
  function hsbFromHex(hex) {
    if(hex.charAt(0) === '#') hex = hex.substr(1);
    const r = parseInt(hex.substr(0,2), 16) / 255;
    const g = parseInt(hex.substr(2,2), 16) / 255;
    const b = parseInt(hex.substr(4,2), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const brightness = max;
    const saturation = (max === 0) ? 0 : delta / max;
    let hue = 0;
    if(delta !== 0) {
      if(max === r) hue = 60 * (((g - b) / delta) % 6);
      else if(max === g) hue = 60 * (((b - r) / delta) + 2);
      else if(max === b) hue = 60 * (((r - g) / delta) + 4);
    }
    if(hue < 0) hue += 360;
    return {
      hue: parseFloat(hue.toFixed(2)),
      saturation: parseFloat((saturation * 100).toFixed(2)),
      brightness: parseFloat((brightness * 100).toFixed(2))
    };
  }

  function applyTintWithLuminance(img, hsbColor) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
  
    const tint = hsbToRgb(
      hsbColor.hue,
      hsbColor.saturation / 100,
      hsbColor.brightness / 100
    );
  
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) continue; // No modificamos píxeles completamente transparentes
        const lum = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
        data[i] = tint.r * (lum / 255);   // Opción original que queda muy oscura
        // Mejor:
        data[i] = tint.r * (lum / 100);   // ¡Más brillante!
        data[i + 1] = tint.g * (lum / 100);
        data[i + 2] = tint.b * (lum / 100);
    }
  
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  

  //Cargamos la imagen
  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
    });
  }

  const [base, principal, secundaria] = await Promise.all(
    imageSources.map(src => loadImage(src))
  );

  //creamos la imagen
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  //aplicamos todo
  ctx.drawImage(base, 0, 0, w, h); // intacta
  ctx.drawImage(applyTintWithLuminance(principal, hsbFromHex(colorPrin)), 0, 0, w, h);
  ctx.drawImage(applyTintWithLuminance(secundaria, hsbFromHex(colorSec)), 0, 0, w, h);

  //obtenemos la textura
  return canvas;
}
function crearLink(zip, name){
  const objLink = document.createElement('a');
  const zipURL =URL.createObjectURL(zip);
  objLink.href = zipURL;
  objLink.download = `${name}.zip`;
  objLink.innerText = `Descargar Texture Pack`;
  objLink.classList.add('texturelink');
  return objLink
}
async function canvaToImg(dataURL) {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const byteCharacters = atob(parts[1]);
  const byteArrays = [];
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }
  return new Blob([new Uint8Array(byteArrays)], { type: contentType });
}
async function newZip(files) {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, file.img);
  }
  const contenidoZip = await zip.generateAsync({ type: 'blob' });
  if (contenidoZip) {
    console.log('El zip fue creado:', contenidoZip)
  }
  return contenidoZip;
}

const form = document.getElementById('form');
const linkDivs = document.getElementById('links');

/*
Tamaños:
botones: 80x80,
launchsheet: 934x255,
gs04: 1133x1133,
slider: 76x80,
square: 160x160,
geode tab: 788x107
*/

form.addEventListener('submit', async event => {
  event.preventDefault();
  
  const tpname = document.getElementById('tpname').value;
  const colorPrincipal = document.getElementById('color_1').value;
  const colorSecundario = document.getElementById('color_2').value;
  
  const gs03 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_Gamesheet03.png', './resources/principal_color/GJ_Gamesheet031.png', './resources/secondary_color/GJ_Gamesheet032.png'],
    w: 2048, h: 2048,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const gs03Img = await canvaToImg(gs03.toDataURL());

  const geoBs = await generarTextura({
    imageSources: ['./resources/base_color/BlankSheet.png', './resources/principal_color/BlankSheet1.png', './resources/secondary_color/BlankSheet2.png'],
    w: 889, h: 1143,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const geoBsImg = await canvaToImg(geoBs.toDataURL());

  const btn01 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_button_00.png', './resources/both_color/GJ_button_00.png', './resources/both_color/GJ_button_00.png'],
    w: 80, h: 80,
    colorPrin: colorPrincipal, colorSec: colorPrincipal
  });
  const btn01Img = await canvaToImg(btn01.toDataURL());

  const btn02 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_button_00.png', './resources/both_color/GJ_button_00.png', './resources/both_color/GJ_button_00.png'],
    w: 80, h: 80,
    colorPrin: colorSecundario, colorSec: colorSecundario
  });
  const btn02Img = await canvaToImg(btn02.toDataURL());

  const sl01 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_moveBtn.png', './resources/both_color/GJ_moveBtn.png', './resources/both_color/GJ_moveBtn.png'],
    w: 76, h: 80,
    colorPrin: colorPrincipal, colorSec: colorPrincipal
  });
  const sl01Img = await canvaToImg(sl01.toDataURL());

  const sl02 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_moveBtn.png', './resources/both_color/GJ_moveBtn.png', './resources/both_color/GJ_moveBtn.png'],
    w: 76, h: 80,
    colorPrin: colorSecundario, colorSec: colorSecundario
  });
  const sl02Img = await canvaToImg(sl02.toDataURL());

  const gs04 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_GameSheet04.png', './resources/principal_color/GJ_GameSheet041.png', './resources/secondary_color/GJ_GameSheet042.png'],
    w: 1133, h: 1133,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const gs04Img = await canvaToImg(gs04.toDataURL());

  const ls = await generarTextura({
    imageSources: ['./resources/base_color/GJ_Launchsheet.png', './resources/principal_color/GJ_Launchsheet1.png', './resources/secondary_color/GJ_Launchsheet2.png'],
    w: 934, h: 255,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const lsImg = await canvaToImg(ls.toDataURL());

  const square1 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_square01.png', './resources/principal_color/GJ_square011.png', './resources/principal_color/GJ_square011.png'],
    w: 160, h: 160,
    colorPrin: colorPrincipal, colorSec: colorPrincipal
  });
  const square01Img = await canvaToImg(square1.toDataURL());

  const tg = await generarTextura({
    imageSources: ['./resources/principal_color/tab-gradient1.png', './resources/principal_color/tab-gradient1.png', './resources/principal_color/tab-gradient1.png'],
    w: 788, h: 107,
    colorPrin: colorPrincipal, colorSec: colorPrincipal
  });
  const tgImg = await canvaToImg(tg.toDataURL());
  
  const apis = await generarTextura({
    imageSources: ['./resources/base_color/APISheet.png', './resources/principal_color/APISheet1.png', './resources/secondary_color/APISheet2.png'],
    w: 825, h: 918,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const apisImg = await canvaToImg(apis.toDataURL());
  
  const goldFnt = await generarTextura({
    imageSources: ['./resources/base_color/goldFont.png', './resources/secondary_color/goldFont2.png', './resources/secondary_color/goldFont2.png'],
    w: 512, h: 512,
    colorPrin: colorSecundario, colorSec: colorSecundario
  });
  const goldFntImg = await canvaToImg(goldFnt.toDataURL());
  
  const slgrv = await generarTextura({
    imageSources: ['./resources/base_color/slidergroove.png', './resources/secondary_color/slidergroove2.png', './resources/secondary_color/slidergroove2.png'],
    w: 420, h: 32,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const slgrvImg = await canvaToImg(slgrv.toDataURL());
  
  const slth = await generarTextura({
    imageSources: ['./resources/base_color/sliderthumb.png', './resources/secondary_color/sliderthumb2.png', './resources/secondary_color/sliderthumb2.png'],
    w: 76, h: 76,
    colorPrin: colorSecundario, colorSec: colorSecundario
  });
  const slthImg = await canvaToImg(slth.toDataURL());
  
  const slthsel = await generarTextura({
    imageSources: ['./resources/base_color/sliderthumb.png', './resources/secondary_color/sliderthumbsel2.png', './resources/secondary_color/sliderthumbsel2.png'],
    w: 76, h: 76,
    colorPrin: colorSecundario, colorSec: colorSecundario
  });
  const slthselImg = await canvaToImg(slthsel.toDataURL());
  
  const archivos = [
    { name: 'GJ_Gamesheet03-hd.png', img: gs03Img},
    {name: 'GJ_Gamesheet04-hd.png', img: gs04Img},
    { name: 'GJ_button_01-hd.png', img: btn01Img },
    { name: 'GJ_button_02-hd.png', img: btn02Img },
    { name: 'GJ_LaunchSheet-hd.png', img: lsImg },
    { name: 'GJ_moveBtn-hd.png', img: sl01Img },
    { name: 'GJ_moveBtn-hd.png', img: sl01Img },
    { name: 'GJ_moveSBtn-hd.png', img: sl02Img },
    { name: 'GJ_square01-hd.png', img: square01Img },
    { name: 'geode.loader/BlankSheet-hd.png', img: geoBsImg },
    { name: 'geode.loader/tag-gradient.png', img: tgImg },
    { name: 'geode.loader/APISheet-hd.png', img: apisImg },
    { name: 'goldFont-hd.png', img: goldFntImg },
    { name: 'slidergroove-hd.png', img: slgrvImg },
    { name: 'sliderthumb-hd.png', img: slthImg },
    { name: 'sliderthumbsel-hd.png', img: slthselImg }
  ]
  const texturePackZip = await newZip(archivos);
  const texturePackLink = await crearLink(texturePackZip, tpname);
  linkDivs.appendChild(texturePackLink);
})