'use strict';

import './common.css';
import { LINK_BADGE_CLASSNAME } from './models';
import { fetchBin, solveBin, parseWnft, parseMetaLink } from './utilities';
import { ethers } from 'ethers';
import abi from './mockAbi';

(() => {
    const nodeMap = new Map();
    const imgUrl2Wnft = new Map();
    const wnft2href = new Map();
  
    const callback = async mutations => {
      for (let i = 0; i < mutations.length; i += 1) {
        const mutation = mutations[i];
  
        if (mutation.type !== 'childList') return;
  
        if (!mutation.addedNodes) return;
  
        if (
          mutation.addedNodes.length === 1 &&
          mutation.addedNodes[0].className === LINK_BADGE_CLASSNAME
        ) {
          return;
        }
      }
  
      const avatars = document.querySelectorAll('img[src*="profile_images"]');
  
      for (let i = 0; i < avatars.length; i += 1) {
        const avatar = avatars[i];
        if (!nodeMap.has(avatar)) {
          nodeMap.set(avatar, true);
  
          const a = avatar.closest('a');
  
          if (!a) continue;
  
          const container = a.parentElement.parentElement;
  
          if (container.querySelector(`.${LINK_BADGE_CLASSNAME}`)) continue;
  
          if (a.href.endsWith('/followers_you_follow')) continue;
  
          const uri = new URL(avatar.src);
          const ext = uri.pathname.split('.').at(-1);
          const url = `${uri.origin}${uri.pathname
            .split('_')
            .slice(0, -1)
            .join('_')}.${ext}`;
  
          if (!imgUrl2Wnft.has(url)) {
            // eslint-disable-next-line no-await-in-loop
            const bin = await fetchBin(url);
            // eslint-disable-next-line no-await-in-loop
            const img = await solveBin(bin);
  
            if (img.width < 20) continue;
  
            try {
              const wnft = parseWnft(img);
              if (wnft) {
                imgUrl2Wnft.set(url, wnft);
              } else {
                continue;
              }
            } catch (e) {
              console.log('[parami error: parse wnft]', e);
            }
          }
  
          const wnftUrl = imgUrl2Wnft.get(url);
          
          if (!wnftUrl) continue;

          let href;
          if (!wnft2href.has(wnftUrl)) {
            href = await parseMetaLink(wnftUrl, 0);
            wnft2href.set(wnftUrl, href);
          }
          href = wnft2href.get(wnftUrl);
          if (href) {
            const span = document.createElement('a');
            span.href = href;
            span.target = '_blank';
            span.className = LINK_BADGE_CLASSNAME;
            span.style.opacity = 1;

            const logo = document.createElement('img');
            logo.src = chrome.runtime.getURL('icons/logo-round-core.svg');
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

    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === 'UrlChange') {
          // clear cache
          nodeMap.clear();
          imgUrl2Wnft.clear();
          wnft2href.clear();
        }
    });
})();