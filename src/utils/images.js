export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function validateImageFile(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Choose a PNG, JPEG, WebP or GIF image.');
  if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
}

export function checkImageBudget(profile) {
  if (new TextEncoder().encode(JSON.stringify(profile)).length > 3.7 * 1024 * 1024) throw new Error('This shop has too many uploaded photos to save. Remove a photo or use smaller images.');
}

export async function prepareImage(file, maxWidth = 1000) {
  validateImageFile(file);
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('This image could not be opened. Choose another file.')); image.src = source; });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 60000000) throw new Error('Choose a smaller image (under 60 megapixels).');
    const canvas = document.createElement('canvas');
    let size = Math.min(maxWidth, Math.max(image.naturalWidth, image.naturalHeight));
    for (let attempt = 0; attempt < 6; attempt++) {
      const scale = size / Math.max(image.naturalWidth, image.naturalHeight);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/webp', Math.max(.55, .85 - attempt * .06));
      if (data.length <= 180000) return data;
      size *= .75;
    }
    throw new Error('Unable to optimize this photo. Please choose a smaller image.');
  } finally { URL.revokeObjectURL(source); }
}
