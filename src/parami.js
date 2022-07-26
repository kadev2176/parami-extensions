'use strict';
import bs58 from 'bs58';
import { fromHexString } from './utilities';

(() => {
  const didHex = localStorage.getItem('parami:wallet:did');

  if (didHex) {
    const didBs58 = bs58.encode(fromHexString(didHex));

    chrome.storage.sync.set(
      {
        did: `did:ad3:${didBs58}`,
      },
    );
  } else {
    chrome.storage.sync.set(
      {
        did: '',
      },
    );
  }
})();