export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function imageData(src) {
  if (src.startsWith('data:')) return src;
  const response = await fetch(src, { mode: 'cors', credentials: 'omit' });
  if (!response.ok) throw new Error('An image could not be loaded for export. Upload the logo instead or use an image URL that allows downloads.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
}

export async function standaloneClone(node) {
  // Cancel transitions before measuring so an immediate export cannot capture
  // the tent panel halfway through its rotation.
  node.setAttribute('data-exporting', 'true');
  let clone;
  try {
    clone = node.cloneNode(true);
    const originals = [node, ...node.querySelectorAll('*')];
    const copies = [clone, ...clone.querySelectorAll('*')];
    for (let index = 0; index < originals.length; index++) {
      const style = getComputedStyle(originals[index]);
      for (const name of style) copies[index].style.setProperty(name, style.getPropertyValue(name));
      copies[index].style.setProperty('animation', 'none');
      copies[index].style.setProperty('transition', 'none');
    }
  } finally {
    node.removeAttribute('data-exporting');
  }
  await Promise.all([...clone.querySelectorAll('img, image')].map(async image => {
    const source = image.getAttribute('src') || image.getAttribute('href') || image.getAttribute('xlink:href');
    if (!source) return;
    const data = await imageData(source);
    if (image.tagName.toLowerCase() === 'img') image.setAttribute('src', data);
    else { image.setAttribute('href', data); image.removeAttribute('xlink:href'); }
  }));
  return clone;
}

export async function exportPoster(node) {
  await document.fonts.ready;
  const clone = await standaloneClone(node);
  const width = node.offsetWidth, height = node.offsetHeight;
  clone.style.margin = '0';
  const wrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wrapper.setAttribute('width', width); wrapper.setAttribute('height', height);
  const foreign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  foreign.setAttribute('width', '100%'); foreign.setAttribute('height', '100%');
  foreign.appendChild(clone); wrapper.appendChild(foreign);
  const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(wrapper))}`;
  const image = new Image();
  await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('This browser could not export the poster. Use Print to save a PDF.')); image.src = source; });
  const canvas = document.createElement('canvas'); canvas.width = width * 2; canvas.height = height * 2;
  const context = canvas.getContext('2d'); context.scale(2, 2); context.drawImage(image, 0, 0);
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Unable to export poster. Use Print to save a PDF.');
  return blob;
}
