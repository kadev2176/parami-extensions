'use strict';

import { NETWORK_STAGE, NETWORK_TEST } from './models';
import './popup.css';

(() => {
  const networkStorage = {
      get: cb => {
          chrome.storage.sync.get(['network'], result => {
              cb(result.network);
          });
      },
      set: (value) => {
          chrome.storage.sync.set(
              {
                  network: value,
              },
          );
      },
  };

  document.querySelector('#networkCheckbox').addEventListener('change', (e) => {
      if (e.target.checked) {
          networkStorage.set(NETWORK_STAGE)
      } else {
          networkStorage.set(NETWORK_TEST)
      }
  });

  networkStorage.get(network => {
      if (typeof network === 'undefined') {
          networkStorage.set(NETWORK_TEST);
      } else {
          networkStorage.set(NETWORK_STAGE);
      }
  });
})();