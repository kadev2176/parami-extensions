import React, { useCallback, useEffect, useState } from 'react';
import './Advertisement.css';
import config from '../../config';
import { formatBalance } from '@polkadot/util';

const Advertisement: React.FC<{
	ad: any;
	avatarSrc?: string;
	userDid?: string;
}> = ({ ad, avatarSrc, userDid }) => {

	const [showInstructions, setShowInstructions] = useState<boolean>(false);
	const [closePopoverTimeout, setClosePopoverTimeout] = useState<any>();
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

	const openInstructionPopover = useCallback(() => {
		// clear timeout
		if (closePopoverTimeout) {
			clearTimeout(closePopoverTimeout);
			setClosePopoverTimeout(null);
		}
		// open popover
		setShowInstructions(true);
	}, [closePopoverTimeout]);

	const delayCloseInstructionPopover = () => {
		const timeout = setTimeout(() => {
			setShowInstructions(false);
		}, 200);
		setClosePopoverTimeout(timeout);
	}

	return (
		<>
			<div className='advertisementContainer'>
				<div className='ownerInfo'>
					<span>📢 This hNFT is reserved.</span>
					<a className='claimLink' href={`${config.paramiWallet}/claimHnft/${ad.nftId}`} target='_blank'>I am the owner</a>
				</div>
				<div className='sponsorInfo'>
					{ad?.icon && <img referrerPolicy='no-referrer' className='sponsorIcon' src={ad?.icon}></img>}
					{/* todo: temporarily slice sponsor name. change to new ui later */}
					<span className='sponsorText'><span className='sponsorName'>{`${(ad?.sponsorName ?? 'Parami').slice(0, 30)}`}</span>is sponsoring this hNFT</span>
					<div className='bidBtn' onClick={() => window.open(`${config.paramiWallet}/bid/${ad.nftId}`)}>BID</div>
				</div>
				<img
					src={ad?.media}
					referrerPolicy='no-referrer'
					className='adMediaImg'
				/>
				<div className='adDescription'>
					<span className='descriptionText'>{ad?.description ?? 'View Ads. Get Paid.'}</span>
					{tags?.length > 0 && <span className='tags'>
						{tags.map((tag: string, index: number) => <span className='tag' key={index}>#{tag}</span>)}
					</span>}
				</div>

				{!userDid && <div className='noDidSection'>
					<div className='createDidBtn actionBtn' onClick={() => openCreateAccountWindow()}>Create DID and claim!</div>
				</div>}

				{!!userDid && <div className='claimSection'>
					<div className='infoText'>Due to your Preference Score you are rewarded:</div>
					<div className='rewardRow'>
						<div className='rewardInfo'>
							<img referrerPolicy='no-referrer' className='kolIcon' src={avatarSrc}></img>
							<span className='rewardAmount'>
								<span className='rewardNumber'>{rewardAmount ?? '300.00'}</span>
								<span className='rewardToken'>{ad?.assetName} NFT Power</span>
							</span>
						</div>
						<div className='buttons'>
							<>
								<div className='claimBtn actionBtn' onMouseEnter={openInstructionPopover} onMouseLeave={delayCloseInstructionPopover}>Claim</div>
								<div className='instructionsBtn actionBtn' onClick={() => {
									window.open(`${config.paramiWallet}/swap/${ad.nftId}`);
								}}>Buy more</div>
							</>
						</div>
					</div>
				</div>}

				{showInstructions && <div className='instructions' onMouseEnter={openInstructionPopover} onMouseLeave={delayCloseInstructionPopover}>
					<div className='popoverArrow'></div>
					<div className='popoverContent'>
						<div className='instructionTitle'>Follow the tips below if you are interested</div>
						{ad?.instructions?.length > 0 && <>
							{ad.instructions.map((instruction: any, index: number) => {
								return (
									<div className='instruction' onClick={() => {
										!!instruction.link && window.open(`https://weekly.parami.io?redirect=${instruction.link}&nftId=${ad.nftId}&did=${userDid}&ad=${ad.adId}&tag=${instruction.tag}&score=${instruction.score}`);
										setClaimText('Claim');
									}}>
										<span className='instructionText'>{instruction.text}</span>
										<span className='instructionTag'>#{instruction.tag}</span>
										<span className='instructionScore'>+{instruction.score}</span>
									</div>
								);
							})}
						</>}
						<div className='instructionClaimBtnContainer'>
							<div className='instructionClaimBtn actionBtn' onClick={() => openClaimWindow()}>{claimText}</div>
						</div>
					</div>
				</div>}
			</div>
		</>
	)
};

export default Advertisement;
