import React, { useCallback, useEffect, useState } from 'react';
import './Advertisement.css';
import config from '../../config';
import { formatBalance } from '@polkadot/util';
import { message, Tooltip } from 'antd';

const bubble = chrome.runtime.getURL('icons/bubble.svg');

const Advertisement: React.FC<{
	ad: any;
	claimed: boolean;
	avatarSrc?: string;
	userDid?: string;
}> = ({ ad, avatarSrc, userDid, claimed }) => {
	const [rewardAmount, setRewardAmount] = useState<string>('');
	const [claimText, setClaimText] = useState<string>('Not interested, claim it now');

	const tags = (ad?.instructions ?? []).map((instruction: any) => instruction.tag).filter(Boolean);

	useEffect(() => {
		chrome.runtime.sendMessage({ method: 'calReward', adId: ad.adId, nftId: ad.nftId, did: userDid }, (response) => {
			const { rewardAmount } = response ?? {};

			const amountWithUnit = formatBalance(rewardAmount, { withUnit: false, decimals: 18 });
			const [price, unit] = amountWithUnit.split(' ');
			const amount = `${parseFloat(price).toFixed(2)}${unit ? ` ${unit}` : ''}`;
			setRewardAmount(amount);
		});
	}, [userDid])

	const openClaimWindow = () => {
		window.open(`${config.paramiWallet}/claim/${ad.adId}/${ad.nftId}`, 'Parami Claim', 'popup,width=400,height=600');
	}

	const openCreateAccountWindow = () => {
		window.open(`${config.paramiWallet}/create/popup`, 'Parami Create DID', 'popup,width=400,height=600');
	}

	const sponsorName = ad?.sponsorName ?? 'Parami';
	const abbreviation = sponsorName.startsWith('did:') ? `did:...${sponsorName.slice(-4)}` : null;

	return (
		<>
			<div className='advertisementContainer'>
				{!ad?.adId && <>
					<div className='ownerInfo'>
						<span>📢 This hNFT is reserved.</span>
						<a className='claimLink' href={`${config.paramiWallet}/claimHnft/${ad.nftId}`} target='_blank'>I am the owner</a>
					</div>
					<div className='bidSection'>
						<img referrerPolicy='no-referrer' className='kolIcon' src={avatarSrc}></img>
						<a href={`${config.paramiWallet}/bid/${ad.nftId}`} target="_blank" className='sponsorLink'>Sponsor this HNFT</a>
					</div>
				</>}

				{!!ad?.adId && <>
					<div className='ownerInfo'>
						<span>📢 This hNFT is reserved.</span>
						<a className='claimLink' href={`${config.paramiWallet}/claimHnft/${ad.nftId}`} target='_blank'>I am the owner</a>
					</div>
					<div className='sponsorInfo'>
						{ad?.icon && <img referrerPolicy='no-referrer' className='sponsorIcon' src={ad?.icon}></img>}
						<span className='sponsorText'>
							{!!abbreviation && <>
								<Tooltip title={sponsorName}>
									<span className='sponsorName'>
										{abbreviation}
									</span>
								</Tooltip>
							</>}
							{!abbreviation && <>
								<span className='sponsorName'>
									{sponsorName}
								</span>
							</>}
							<span>is sponsoring this hNFT. </span>
							<a className='bidLink' href={`${config.paramiWallet}/bid/${ad.nftId}`} target="_blank">I want to bid</a>
						</span>
					</div>
					<div className='adSection'>
						<img className='adBubble' src={bubble}></img>
						<div className='adContent'>
							<div className='adDescription'>
								<span className='descriptionText'>{ad?.content ?? ad?.description ?? 'View Ads. Get Paid.'}</span>
								{tags?.length > 0 && <span className='tags'>
									{tags.map((tag: string, index: number) => <span className='tag' key={index}>#{tag}</span>)}
								</span>}
							</div>
							<img
								src={ad?.media}
								referrerPolicy='no-referrer'
								className='adMediaImg'
							/>
						</div>
					</div>

					<div className='divider'></div>

					{!userDid && <div className='noDidSection'>
						<div className='createDidBtn actionBtn' onClick={() => openCreateAccountWindow()}>Create DID and claim!</div>
					</div>}

					{!!userDid && <div className='claimSection'>
						<div className='infoText'>{
							!claimed ? 'Due to your Preference Score you are rewarded:' : 'You have already claimed:'
						}</div>

						<div className='rewardRow'>
							<div className='rewardInfo'>
								<img referrerPolicy='no-referrer' className='kolIcon' src={avatarSrc}></img>
								<span className='rewardAmount'>
									<span className='rewardNumber'>{rewardAmount ?? '300.00'}</span>
									<span className='rewardToken'>{ad?.assetName} NFT Power</span>
								</span>
							</div>
						</div>

						{claimed && <>
							<div className='btnContainer'>
								<div className='actionBtnBig left' onClick={async () => {
									if (navigator.clipboard) {
										navigator.clipboard.writeText('Hundreds of Celebrity NFT Powers awaits you to FREE claim! Install and GemHunt on Twitter HERE ❤️ https://chrome.google.com/webstore/detail/parami-hyperlink-nft-exte/gilmlbeecofjmogfkaocnjmbiblmifad');
										message.success('Copied');
									}
								}}>Share</div>
								<div className='actionBtnBig right' onClick={() => window.open(`${config.paramiWallet}/swap/${ad.nftId}`)}>Support More</div>
							</div>
						</>}

						{!claimed && <>
							{ad?.instructions?.length > 0 && <>
								<div className='instructionSection'>
									<div className='instructionTitle'>Follow the tips below if you are interested</div>
									{ad.instructions.map((instruction: any, index: number) => {
										return (
											<div className='instruction' onClick={() => {
												!!instruction.link && window.open(`https://weekly.parami.io?redirect=${instruction.link}&nftId=${ad.nftId}&did=${userDid}&ad=${ad.adId}&tag=${instruction.tag}&score=${instruction.score}`);
												setClaimText('Claim');
											}} key={index}>
												<span className='instructionText'>{instruction.text}</span>
												<span className='instructionTag'>#{instruction.tag}</span>
												<span className='instructionScore'>+{instruction.score}</span>
											</div>
										);
									})}
								</div>
							</>}

							<div className='btnContainer'>
								<div className='actionBtnBig' onClick={() => openClaimWindow()}>{claimText}</div>
							</div>
						</>}
					</div>}
				</>}
			</div>
		</>
	)
};

export default Advertisement;
