import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import LoginForm from '../auth/LoginForm.jsx';

const Login = () => {
    return (
        <AuthLayout
            title="ScaleUp Admin"
            subtitle="Sign in to manage your storefront"
        >
            <LoginForm />
            <p className="mt-4 text-center text-sm text-gray-500">
                New vendor?{' '}
                <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
                    Create your store
                </Link>
            </p>
        </AuthLayout>
    );
};

export default Login;