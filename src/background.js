'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

import { NETWORK_MAINNET } from './models';

chrome.storage.sync.set(
  {
    network: NETWORK_MAINNET,
  },
);
