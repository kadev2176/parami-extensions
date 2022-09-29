import { Button, Card, Tooltip } from 'antd';
import React, { useState } from 'react';
import './Advertisement.css';
import { MoneyCollectOutlined, WalletOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import ParamiScoreTag from '../ParamiScoreTag/ParamiScoreTag';
import ParamiScore from '../ParamiScore/ParamiScore';
import config from '../../config';

const Advertisement: React.FC<{
	ad: any;
}> = ({ ad }) => {

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

	return (
		<>
			<div className='advertisementContainer'>
				<Card
					className={`adCard`}
					style={{ border: 'none' }}
					bodyStyle={{
						padding: 0,
						width: '100%',
					}}
				>
					<div className='advertisement'>
						<div className='adMedia'>
							<img
								src={ad?.media}
								referrerPolicy='no-referrer'
								className='adMediaImg'
								onLoad={() => null}
							/>
						</div>
						{ad?.instructions && ad?.instructions?.length > 0 && <>
							<div className='instructions'>
								<div className='instructionTitle'>
									Follow the instructions to improve your DID reputation score
									<Tooltip
										placement="top"
										title={'Your DID reputation score is a number attached to your DID that can be increased by performing tasks. The higher your DID reputation score, the higher the reward.'}
									>
										<ExclamationCircleOutlined style={{ marginLeft: '5px' }} />
									</Tooltip>
								</div>
								{ad.instructions.map((instruction: any, index: any) => {
									return (
										<div className={`instruction ${instruction.link ? 'withLink' : ''}`} key={index}
											onClick={() => {
												!!instruction.link && window.open(`https://weekly.parami.io?redirect=${instruction.link}&nftId=${ad.nftId}&did=${ad.userDid}&ad=${ad.adId}&tag=${instruction.tag}&score=${instruction.score}`);
											}}
										>
											<span className='instructionText'>{instruction.text}</span>
											{!!instruction.tag && <ParamiScoreTag tag={instruction.tag} />}
											{!!instruction.score && <ParamiScore score={parseInt(instruction.score, 10)} />}
										</div>
									)
								})}
							</div>
						</>}
					</div>
				</Card>
				<div className='buttonContainer'>
					{ad.adClaimed && <>
						{gotoWalletButton('Check your reward and score')}
					</>}

					{!ad.adClaimed && <>
						{ad.insufficientBalance && <>
							<p style={{ fontSize: '0.8rem' }}>Oops, all rewards have been claimed for this Ad. However the next Ad is coming soon, come back later or follow our twitter to get informed.</p>
							{gotoWalletButton('Check your wallet and score')}
						</>}
						{!ad.insufficientBalance &&
							<Button
								block
								type='primary'
								shape='round'
								size='large'
								icon={<MoneyCollectOutlined />}
								className='actionBtn'
								onClick={() => openClaimWindow()}
							>
								{`Claim your $${ad.tokenSymbol}`}
							</Button>
						}
					</>}
				</div>
			</div>
		</>
	)
};

export default Advertisement;
