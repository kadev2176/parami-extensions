'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

import { NETWORK_MAINNET, NETWORK_TEST } from './models';
import { ApiPromise, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
// import { formatBalance } from '@polkadot/util';
import { config } from './config';
import { deleteComma } from './utilities';

chrome.storage.sync.set(
  {
    network: NETWORK_MAINNET,
  },
);

const noAdResponse = {
  success: true,
  data: null
};

(async () => {
  await cryptoWaitReady();
  const provider = new WsProvider(config.socketServer);
  const api = await ApiPromise.create({
    provider,
    // rpc: config.rpc,
    runtime: config.runtime
  });

  await api.isReady;

  const fetchAd = async (nftId, did) => {
    if (!nftId) {
      return noAdResponse;
    }

    try {
      const slotResp = await api.query.ad.slotOf(nftId);

      if (slotResp.isEmpty) return noAdResponse;

      const { adId, budgetPot, fractionId } = slotResp.toHuman();
      const adResp = await api.query.ad.metadata(adId);

      if (adResp.isEmpty) return noAdResponse;

      const ad = adResp.toHuman();

      if (ad?.metadata?.indexOf('ipfs://') < 0) return noAdResponse;

      const hash = ad?.metadata?.substring(7);

      const adJsonResp = await fetch(config.ipfsEndpoint + hash);
      const adJson = await adJsonResp.json();

      const adClaimed = did ? !(await api.query.ad.payout(adId, did)).isEmpty : false;

      const nftInfo = await api.query.nft.metadata(nftId);
      const tokenAssetId = nftInfo.isEmpty ? '' : (nftInfo.toHuman()).tokenAssetId;

      const assetInfo = await api.query.assets.metadata(Number(deleteComma(tokenAssetId)));
      const asset = assetInfo.isEmpty ? {} : assetInfo.toHuman();

      // const value = await api.rpc.swap.drylySellTokens(deleteComma(tokenAssetId), '1'.padEnd(18, '0'));
      // const tokenPrice = value.toHuman();

      return {
        success: true,
        data: {
          ...adJson,
          adId,
          adClaimed,
          nftId,
          userDid: did,
          assetName: asset.name,
        }
      }
    } catch (e) {
      console.log(e);
      return {
        success: false,
        data: null,
        nftId
      };
    }
  }

  const calReward = async (adId, nftId, did) => {
    // FIX IT: The result of runtime api calReward is somehow 256 times of the correct value
    let res = await api.call.adRuntimeApi.calReward(adId, nftId, did, null);
    return (BigInt(deleteComma(res.toHuman())) / BigInt(256)).toString();
  }

  let twitterTabId;
  chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      if (request.method === 'fetchAd') {
        chrome.storage.sync.get(['didHex'], res => {
          fetchAd(request.nftId, res?.didHex).then(ad => {
            sendResponse({
              ad
            });
          });
        });
      }

      if (request.method === 'calReward') {
        calReward(request.adId, request.nftId, request.did).then(rewardAmount => {
          sendResponse({
            rewardAmount
          });
        })
      }

      if (request.method === 'openTwitterTab') {
        twitterTabId = sender.tab.id;
      }

      if (request.method === 'didChange' && twitterTabId) {
        chrome.tabs.sendMessage(twitterTabId, request);
      }

      return true;
    }
  );

})();

// detect tabs change
chrome.tabs.onUpdated.addListener(
  function(tabId, changeInfo, tab) {
    console.log('tab change detected', tabId, changeInfo, tab);
    if (changeInfo.url && changeInfo.url.startsWith('https://twitter.com')) {
      chrome.tabs.sendMessage(tabId, {
        method: 'urlChange'
      });
    }
  }
);
