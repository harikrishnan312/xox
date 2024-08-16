import { createContext, useState } from 'react';
export const AuthContext = createContext(null);


export default function Context({ children }) {
    const [id, setId] = useState("");
    const [user, setUser] = useState('')

    return (
        <AuthContext.Provider value={{ id, setId, user, setUser }}>
            {children}
        </AuthContext.Provider>
    )
}