'use strict';

import { NETWORK_TEST, NETWORK_MAINNET } from './models';
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

    const checkbox = document.querySelector('#networkCheckbox');

    networkStorage.get(network => {
        if (network?.chainId === 4) {
            checkbox.setAttribute('checked', true);
        }
    });

    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            networkStorage.set(NETWORK_TEST)
        } else {
            networkStorage.set(NETWORK_MAINNET)
        }
    });
})();