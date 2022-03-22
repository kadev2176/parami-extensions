/* eslint-disable no-continue */

(() => {
    const pictures = new Map();
    const identifiers = new Map();

    const wm = new WeakMap();

    const callback = async mutations => {
        for (let i = 0; i < mutations.length; i++) {
            const mutation = mutations[i];

            if (mutation.type !== 'childList') return;
            if (!mutation.addedNodes) return;

            if (
                mutation.addedNodes.length === 1 &&
                mutation.addedNodes[0].className === window.pfp.labelName
            ) {
                return;
            }

            const childNodes = mutation.target.childNodes;
            for (let j = 0; j < childNodes.length; j++) {
                const node = childNodes[j];
                const img = node.querySelector('img');
                if (!wm.has(img)) {
                    wm.set(img, true);

                    const container = img.parentElement;
                    const containerParent = img.parentElement.parentElement;
                    const containerParentParent = img.parentElement.parentElement.parentElement;
                    const containerParentParentParent = img.parentElement.parentElement.parentElement.parentElement;
                    const containerParentParentParentParent = img.parentElement.parentElement.parentElement.parentElement.parentElement;
                    if (container.querySelector(`.${window.pfp.labelName}`)) continue;

                    const url = img.src;

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
                    logo.src = chrome.runtime.getURL('/images/logo-round-core.svg');

                    span.append(logo);

                    container.style.overflow = 'initial';
                    containerParent.style.overflow = 'initial';
                    containerParentParent.style.overflow = 'initial';
                    containerParentParentParent.style.overflow = 'initial';
                    containerParentParentParentParent.style.overflow = 'initial';

                    img.style.borderRadius = '100%';
                    img.style.overflow = 'hidden';

                    containerParent.append(span);
                }
            }

        }
    };

    const observer = new MutationObserver(callback);

    observer.observe(document, {
        subtree: true,
        childList: true,
    });
})();