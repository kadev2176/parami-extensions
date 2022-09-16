'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

import { NETWORK_MAINNET, NETWORK_TEST } from './models';
import { ApiPromise, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { config } from './config';

const defaultAdIcon = chrome.runtime.getURL('icons/logo-round-core.svg');

chrome.storage.sync.set(
  {
    network: NETWORK_MAINNET,
  },
);

(async () => {
  await cryptoWaitReady();
  const provider = new WsProvider(config.socketServer);
  const api = await ApiPromise.create({
    provider,
    types: config.types,
    rpc: config.rpc
  });

  const fetchAdIcon = async (nftId) => {
    if (!nftId) {
      return null;
    }

    try {
      const slotResp = await api.query.ad.slotOf(nftId);

      if (slotResp.isEmpty) return null;

      const slot = slotResp.toHuman();
      console.log('Get slot', slot);
      const adResp = await api.query.ad.metadata(slot.adId);

      if (adResp.isEmpty) return null;

      const ad = adResp.toHuman();
      console.log('Get ad metadata', ad);

      if (ad?.metadata?.indexOf('ipfs://') < 0) return null;

      const hash = ad?.metadata?.substring(7);

      const res = await fetch(config.ipfsEndpoint + hash);
      const adJson = await res.json();
      console.log('Get ad Json', adJson);
      return adJson.icon;
    } catch (e) {
      return null;
    }
  }

  chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      if (request.method === 'fetchAdIcon') {
        fetchAdIcon(request.nftId).then(icon => {
          sendResponse({
            adIcon: icon ?? defaultAdIcon
          });
        });
      }
      return true;
    }
  );

})();
