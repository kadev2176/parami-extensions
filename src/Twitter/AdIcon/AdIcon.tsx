import React from 'react';
import './AdIcon.css';
import { Popover, Card, Image } from 'antd';
import { useState } from 'react';
import Advertisement from '../Advertisement/Advertisement';

export interface AdIconProps {
    href: string;
    ad?: any;
}

const defaultAdIcon = chrome.runtime.getURL('icons/logo-round-core.svg');

function AdIcon({ href, ad }: AdIconProps) {

    const content = (
        ad ? <Advertisement ad={ad}></Advertisement> : null
    );

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
