import {createContext, useContext, useState, ReactNode} from 'react';

interface GlobalStateProps {
    state: any;
    setState: React.Dispatch<React.SetStateAction<any>>;
}

const GlobalStateContext = createContext<GlobalStateProps | undefined>(undefined);

export const GlobalStateProvider = ({children}: {children: ReactNode}) => {
    const [state, setState] = useState<any>({});
    return <GlobalStateContext.Provider value={{state, setState}}>{children}</GlobalStateContext.Provider>;
}

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (!context) {
        throw new Error('useGlobalState must be used within a GlobalStateProvider');
    }
    return context;
}