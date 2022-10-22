import React, { useEffect } from 'react';
import './AdIcon.css';
import { Popover, Card } from 'antd';
import { useState } from 'react';
import Advertisement from '../Advertisement/Advertisement';
import { formatBalance } from '@polkadot/util';

export interface AdIconProps {
    href: string;
    ad: { success: boolean; data: any; nftId?: string };
    avatarSrc?: string;
}

const preload = (src: string) => {
    if (src) {
        const image = new Image();
        image.referrerPolicy = 'no-referrer';
        image.src = src;
    }
}

const defaultAdIcon = chrome.runtime.getURL('icons/logo-round-core.svg');

const MAX_RETRY_COUNT = 3;

function AdIcon({ href, ad, avatarSrc }: AdIconProps) {
    // const [tokenPrice, setTokenPrice] = useState<string>('');
    const [adResult, setAdResult] = useState<any>(ad);
    const [adData, setAdData] = useState<any>();
    const [adClaimed, setAdClaimed] = useState<boolean>();
    const [userDid, setUserDid] = useState<string>();
    const [retryCounter, setRetryCounter] = useState<number>(0);

    const retry = (adInfo: { nftId?: string; contractAddress?: string; tokenId?: string }) => {
        if (retryCounter < MAX_RETRY_COUNT) {
            setRetryCounter(retryCounter + 1);
            // retry and then set adData
            chrome.runtime.sendMessage({ method: 'fetchAd', adInfo }, (response) => {
                const { ad } = response;
                setAdResult(ad);
            });
        }
    }

    useEffect(() => {
        if (adResult.success) {
            setAdData(adResult.data);
        } else {
            retry(adResult.adInfo)
        }
    }, [adResult])

    const content = (
        adData ? <Advertisement ad={adData} avatarSrc={avatarSrc} userDid={userDid} ></Advertisement> : null
    );

    if (adClaimed) {
        return null;
    }

    useEffect(() => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.method === 'didChange') {
                setUserDid(request.didHex);
            }
            return true;
        });
    }, []);

    useEffect(() => {
        window.addEventListener('message', (event) => {
            if (event.origin !== 'https://app.parami.io') {
                return;
            }
            if (event.data && event.data.startsWith('AdClaimed:')) {
                const adId = event.data.slice(10);
                if (adId === adData?.adId) {
                    setAdClaimed(true);
                }
            }
        });

        setAdClaimed(adData?.adClaimed);
        setUserDid(adData?.userDid);
        preload(adData?.icon);
        preload(adData?.media);
    }, [adData]);

    // useEffect(() => {
    //     const priceWithUnit = formatBalance(ad?.tokenPrice ?? '123400000000000000000', { withUnit: 'AD3', decimals: 18 });
    //     const [price, unit] = priceWithUnit.split(' ');
    //     const tokenPrice = `${parseFloat(price).toFixed(1)} ${unit}`;
    //     setTokenPrice(tokenPrice);
    // }, [ad])

    return <div className='pfp-link-badge-container'>
        {!content && <>
            <a className='pfp-link-badge pure-link' target="_blank"
                href={href}
            >
                <i className="fa-solid fa-square-arrow-up-right"></i>
            </a>
        </>}

        {content && <>
            <Popover content={content} placement="rightTop" className='ad-popover'>
                <span className={`pfp-link-badge ${adData?.adId ? '' : 'default-icon'}`}>
                    {adData?.adId && <img referrerPolicy='no-referrer' src={adData?.icon ?? defaultAdIcon}></img>}
                    {!adData?.adId && <i className="fa-solid fa-heart"></i>}
                </span>
            </Popover>
        </>}


        {/* {!!tokenPrice && <div className='priceInfo'>
            <span className='price'>{tokenPrice}</span>
            <span className='priceChange'>+120%</span>
        </div>} */}
    </div>;
};

export default AdIcon;
