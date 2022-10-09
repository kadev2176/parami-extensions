import React, { useEffect } from 'react';
import './AdIcon.css';
import { Popover, Card, Image } from 'antd';
import { useState } from 'react';
import Advertisement from '../Advertisement/Advertisement';

export interface AdIconProps {
    href: string;
    ad?: any;
    avatarSrc?: string;
}

const defaultAdIcon = chrome.runtime.getURL('icons/logo-round-core.svg');

function AdIcon({ href, ad, avatarSrc }: AdIconProps) {

    const [userDid, setUserDid] = useState<string>(ad.userDid);

    const content = (
        ad ? <Advertisement ad={ad} avatarSrc={avatarSrc} userDid={userDid}></Advertisement> : null
    );

    if (ad?.adClaimed || ad?.insufficientBalance) {
        return null;
    }

    useEffect(() => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.method === 'didChange') {
                setUserDid(request.didHex);
            }
        })
    }, []);

    return <div className='pfp-link-badge-container'>
        <Popover content={content} placement="rightTop" className='ad-popover'>
            <a className='pfp-link-badge' target="_blank"
                href={href}
            >
                <img referrerPolicy='no-referrer' src={ad?.icon ?? defaultAdIcon}></img>
            </a>
        </Popover>

        {!!ad && <div className='priceInfo'>
            <span className='price'>~37mAD3</span>
            <span className='priceChange'>+120%</span>
        </div>}
    </div>;
};

export default AdIcon;
