import React, { useCallback, useEffect, useState } from 'react';
import './Advertisement.css';
import config from '../../config';
import { formatBalance } from '@polkadot/util';
import { Tooltip } from 'antd';

const Advertisement: React.FC<{
	ad: any;
	claimed: boolean;
	avatarSrc?: string;
	userDid?: string;
}> = ({ ad, avatarSrc, userDid, claimed }) => {
	const [rewardAmount, setRewardAmount] = useState<string>('');
	const [instructionClicked, setInstructionClicked] = useState<boolean>(false);

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

	const claimInfoMark = (<>
		<div className='ownerInfo'>
			<Tooltip title={<>
				<span>📢 This hNFT is reserved.</span>
				<a className='claimLink' href={`${config.paramiWallet}/claimHnft/${ad.nftId}`} target='_blank'>I am the owner</a>
			</>}>
				<span className='claimInfoMark'><i className="fa-solid fa-circle-exclamation"></i></span>
			</Tooltip>
		</div>
	</>)

	return (
		<>
			<div className='advertisementContainer'>
				{!ad?.adId && <>
					{claimInfoMark}
					<div className='bidSection'>
						<div className='daoInfo'>
							<img referrerPolicy='no-referrer' className='kolIcon' src={avatarSrc}></img>
							<div className='daoInfoText'>
								<div className='daoToken'>
									{ad?.assetName} NFT Power
								</div>
								<div className='daoHolderNumber'>
									{ad?.numHolders} holders
								</div>
							</div>
						</div>
						<div className='bidSectionInfo'>{`There is nothing linked to ${ad?.assetName} NFT...`}</div>
						<div className='bidSectionBtnContainer'>
							<div className='actionBtn left' onClick={async () => {
								window.open(`${config.paramiWallet}/bid/${ad.nftId}`);
							}}>Place an Ad</div>
							<div className='actionBtn right' onClick={() => window.open(`${config.paramiWallet}/swap/${ad.nftId}`)}>Sponsor more</div>
						</div>
					</div>
				</>}

				{!!ad?.adId && <>
					{claimInfoMark}
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
							<a className='bidLink' href={`${config.paramiWallet}/bid/${ad.nftId}`} target="_blank">Bid on this ad space</a>
						</span>
					</div>
					<div className='adSection'>
						<div className='adSectionArrow front'></div>
						<div className='adSectionArrow back'></div>
						<div className='adContent'>
							<div className='adDescription'>
								<span className='descriptionText'>{ad?.content ?? ad?.description ?? 'View Ads. Get Paid.'}</span>
								{tags?.length > 0 && <span className='tags'>
									{tags.map((tag: string, index: number) => <span className='tag' key={index}>#{tag}</span>)}
								</span>}
							</div>
							{ad?.media && <>
								<div className='posterSection'>
									<img
										src={ad?.media}
										referrerPolicy='no-referrer'
										className='adMediaImg'
									/>

									<div className='mask'>
										<div className='infoText'>{
											!claimed ? 'You will be rewarded:' : 'You have already claimed:'
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

										<div className='btnContainer'>
											{!userDid && <>
												<div className='actionBtn' onClick={() => openCreateAccountWindow()}>Create DID and claim!</div>
											</>}

											{!!userDid && <>
												{claimed && <>
													<div className='actionBtn left' onClick={async () => {
														window.open(`https://twitter.com/intent/tweet?text=Hundreds of Celebrity NFT Powers awaits you to FREE claim! Install and GemHunt on Twitter HERE ❤️ @ParamiProtocol&url=https://chrome.google.com/webstore/detail/parami-hyperlink-nft-exte/gilmlbeecofjmogfkaocnjmbiblmifad`);
													}}>Share</div>
													<div className='actionBtn right' onClick={() => window.open(`${config.paramiWallet}/swap/${ad.nftId}`)}>Sponsor more</div>
												</>}

												{!claimed && <>
													{instructionClicked && <>
														<div className='actionBtn' onClick={() => openClaimWindow()}>Claim</div>
													</>}
													{!instructionClicked && <>
														<div className='actionBtn left' onClick={() => openClaimWindow()}>Claim</div>
														<div className='actionBtn right' onClick={() => {
															const instruction = ad.instructions[0];
															!!instruction.link && window.open(`https://weekly.parami.io?redirect=${instruction.link}&nftId=${ad.nftId}&did=${userDid}&ad=${ad.adId}&tag=${instruction.tag}&score=${instruction.score}`);
															setInstructionClicked(true);
														}}>Claim & Learn more</div>
													</>}
												</>}
											</>}
										</div>
									</div>
								</div>
							</>}
						</div>
					</div>
				</>}
			</div>
		</>
	)
};

export default Advertisement;
