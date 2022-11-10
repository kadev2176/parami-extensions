import React from 'react';
import './Confetti.css';

export interface ConfettiProps { }

function Confetti({ }: ConfettiProps) {
    return <>
        <div className='confetti-container'>
            {[...Array(60)].map((_, index) => {
                return <div key={index} className={`confetti-${index}`}></div>
            })}
        </div>
    </>;
};

export default Confetti;
