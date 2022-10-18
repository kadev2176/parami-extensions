///<reference types="chrome"/>
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AD_ICON_CONTAINER_CLASSNAME, NFT_RECOGNITION_ENDPOINT, PREFIX_WNFT } from '../models';
import { fetchBin, solveBin, parseWnft, parseMetaLink, parseAdInfoFromUrl } from '../utilities';
import AdIcon from './AdIcon/AdIcon';
import 'antd/dist/antd.css';

(() => {
  const nodeMap = new Map();
  const imgUrl2Wnft = new Map();
  const wnft2href = new Map();

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

    for (let i = 0; i < avatars.length; i += 1) {
      const avatar = avatars[i] as HTMLImageElement;
      if (!nodeMap.has(avatar)) {
        nodeMap.set(avatar, true);

        const a = avatar.closest('a') as HTMLAnchorElement;

        if (!a) continue;

        const container = a.parentElement!.parentElement!;

        const adIconContainerDiv = container.querySelector(`.${AD_ICON_CONTAINER_CLASSNAME}`);
        if (adIconContainerDiv) {
          if (!a.href.endsWith('/photo')) {
            console.log('loop avatar skipping', AD_ICON_CONTAINER_CLASSNAME, adIconContainerDiv);
            continue;
          }
          console.log('loop avatar Removing /photo');
          adIconContainerDiv.remove();
        }

        if (a.href.endsWith('/followers_you_follow')) continue;

        if (!imgUrl2Wnft.has(avatar.src)) {
          const fetchNftResp = await fetch(`${NFT_RECOGNITION_ENDPOINT}?imageUrl=${avatar.src}`);
          if (fetchNftResp.ok) {
            const hnft = await fetchNftResp.json();
            imgUrl2Wnft.set(avatar.src, `${PREFIX_WNFT}${hnft.contractAddress}?tokenId=${hnft.tokenId}`)
          }
        }

        if (!imgUrl2Wnft.has(avatar.src)) {
          const uri = new URL(avatar.src);
          const ext = uri.pathname.split('.').at(-1);
          const url = `${uri.origin}${uri.pathname
            .split('_')
            .slice(0, -1)
            .join('_')}.${ext}`;

          // eslint-disable-next-line no-await-in-loop
          const bin = await fetchBin(url);
          // eslint-disable-next-line no-await-in-loop
          const img = await solveBin(bin);

          if (img.width < 20) continue;

          try {
            const wnft = parseWnft(img);
            if (wnft) {
              imgUrl2Wnft.set(avatar.src, wnft);
            } else {
              continue;
            }
          } catch (e) {
            console.log('[parami error: parse wnft]', e);
          }
        }

        const wnftUrl = imgUrl2Wnft.get(avatar.src);

        if (!wnftUrl) continue;

        let href: string;
        if (!wnft2href.has(wnftUrl)) {
          href = await parseMetaLink(wnftUrl, 0);
          wnft2href.set(wnftUrl, href);
        }
        href = wnft2href.get(wnftUrl);
        if (href) {
          if (container.querySelector(`.${AD_ICON_CONTAINER_CLASSNAME}`)) {
            continue;
          }
          const adIconContainer = document.createElement('div');
          adIconContainer.setAttribute('style', 'width: 100%; height:100%;');
          adIconContainer.setAttribute('class', AD_ICON_CONTAINER_CLASSNAME);
          container.prepend(adIconContainer);
          const root = createRoot(adIconContainer);

          const adInfo = parseAdInfoFromUrl(href);

          if (adInfo.isParamiAd) {
            chrome.runtime.sendMessage({ method: 'fetchAd', adInfo }, (response) => {
              const { ad } = response;
              root.render(<AdIcon ad={ad} href={href} avatarSrc={avatar.src} />);
            });
          } else {
            root.render(<AdIcon ad={{success: true, data: null}} href={href} />);
          }
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

  chrome.runtime.sendMessage({ method: 'openTwitterTab' }, () => {});

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      // listen for messages sent from background.js
      if (request.method === 'urlChange') {
        console.log('Got url change. Clear cache.');
        // clear cache
        nodeMap.clear();
        imgUrl2Wnft.clear();
        wnft2href.clear();
      }
    });
})();
