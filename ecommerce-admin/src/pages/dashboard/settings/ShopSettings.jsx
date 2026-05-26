import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input';

const ShopSettings = () => {
    const { user } = useAuth();

    return (
        <div className="max-w-3xl space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">

                <div>
                    <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                        General Information
                    </h2>
                    <div className="space-y-4">
                        <Input
                            id="shopName"
                            label="Store Name"
                            value={user?.shopName || ''}
                            readOnly
                        />
                        <Input
                            id="subdomain"
                            label="Store Subdomain"
                            value={user?.subdomain || ''}
                            readOnly
                        />
                        {user?.subdomain && (
                            <div className="text-sm text-gray-500 mt-1 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                Your live store:{' '}
                                <a
                                    href={`https://${user.subdomain}.scaleup.codes`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-indigo-600 hover:underline"
                                >
                                    https://{user.subdomain}.scaleup.codes
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                        Admin Profile
                    </h2>
                    <div className="space-y-4">
                        <Input id="adminName"  label="Full Name"      value={user?.fullName || ''} readOnly />
                        <Input id="adminEmail" label="Email Address"  value={user?.email    || ''} readOnly />
                    </div>
                </div>

                <p className="text-xs text-gray-400 pt-2">
                    Store name and subdomain are set at registration and cannot be changed here. Contact support to update them.
                </p>
            </div>
        </div>
    );
};

export default ShopSettings;