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
                mutation.addedNodes[0].className === window.pfp.labelName
            ) {
                return;
            }
        }

        const avatars = document.querySelectorAll('div[class="avator"]');
        const faces = document.querySelectorAll('div[class="face"]');
        const containers = [...avatars, ...faces];
        for (let i = 0; i < containers.length; i += 1) {
            const avatar = containers[i];
            if (!wm.has(avatar)) {
                wm.set(avatar, true);

                const a = avatar.querySelector('a');
                const img = a.querySelector('img');

                const container = a.parentElement;
                if (container.querySelector(`.${window.pfp.labelName}`)) continue;

                const uri = img.src;

                const url = uri.replace(/crop(.*?)\//, 'crop.0.0.600.600.1024/', uri);

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
                span.className = window.pfp.labelName;
                span.onclick = () => window.open(meta.url, '_blank');
                span.style.opacity = 1;

                const logo = document.createElement('img');
                logo.className = 'pfp-logo';
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