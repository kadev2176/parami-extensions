import { Button, Card, Tooltip } from 'antd';
import React, { useCallback, useState } from 'react';
import './Advertisement.css';
import { MoneyCollectOutlined, WalletOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ParamiScoreTag from '../ParamiScoreTag/ParamiScoreTag';
import ParamiScore from '../ParamiScore/ParamiScore';
import config from '../../config';

const Advertisement: React.FC<{
	ad: any;
}> = ({ ad }) => {

	const [showInstructions, setShowInstructions] = useState<boolean>(false);
	const [closePopoverTimeout, setClosePopoverTimeout] = useState<any>();

	const tags = (ad?.instructions ?? []).map((instruction: any) => instruction.tag).filter(Boolean);

	const openClaimWindow = () => {
		window.open(`${config.paramiWallet}/claim/${ad.adId}/${ad.nftId}`, 'ParamiClaim', 'popup,width=400,height=600');
	}

	const gotoWalletButton = (btnText: string) => {
		return <Button
			block
			type='primary'
			shape='round'
			size='large'
			className='actionBtn'
			icon={<WalletOutlined />}
			onClick={() => {
				window.open(config.paramiWallet);
			}}
		>
			{btnText}
		</Button>
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
					<span>📢 This hyperlink NFT is reserved. The owner of it has not claimed it</span>
					<a className='claimLink' href='https://app.parami.io/' target='_blank'>I am the owner</a>
				</div>
				<div className='sponsorInfo'>
					{ad?.icon && <img referrerPolicy='no-referrer' className='sponsorIcon' src={ad?.icon}></img>}
					<span className='sponsorText'>Parami is sponsoring this hyperlink NFT</span>
					<div className='bidBtn' onClick={() => window.open('https://app.parami.io/dashboard')}>Bid it</div>
				</div>
				<img
					src={ad?.media}
					referrerPolicy='no-referrer'
					className='adMediaImg'
				/>
				<div className='adDescription'>
					{/* todo: ad description */}
					<span className='descriptionText'>{ad?.description ?? 'We are Gem_DAO, get gem with me everyday ❤️'}</span>
					{tags?.length > 0 && <span className='tags'>
						{tags.map((tag: string, index: number) => <span className='tag' key={index}>#{tag}</span>)}
					</span>}
				</div>
				<div className='claimSection'>
					<div className='infoText'>According to you DID Reputation Score you are rewarded:</div>
					<div className='rewardRow'>
						<div className='rewardInfo'>
							<img referrerPolicy='no-referrer' className='kolIcon' src={ad?.icon}></img>
							<span className='rewardAmount'>
								300 Kaikang NFT Power
							</span>
						</div>
						<div className='buttons'>
							<div className='claimBtn btn' onClick={() => openClaimWindow()}>Claim Now</div>
							<div className='instructionsBtn btn' onMouseEnter={openInstructionPopover} onMouseLeave={delayCloseInstructionPopover}>Get More Score</div>
						</div>
					</div>
				</div>
				{showInstructions && <div className='instructions' onMouseEnter={openInstructionPopover} onMouseLeave={delayCloseInstructionPopover}>
					<div className='popoverArrow'></div>
					<div className='popoverContent'>
						{ad?.instructions?.length > 0 && <>
							{ad.instructions.map((instruction: any, index: number) => {
								return (
									<div className='instruction' onClick={() => {
										!!instruction.link && window.open(`https://weekly.parami.io?redirect=${instruction.link}&nftId=${ad.nftId}&did=${ad.userDid}&ad=${ad.adId}&tag=${instruction.tag}&score=${instruction.score}`);
									}}>
										<span className='instructionText'>{instruction.text}</span>
										<span className='instructionTag'>#{instruction.tag}</span>
										<span className='instructionScore'>+{instruction.score}</span>
									</div>
								);
							})}
						</>}
					</div>
				</div>}
			</div>
		</>
	)
};

export default Advertisement;
