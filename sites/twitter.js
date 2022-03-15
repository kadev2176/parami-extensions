(() => {
  const wm = new WeakMap();

  const callback = mutations => {
    for (let i = 0; i < mutations.length; i += 1) {
      const mutation = mutations[i];

      if (mutation.type !== 'childList') return;

      if (!mutation.addedNodes) return;

      if (
        mutation.addedNodes.length === 1 &&
        mutation.addedNodes[0].className === 'pfp-link-badge'
      )
        return;
    }

    const avatars = document.querySelectorAll('img[src*="profile_images"]');

    for (let i = 0; i < avatars.length; i += 1) {
      const avatar = avatars[i];
      if (!wm.has(avatar)) {
        wm.set(avatar, true);

        const a = avatar.closest('a');

        if (a) {
          const container = a.parentElement.parentElement;

          const span = document.createElement('span');
          span.className = 'pfp-link-badge';

          const logo = document.createElement('img');
          logo.src = chrome.runtime.getURL('/images/logo-round-core.svg');
          span.append(logo);

          container.prepend(span);
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
