/* eslint-disable no-continue */

(() => {
  const pictures = new Map();
  const identifiers = new Map();

  const wm = new WeakMap();

  const callback = async mutations => {
    for (let i = 0; i < mutations.length; i += 1) {
      const mutation = mutations[i];

      if (mutation.type !== 'childList') return;

      if (!mutation.addedNodes) return;

      if (
        mutation.addedNodes.length === 1 &&
        mutation.addedNodes[0].className === window.pfp.lableName
      ) {
        return;
      }
    }

    const avatars = document.querySelectorAll('img[src*="profile_images"]');

    for (let i = 0; i < avatars.length; i += 1) {
      const avatar = avatars[i];
      if (!wm.has(avatar)) {
        wm.set(avatar, true);

        const a = avatar.closest('a');

        if (!a) continue;

        const container = a.parentElement.parentElement;

        if (container.querySelector(`.${window.pfp.lableName}`)) continue;

        const uri = new URL(avatar.src);
        const ext = uri.pathname.split('.').at(-1);
        const url = `${uri.origin}${uri.pathname
          .split('_')
          .slice(0, -1)
          .join('_')}.${ext}`;

        let did = '';
        let meta = null;
        if (pictures.has(url)) {
          did = pictures.get(url);
          meta = identifiers.get(did);
        } else {
          // eslint-disable-next-line no-await-in-loop
          const bin = await window.pfp.fetch(url);
          // eslint-disable-next-line no-await-in-loop
          const img = await window.pfp.solve(bin);

          try {
            const aux = window.pfp.parse(img);
            did = aux.hex;

            // eslint-disable-next-line no-await-in-loop
            meta = await window.pfp.get(aux);
            if (meta) identifiers.set(did, meta);
            else did = '';
          } catch {
            //
          }

          pictures.set(url, did);
        }

        if (!did || !meta) continue;

        const span = document.createElement('a');
        span.href = meta.url;
        span.target = '_blank';
        span.className = window.pfp.lableName;

        const logo = document.createElement('img');
        logo.src = chrome.runtime.getURL('/images/logo-round-core.svg');
        span.append(logo);

        container.prepend(span);
      }
    }
  };

  const observer = new MutationObserver(callback);

  observer.observe(document, {
    subtree: true,
    childList: true,
  });
})();
