import React from 'react';
import './ParamiScoreTag.less'

export interface ParamiScoreTagProps {
    tag: string
}

function ParamiScoreTag({tag }: ParamiScoreTagProps) {
    return <span className='tag'>{tag}</span>;
};

export default ParamiScoreTag;
