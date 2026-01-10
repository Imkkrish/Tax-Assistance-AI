import React from 'react'
import HelpCenter from '../components/HelpCenter'

const NeedHelp = ({ language }) => {
    return (
        <div className="container mx-auto px-4 py-8">
            {/* 
            
      */}
            <HelpCenter isOpen={true} onClose={() => { }} language={language} isPage={true} />
        </div>
    )
}

export default NeedHelp
