import React, { useEffect, useState } from 'react';
import './Advertisement.css';
import config from '../../config';
import { message, Spin, Tooltip } from 'antd';
import { POST_MESSAGE_PREFIX } from '../../models';
import { LoadingOutlined } from '@ant-design/icons';
import { parseBalance } from '../util';
import Confetti from '../Confetti/Confetti';

const Advertisement: React.FC<{
	ad: any;
	claimed: boolean;
	avatarSrc?: string;
	userDid?: string;
	clickAction: () => void;
	onClose: () => void;
	showCloseIcon: boolean;
}> = ({ ad, avatarSrc, userDid, claimed, clickAction, onClose, showCloseIcon = false }) => {
	const [rewardAmount, setRewardAmount] = useState<string>('');
	const [priceInfo, setPriceInfo] = useState<{ price: string, change: number }>();
	const [claiming, setClaiming] = useState<boolean>(false);

	const tags = (ad?.instructions ?? []).map((instruction: any) => instruction.tag).filter(Boolean);
	const justClaimed = showCloseIcon && claimed;

	useEffect(() => {
		if (!ad?.id) {
			const price = `${parseBalance(ad.tokenPrice)}AD3`;
			let change
			if (ad.preTokenPrice) {
				change = Number((BigInt(ad.tokenPrice) - BigInt(ad.preTokenPrice)) * BigInt(10000) / BigInt(ad.preTokenPrice)) / 100;
			}
			setPriceInfo({
				price,
				change: change ?? 0
			})
		}
	}, [ad])

	useEffect(() => {
		chrome.runtime.sendMessage({ method: 'calReward', adId: ad.adId, nftId: ad.nftId, did: userDid }, (response) => {
			const { rewardAmount } = response ?? {};
			setRewardAmount(parseBalance(rewardAmount));
		});
	}, [userDid])

	const openClaimWindow = (redirect?: boolean) => {
		window.open(`${config.paramiWallet}/adClaim/${ad.adId}/${ad.nftId}${redirect ? '?redirect=true' : ''}`, 'Parami Claim', 'popup,width=400,height=600');
	}

	const openCreateAccountWindow = () => {
		window.open(`${config.paramiWallet}/create/popup`, 'Parami Create DID', 'popup,width=400,height=600');
	}

	const claim = async (redirect: boolean) => {
		setClaiming(true);
		try {
			const instruction = ad.instructions[0];
			if (redirect && instruction) {
				window.open(decodeURIComponent(instruction.link));
			}

			const body = {
				adId: ad.adId,
				nftId: ad.nftId,
				did: userDid,
				score: {
					tag: instruction?.tag,
					score: redirect ? instruction?.score : -5
				}
			};

			const res = await fetch(`https://weekly.parami.io/api/pay`, {
				"headers": {
					"content-type": "application/json",
				},
				"body": JSON.stringify(body),
				"method": "POST",
			});

			setClaiming(false);

			if (res.ok) {
				window.postMessage(`${POST_MESSAGE_PREFIX.AD_CLAIMED}:${ad.adId}`, '*');
			} else {
				message.error({
					content: 'Network Error. Please try again later.'
				})
			}
		} catch (e) {
			console.log('HNFT extension claiming error', e);
			setClaiming(false);
			message.error({
				content: 'Network Error. Please try again later.'
			})
		}

	}

	const sponsorName = ad?.sponsorName ?? 'Parami';
	const abbreviation = sponsorName.startsWith('did:') ? `did:...${sponsorName.slice(-4)}` : null;

	const hNFT = (ad?.contractAddress && ad?.tokenId ? <a href={`https://opensea.io/assets/ethereum/${ad.contractAddress}/${ad.tokenId}`} target="_blank">hNFT</a> : 'hNFT');

	const claimInfoMark = (<>
		<div className='ownerInfo'>
			<Tooltip title={<>
				<span>📢 This {hNFT} is reserved.</span>
				<a className='claimLink' href={`${config.paramiWallet}/claimHnft/${ad.nftId}`} target='_blank'>I am the owner</a>
			</>}>
				<span className='claimInfoMark'><i className="fa-solid fa-circle-exclamation"></i></span>
			</Tooltip>

			{showCloseIcon && <>
				<span className='closeIcon' onClick={() => onClose()}>
					<i className="fa-solid fa-xmark"></i>
				</span>
			</>}
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
							{priceInfo && <>
								<div className='tokenPrice'>
									<div className='price'>~{priceInfo.price}</div>
									{priceInfo.change === 0 && <>
										<div className='change flat'>
											<span className='priceChangeIcon'>
												<i className="fa-solid fa-caret-up"></i>
											</span>
											<span className='priceChangeText'>
												+0.00%
											</span>
										</div>
									</>}
									{priceInfo.change > 0 && <>
										<div className='change up'>
											<span className='priceChangeIcon'>
												<i className="fa-solid fa-caret-up"></i>
											</span>
											<span className='priceChangeText'>
												+{priceInfo.change.toFixed(2)}%
											</span>
										</div>
									</>}
									{priceInfo.change < 0 && <>
										<div className='change down'>
											<span className='priceChangeIcon'>
												<i className="fa-solid fa-caret-down"></i>
											</span>
											<span className='priceChangeText'>
												{priceInfo.change.toFixed(2)}%
											</span>
										</div>
									</>}
								</div>
							</>}

						</div>
						<div className='bidSectionInfo'>{`${ad?.assetName} `}{hNFT}{` is available to be hyperlinked...`}</div>
						<div className='bidSectionBtnContainer'>
							<div className='actionBtn left' onClick={async () => {
								window.open(`${config.paramiWallet}/bid/${ad.nftId}`);
							}}>Place an Ad</div>
							<div className='actionBtn right' onClick={() => window.open(`${config.paramiWallet}/swap/${ad.nftId}`)}>Buy more</div>
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
							<span>is sponsoring this {hNFT}. </span>
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
								<Spin spinning={claiming} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} tip="Claiming...">
									<div className='posterSection'>
										<img
											src={ad?.media}
											referrerPolicy='no-referrer'
											className='adMediaImg'
										/>

										<div className={`mask ${justClaimed ? 'pinned' : ''}`}>
											<div className={`confettiContainer`}>
												<Confetti />
											</div>

											<div className='infoText'>
												{!claimed ? 'You will be rewarded' : 'You have claimed'}
												<Tooltip title="Rewards are calculated based on your DID preference score">
													<span className='rewardInfoMark'><i className="fa-solid fa-circle-exclamation"></i></span>
												</Tooltip>
											</div>

											<div className={`rewardRow ${claimed ? 'claimed' : ''}`}>
												<div className={`rewardInfo ${claimed ? 'gotoWallet' : ''}`} onClick={() => {
													if (claimed) {
														window.open(config.paramiWallet);
													}
												}}>
													<img referrerPolicy='no-referrer' className='kolIcon' src={avatarSrc}></img>
													<span className='rewardAmount'>
														<span className='rewardNumber'>{rewardAmount ?? '300.00'}</span>
														<span className='rewardToken'>{ad?.assetName} NFT Power</span>
													</span>
												</div>

												{claimed && <>
													<div className='claimedIcon'>
														<i className="fa-solid fa-circle-check"></i>
													</div>
												</>}
											</div>

											<div className='btnContainer'>
												{!userDid && <>
													<div className='actionBtn' onClick={() => openCreateAccountWindow()}>Create DID and claim!</div>
												</>}

												{!!userDid && <>
													{claimed && <>
														<div className='actionBtn left' onClick={() => window.open(`${config.paramiWallet}/swap/${ad.nftId}`)}>Buy more</div>
														<div className='actionBtn right' onClick={async () => {
															await navigator.clipboard.writeText(`${config.paramiWallet}/ad/?nftId=${ad.nftId}&referrer=${userDid}`);
															message.success({
																content: 'Referral link copied!',
																style: {
																	marginTop: '20vh',
																	zIndex: 1050
																},
															});
														}}>Share & Earn more</div>
													</>}

													{!claimed && <>
														<>
															<div className='actionBtn left' onClick={() => {
																clickAction();
																claim(false);
															}}>Claim</div>
															<div className='actionBtn right' onClick={() => {
																clickAction();
																claim(true);
															}}>Claim & Learn more</div>
														</>
													</>}
												</>}
											</div>
										</div>



										{!(showCloseIcon && claimed) && <>
											<div className='hoverHint'>
												<div className='hintIcon'>
													<i className="fa-solid fa-arrow-up-right-from-square"></i>
												</div>
											</div>
										</>}
									</div>
								</Spin>

							</>}
						</div>
					</div>
				</>}
			</div>
		</>
	)
};

export default Advertisement;
