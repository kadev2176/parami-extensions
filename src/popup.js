'use strict';

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

    networkStorage.get(network => {
        if (network?.chainId === 4) {
            checkbox.setAttribute('checked', true);
        }
    });
})();