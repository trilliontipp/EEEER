import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User {
    id: string
    name: string
    email: string
    reputation: number
}

interface AuthContextType {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<void>
    register: (name: string, email: string, password: string) => Promise<void>
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for stored token on mount
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
        }
        setIsLoading(false)
    }, [])

    const login = async (email: string, password: string) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })

        if (!response.ok) {
            let errorMessage = 'Login failed'
            try {
                const error = await response.json()
                errorMessage = error.message || error.error || 'Login failed'
            } catch (e) {
                // Response is not JSON (likely HTML error page)
                errorMessage = `Server error (${response.status}): ${response.statusText}`
            }
            throw new Error(errorMessage)
        }

        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
    }

    const register = async (name: string, email: string, password: string) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        })

        if (!response.ok) {
            let errorMessage = 'Registration failed'
            try {
                const error = await response.json()
                errorMessage = error.message || error.error || 'Registration failed'
            } catch (e) {
                // Response is not JSON (likely HTML error page)
                errorMessage = `Server error (${response.status}): ${response.statusText}`
            }
            throw new Error(errorMessage)
        }

        const data = await response.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
