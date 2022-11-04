///<reference types="chrome"/>
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AD_ICON_CONTAINER_CLASSNAME, NOT_PARAMI_AD } from '../models';
import { queryAdInfoFromAvatar } from '../utilities';
import AdIcon from './AdIcon/AdIcon';
import 'antd/dist/antd.css';

(() => {
  const nodeMap = new Map();
  const imgUrl2AdInfoPromise = new Map();
  let fromUser: string;

  const callback = async (mutations: any) => {
    for (let i = 0; i < mutations.length; i += 1) {
      const mutation = mutations[i];

      if (mutation.type !== 'childList') return;

      if (!mutation.addedNodes) return;

      if (
        mutation.addedNodes.length === 1 &&
        mutation.addedNodes[0].className === AD_ICON_CONTAINER_CLASSNAME
      ) {
        console.log('mutation skipping', AD_ICON_CONTAINER_CLASSNAME);
        return;
      }
    }

    const avatars = document.querySelectorAll('img[src*="profile_images"]');

    if (!fromUser) {
      const userDataTestid = document.querySelector('div[aria-label="Account menu"]')?.querySelector('[data-testid*="UserAvatar-Container"]')?.getAttribute('data-testid') ?? '';
      fromUser = userDataTestid.slice(userDataTestid.lastIndexOf('-') + 1);
    }

    for (let i = 0; i < avatars.length; i += 1) {
      const avatar = avatars[i] as HTMLImageElement;
      if (!nodeMap.has(avatar)) {
        nodeMap.set(avatar, true);

        const a = avatar.closest('a') as HTMLAnchorElement;

        if (!a) continue;

        const isRegularAvatar = !a.href.endsWith('/photo') && !a.href.endsWith('/nft');

        const container = isRegularAvatar ? avatar.closest('[data-testid*="UserAvatar-Container"]') : a.parentElement!.parentElement!;
        if (!container) continue;

        const adIconContainerDiv = container.querySelector(`.${AD_ICON_CONTAINER_CLASSNAME}`);
        if (adIconContainerDiv) {
          if (isRegularAvatar) {
            continue;
          }
          adIconContainerDiv.remove();
        }

        if (a.href.endsWith('/followers_you_follow')) continue;

        if (!imgUrl2AdInfoPromise.has(avatar.src)) {
          const targetUsername = a.href.slice(a.href.lastIndexOf('/') + 1);
          imgUrl2AdInfoPromise.set(avatar.src, queryAdInfoFromAvatar(avatar.src, targetUsername !== 'photo' ? targetUsername : '', fromUser));
        }

        const { isHnft, adInfo, hyperlink } = await imgUrl2AdInfoPromise.get(avatar.src);

        if (!isHnft) {
          continue;
        }

        if (container.querySelector(`.${AD_ICON_CONTAINER_CLASSNAME}`)) {
          continue;
        }

        const adIconContainer = document.createElement('div');
        adIconContainer.setAttribute('style', 'width: 100%; height:100%;');
        adIconContainer.setAttribute('class', AD_ICON_CONTAINER_CLASSNAME);
        container.prepend(adIconContainer);
        const root = createRoot(adIconContainer);

        if (adInfo.isParamiAd) {
          chrome.runtime.sendMessage({ method: 'fetchAd', adInfo }, (response) => {
            const { ad } = response;
            root.render(<AdIcon ad={ad} href={hyperlink} avatarSrc={avatar.src} largeIcon={!isRegularAvatar} />);
          });
        } else {
          root.render(<AdIcon ad={NOT_PARAMI_AD} href={hyperlink} largeIcon={!isRegularAvatar} />);
        }
      }
    }
  };

  try {
    const observer = new MutationObserver(callback);

    observer.observe(document, {
      subtree: true,
      childList: true,
    });
  } catch (e) {
    console.log(e);
  }

  chrome.runtime.sendMessage({ method: 'openTwitterTab' }, () => { });

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      // listen for messages sent from background.js
      if (request.method === 'urlChange') {
        console.log('Got url change. Clear cache.');
        // clear cache
        nodeMap.clear();
        imgUrl2AdInfoPromise.clear();
      }
    });
})();
