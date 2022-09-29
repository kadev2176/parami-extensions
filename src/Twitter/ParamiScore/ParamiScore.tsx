import React from 'react';
import './ParamiScore.less';

export interface ParamiScoreProps {
    score: number
}

function ParamiScore({ score }: ParamiScoreProps) {
    return <span className='scoreContainer'>
        {score >= 0 && <span className='positive'>
            +{score}
        </span>}
        {score < 0 && <span className='negative'>
            -{Math.abs(score)}
        </span>}
    </span>;
};

export default ParamiScore;
