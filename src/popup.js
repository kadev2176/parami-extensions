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

    const accountInfoNode = document.querySelector('#accountInfo');
    const jumpLinkContainer = document.querySelector('#jumpLinkContainer');
    chrome.storage.sync.get(['did'], res => {
        if (res.did) {
            const jumpLink = document.createElement('a');
            jumpLink.setAttribute('class', 'jumpLink');
            jumpLink.setAttribute('href', 'https://app.parami.io');
            jumpLink.setAttribute('target', '_blank');
            jumpLink.innerHTML = 'My Wallet';
            jumpLinkContainer.appendChild(jumpLink);

            const accountInfo = document.createElement('div');
            accountInfo.setAttribute('class', 'accountInfo');
            accountInfo.innerHTML = `${res.did}`;
            accountInfoNode.appendChild(accountInfo);
        } else {
            const link = document.createElement('a');
            link.innerHTML = 'create one';
            link.setAttribute('href', 'https://app.parami.io');
            link.setAttribute('target', '_blank');
            const jumpLink = document.createElement('span');
            jumpLink.setAttribute('class', 'jumpLinkNoId');
            jumpLink.innerHTML = 'Identity Not Found. Please ';
            jumpLink.appendChild(link);
            jumpLinkContainer.appendChild(jumpLink);
            
            accountInfoNode.innerHTML = '';
        }
    })
})();