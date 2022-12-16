'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

import { NETWORK_MAINNET, NOT_PARAMI_AD, AD_DATA_TYPE } from './models';
import { ApiPromise, WsProvider } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { config } from './config';
import { deleteComma } from './utilities';

chrome.storage.sync.set(
  {
    network: NETWORK_MAINNET,
  },
);

const fetchAdPromisesMap = new Map();

const doGraghQuery = async (query) => {
  const obj = {};
  obj.operationName = null;
  obj.variables = {};
  obj.query = query;
  return fetch(config.subqueryServer, {
    "headers": {
      "content-type": "application/json",
    },
    "body": JSON.stringify(obj),
    "method": "POST"
  });
};

const fetchMetadata = async (ipfsUrl) => {
  if (!ipfsUrl || !ipfsUrl.startsWith('ipfs://')) {
    return {}
  }

  const hash = ipfsUrl.substring(7);
  const adJsonResp = await fetch(config.ipfsEndpoint + hash);
  return await adJsonResp.json();
}

(async () => {
  await cryptoWaitReady();
  const provider = new WsProvider(config.socketServer);
  const api = await ApiPromise.create({
    provider,
    rpc: config.rpc,
    runtime: config.runtime
  });

  await api.isReady;

  const fetchAd = async (adInfo, did) => {
    if (!adInfo.nftId) {
      if (!adInfo.contractAddress || !adInfo.tokenId) {
        return NOT_PARAMI_AD;
      }

      const nftIdResp = await api.query.nft.ported('Ethereum', adInfo.contractAddress, adInfo.tokenId);

      if (nftIdResp.isEmpty) {
        return NOT_PARAMI_AD;
      }

      adInfo.nftId = deleteComma(nftIdResp.toHuman());
    }

    if (!adInfo.nftId) {
      return NOT_PARAMI_AD;
    }

    let ad = {
      nftId: adInfo.nftId,
      contractAddress: adInfo.contractAddress,
      tokenId: adInfo.tokenId,
      userDid: did
    };

    try {
      const assetInfo = await api.query.assets.metadata(adInfo.nftId);
      const asset = assetInfo.isEmpty ? {} : assetInfo.toHuman();

      const query = `
        query {
          members(filter: {assetId: {equalTo: "${adInfo.nftId}"}}) {
            totalCount
          }
        }
      `
      const holderAccountsRes = await doGraghQuery(query);
      const holderAccounts = (await holderAccountsRes.json());

      ad.assetName = asset.name;
      ad.numHolders = holderAccounts?.data?.members?.totalCount;

      const header = await api.rpc.chain.getHeader();
      const blockHash = await api.rpc.chain.getBlockHash(header.number - (24 * 60 * 60) / 12);

      const value = await api.rpc.swap.drylySellTokens(adInfo.nftId, '1'.padEnd(18, '0'));
      const tokenPrice = value.toHuman();

      let preTokenPrice;
      try {
        const preValue = await api.rpc.swap.drylySellTokens(adInfo.nftId, '1'.padEnd(18, '0'), blockHash);
        preTokenPrice = preValue.toHuman();
      } catch (_) { }

      ad.tokenPrice = tokenPrice;
      ad.preTokenPrice = preTokenPrice;

      const slotResp = await api.query.ad.slotOf(adInfo.nftId);

      if (!slotResp.isEmpty) {
        ad.type = AD_DATA_TYPE.AD;
        const { adId } = slotResp.toHuman();
        const adResp = await api.query.ad.metadata(adId);
        const adMetadata = adResp.toHuman();
        const adJson = await fetchMetadata(adMetadata?.metadata);
        const adClaimed = did && !(await api.query.ad.payout(adId, did)).isEmpty;

        const instruction = adJson.instructions && adJson.instructions[0];

        ad.adId = adId;
        ad.content = adJson.description ?? adJson.content;
        ad.sponsorName = adJson.sponsorName;
        ad.icon = adJson.icon;
        ad.poster = adJson.media ?? adJson.poster;
        ad.tag = instruction?.tag;
        ad.link = instruction?.link;
        ad.score = instruction?.score;
        ad.adClaimed = adClaimed;

        return {
          success: true,
          data: ad
        }
      }

      const clockInRes = await api.call.clockInRuntimeApi.getClockInInfo(adInfo.nftId, did);
      const [_, enabled, claimable, amount] = clockInRes.toHuman();

      if (!enabled) {
        return {
          success: true,
          data: ad
        };
      }

      const lotteryRes = await api.query.clockIn.lotteryMetadataStore(adInfo.nftId);
      const { awardPerShare } = lotteryRes.toHuman();

      ad.type = AD_DATA_TYPE.LOTTERY;
      ad.adClaimed = !claimable;
      ad.rewardAmount = deleteComma(awardPerShare);

      return {
        success: true,
        data: ad
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        data: null,
        adInfo: ad
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
          const { nftId, contractAddress, tokenId } = request.adInfo;
          const key = `${nftId}${contractAddress}${tokenId}`;

          if (!fetchAdPromisesMap.has(key)) {
            fetchAdPromisesMap.set(key, fetchAd(request.adInfo, res?.didHex));
          }

          fetchAdPromisesMap.get(key).then(ad => {
            sendResponse({
              ad
            });
          })
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
        fetchAdPromisesMap.clear();
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
  function (tabId, changeInfo, tab) {
    if (changeInfo.url && changeInfo.url.startsWith('https://twitter.com')) {
      fetchAdPromisesMap.clear();
      chrome.tabs.sendMessage(tabId, {
        method: 'urlChange'
      });
    }
  }
);
