import { useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

const useAuthRedirect = () => {
    const location = useLocation();
    const history = useHistory();

    useEffect(() => {
        const tokenFromURL = new URLSearchParams(location.search).get('token');
        const storedToken = sessionStorage.getItem('token');

        if (tokenFromURL && storedToken !== tokenFromURL) {
            sessionStorage.setItem('token', tokenFromURL);

            // 🔙 Redirigir a la ruta que se quería antes
            const redirectTo = sessionStorage.getItem('redirectAfterLogin') || '/products';
            sessionStorage.removeItem('redirectAfterLogin');
            history.replace(redirectTo);
        } else if (!storedToken) {
            // 💾 Guardar ruta actual antes de redirigir
            sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
            history.replace('/login');
        }
    }, []);
};

export default useAuthRedirect;
