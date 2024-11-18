import React from 'react';

const App: React.FC = () => {
    const mobile = window.matchMedia('(max-width: 768px)').matches;

    return (
        <>
            <SideBar />
            <MainContent />
        </>
    );
};

export default App;