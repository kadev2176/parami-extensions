/* eslint no-bitwise: ["error", { "allow": ["<<=", "|="] }] */

(() => {
  if ('pfp' in window) {
    return;
  }

  window.pfp = {
    lableName: 'pfp-link-badge',

    fetch: async url => {
      const res = await fetch(url);
      const bin = await res.blob();
      return bin;
    },

    solve: bin => {
      return new Promise(resolve => {
        const img = new Image();
        img.src = URL.createObjectURL(bin);
        img.onload = () => resolve(img);
      });
    },

    parse: img => {
      if (img.width !== img.height || img.width < 220) {
        throw new Error('image is not square or too small');
      }

      const cvs = document.createElement('canvas');
      cvs.width = img.width;
      cvs.height = img.height;

      const ctx = cvs.getContext('2d');

      if (ctx === null) {
        throw new Error('canvas is not supported');
      }

      ctx.drawImage(img, 0, 0);

      const binary = new Uint8Array(20);

      const threshold = 220;
      const step = (10 * Math.PI) / 9 / 180;

      const r = Math.round(((324 * img.width) / 640) * 10) / 10;
      let angle = Math.PI / 9 + step / 2;

      let i = 0;
      // let cs = true;
      let byte = 0;
      for (let j = 0; j < 180; j += 1) {
        if (j % 9 === 0) {
          // cs = true;
          byte = 0;
        } else if (j % 9 === 8) {
          binary.set([byte], i);
          i += 1;
        }

        byte <<= 1;

        const x = img.width / 2 + r * Math.cos(angle);
        const y = img.height / 2 + r * Math.sin(angle);
        const pixel = ctx.getImageData(x, y, 1, 1);
        const { data } = pixel;

        const R = data[0]; // R(0-255)
        const G = data[1]; // G(0-255)
        const B = data[2]; // B(0-255)
        const sum = (R + G + B) / 3;

        if (sum >= threshold) {
          byte |= 1;

          // if (j % 9 === 8) {
          //   // eslint-disable-next-line eqeqeq
          //   if ((byte & 1) != cs) {
          //     throw new Error('checksum error');
          //   }
          // } else {
          //   cs = !cs;
          // }
        }

        angle += step;
        if ((j + 1) % 45 === 0) {
          angle += (2 * Math.PI) / 9;
        }
      }

      // eslint-disable-next-line no-undef
      const b58 = bs58.encode(binary);

      const hex = binary.reduce(
        (s, b) => s + b.toString(16).padStart(2, '0'),
        ''
      );

      return {
        b58: `did:ad3:${b58}`,
        hex: `0x${hex}`,
      };
    },

    get: async aux => {
      const { b58, hex } = aux;
      try {
        const res = await fetch('https://graph.parami.io/', {
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `{dids(filter: {id: {equalTo: "${hex}"}}) {nodes {id}}}`,
          }),
          method: 'POST',
        });
        const json = await res.json();
        if (json.data.dids.nodes.length === 0) return null;

        return {
          url: `https://app.parami.io/${b58}`,
        };
      } catch {
        return null;
      }
    },
  };
})();
