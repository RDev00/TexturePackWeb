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

function crearLink(objeto, name){
  const objLink = document.createElement('a');
  objLink.href = objeto.toDataURL();
  objLink.download = name;
  objLink.innerText = `Descargar imagen: ${name}`;
  objLink.classList.add('texturelink');
  return objLink
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
  
  const colorPrincipal = document.getElementById('color_1').value;
  const colorSecundario = document.getElementById('color_2').value;
  
  const gs03 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_Gamesheet03.png', './resources/principal_color/GJ_Gamesheet031.png', './resources/secondary_color/GJ_Gamesheet032.png'],
    w: 2048, h: 2048,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const linkgs03 = crearLink(gs03, 'GJ_Gamesheet03-hd.png');
  linkDivs.appendChild(linkgs03);

  const geoBs = await generarTextura({
    imageSources: ['./resources/base_color/BlankSheet.png', './resources/principal_color/BlankSheet1.png', './resources/secondary_color/BlankSheet2.png'],
    w: 889, h: 1143,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const linkgeoBS = crearLink(geoBs, 'BlankSheet-hd.png');
  linkDivs.appendChild(linkgeoBS);

  const btn01 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_button_00.png', './resources/both_color/GJ_button_00.png', './resources/both_color/GJ_button_00.png'],
    w: 80, h: 80,
    colorPrin: colorPrincipal, colorSec: colorPrincipal
  });
  const linkbtn01 = crearLink(btn01, 'GJ_button_01-hd.png');
  linkDivs.appendChild(linkbtn01);

  const btn02 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_button_00.png', './resources/both_color/GJ_button_00.png', './resources/both_color/GJ_button_00.png'],
    w: 80, h: 80,
    colorPrin: colorSecundario, colorSec: colorSecundario
  });
  const linkbtn02 = crearLink(btn02, 'GJ_button_02-hd.png');
  linkDivs.appendChild(linkbtn02);

  const sl01 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_moveBtn.png', './resources/both_color/GJ_moveBtn.png', './resources/both_color/GJ_moveBtn.png'],
    w: 76, h: 80,
    colorPrin: colorPrincipal, colorSec: colorPrincipal
  });
  const linksl01 = crearLink(sl01, 'GJ_moveBtn-hd.png');
  linkDivs.appendChild(linksl01);

  const sl02 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_moveBtn.png', './resources/both_color/GJ_moveBtn.png', './resources/both_color/GJ_moveBtn.png'],
    w: 76, h: 80,
    colorPrin: colorSecundario, colorSec: colorSecundario
  });
  const linksl02 = crearLink(sl02, 'GJ_moveSBtn-hd.png');
  linkDivs.appendChild(linksl02);

  const gs04 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_GameSheet04.png', './resources/principal_color/GJ_GameSheet041.png', './resources/secondary_color/GJ_GameSheet042.png'],
    w: 1133, h: 1133,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const linkgs04 = crearLink(gs04, 'GJ_Gamesheet04-hd.png');
  linkDivs.appendChild(linkgs04);

  const ls = await generarTextura({
    imageSources: ['./resources/base_color/GJ_Launchsheet.png', './resources/principal_color/GJ_Launchsheet1.png', './resources/secondary_color/GJ_Launchsheet2.png'],
    w: 934, h: 255,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const linkls = crearLink(ls, 'GJ_Launchsheet-hd.png');
  linkDivs.appendChild(linkls);

  const square1 = await generarTextura({
    imageSources: ['./resources/base_color/GJ_square01.png', './resources/principal_color/GJ_square011.png', './resources/principal_color/GJ_square011.png'],
    w: 160, h: 160,
    colorPrin: colorPrincipal, colorSec: colorPrincipal
  });
  const linksquare1 = crearLink(square1, 'GJ_square01-hd.png');
  linkDivs.appendChild(linksquare1);

  const tg = await generarTextura({
    imageSources: ['./resources/principal_color/tab-gradient1.png', './resources/principal_color/tab-gradient1.png', './resources/principal_color/tab-gradient1.png'],
    w: 788, h: 107,
    colorPrin: colorPrincipal, colorSec: colorPrincipal
  });
  const linktg = crearLink(tg, 'tab-gradient-hd.png');
  linkDivs.appendChild(linktg);
  
  const apis = await generarTextura({
    imageSources: ['./resources/base_color/APISheet.png', './resources/principal_color/APISheet1.png', './resources/secondary_color/APISheet2.png'],
    w: 825, h: 918,
    colorPrin: colorPrincipal, colorSec: colorSecundario
  });
  const linkapis = crearLink(apis, 'APISheet-hd.png');
  linkDivs.appendChild(linkapis);
})