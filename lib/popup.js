'use strict';

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
            chrome.storage.sync.set(
                {
                    network: 'dev',
                },
            );
            networkStorage.set('dev');
            window.paramiServer = {
                graph: 'https://staging.parami.io/graph/',
                rpc: 'https://staging.parami.io/',
            };
        } else {
            networkStorage.set('test');
            window.paramiServer = {
                graph: 'https://graph.parami.io/',
                rpc: 'https://app.parami.io/',
            };
        }
    });

    networkStorage.get(network => {
        if (typeof network === 'undefined') {
            networkStorage.set('test');
        } else {
            networkStorage.set(network);
        }
    });
})();
