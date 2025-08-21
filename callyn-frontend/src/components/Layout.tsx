import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom"

import { useAuth } from "@/context";

const Layout = () => {
    const { loginByToken } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const token = localStorage.getItem('token');

        // Public routes that don't require auth
        const publicPaths = ['/', '/login', '/signup', '/onboarding'];
        const isPublic = publicPaths.includes(location.pathname);

        if (token) {
            // Try to restore session silently; only redirect to dashboard if user is on the root
            loginByToken(token).then(() => {
                if (location.pathname === '/') {
                    navigate('/dashboard', { replace: true });
                }
            }).catch(() => {
                // Bad/expired token: clear it and redirect only if on a protected route
                try { localStorage.removeItem('token'); } catch (_) {}
                if (!isPublic) navigate('/login', { replace: true });
            });
        } else {
            // No token: only redirect if trying to access a protected route
            const isProtected = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/create-agent');
            if (isProtected) {
                navigate('/login', { replace: true });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return <Outlet />
}

export default Layout;