import { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Settings,
  Shield,
  Mail,
  MapPin,
  ArrowLeft,
} from 'lucide-react';

import { Badge, Card, Button, useToast } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

export default function Settings() {
  const { user } = useAuth();
  const { error: raiseError, success: raiseSuccess } = useToast();
  const location = useLocation();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    organisationName: user?.organizationName || '',
    foodPreference: user?.ngo?.foodPreference || '',
    storageCapacity: user?.ngo?.storageCapacity ? user.ngo.storageCapacity.toString() : '',
    city: user.city || '',
    hasVehicle: user.hasVehicle || false,
  });

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]:
        type === 'checkbox' ? checked : value !== undefined ? value : form[name],
    });
  }, [form]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    // TODO: Implement actual settings update via API
    raiseSuccess('Settings updated successfully');
  }, [form, raiseSuccess]);

  return (
    <div className="flex flex-col gap-space-lg max-w-2xl mx-auto">
      <Card padding="lg">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-4">
          Settings
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info section */}
          <Card padding="lg">
            <h3 className="font-body-sm text-body-sm uppercase tracking-wider text-on-surface-variant mb-3">
              Basic Information
            </h3>

            {/* Organisation name (donor/NGO) */}
            {user.role !== 'VOLUNTEER' && (
              <div>
                <label htmlFor="organisationName" className="font-body-sm text-body-sm text-on-surface-variant">
                  Organisation Name
                </label>
                <input
                  id="organisationName"
                  name="organisationName"
                  type="text"
                  value={form.organisationName}
                  onChange={handleChange}
                  className={cn(
                    'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                    'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                  )}
                  required
                />
              </div>
            )}

            {/* Food preference (NGO only) */}
            {user.role === 'NGO' && (
              <div>
                <label htmlFor="foodPreference" className="font-body-sm text-body-sm text-on-surface-variant">
                  Food Preference
                </label>
                <select
                  id="foodPreference"
                  name="foodPreference"
                  value={form.foodPreference}
                  onChange={handleChange}
                  className={cn(
                    'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                    'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                  )}
                  required
                >
                  <option value="">Select food preference</option>
                  <option value="Cooked Hot Meals">Cooked Hot Meals</option>
                  <option value="Fresh Produce">Fresh Produce</option>
                  <option value="Bakery & Bread">Bakery & Bread</option>
                  <option value="Vegetarian Only">Vegetarian Only</option>
                  <option value="Non-Veg">Non-Veg</option>
                </select>
              </div>
            )}

            {/* Storage capacity (NGO only) */}
            {user.role === 'NGO' && (
              <div>
                <label htmlFor="storageCapacity" className="font-body-sm text-body-sm text-on-surface-variant">
                  Storage Capacity
                </label>
                <input
                  id="storageCapacity"
                  name="storageCapacity"
                  type="number"
                  value={form.storageCapacity}
                  onChange={handleChange}
                  className={cn(
                    'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                    'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                  )}
                  placeholder="e.g. 450 cu ft chiller, up to 600 kg fresh"
                  required
                />
                <p className="font-body-sm text-body-sm text-on-surface-variant/60 mt-1">
                  As entered in NGO registration
                </p>
              </div>
            )}

            {/* Location (NGO only) */}
            {user.role === 'NGO' && (
              <div>
                <label htmlFor="city" className="font-body-sm text-body-sm text-on-surface-variant">
                  City / Location
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={form.city}
                  onChange={handleChange}
                  className={cn(
                    'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                    'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                  )}
                  placeholdere.g. "Demo City"
                />
              </div>
            )}

            {/* Volunteer preferences */}
            {user.role === 'VOLUNTEER' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="hasVehicle" className="font-body-sm text-body-sm text-on-surface-variant">
                      Has Vehicle
                    </label>
                    <select
                      id="hasVehicle"
                      name="hasVehicle"
                      value={String(form.hasVehicle)}
                      onChange={handleChange}
                      className={cn(
                        'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                        'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                      )}
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="availability" className="font-body-sm text-body-sm text-on-surface-variant">
                      Availability
                    </label>
                    <input
                      id="availability"
                      name="availability"
                      type="text"
                      value={form.availability}
                      onChange={handleChange}
                      className={cn(
                        'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                        'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                      )}
                      placeholder="e.g. Weekdays, Evenings"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password change section */}
            <Card padding="lg">
              <h3 className="font-body-sm text-body-sm uppercase tracking-wider text-on-surface-variant mb-3">
                Change Password
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="font-body-sm text-body-sm text-on-surface-variant">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    className={cn(
                      'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                    )}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="font-body-sm text-body-sm text-on-surface-variant">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={form.newPassword}
                    onChange={handleChange}
                    className={cn(
                      'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                    )}
                    required
                    minLength="8"
                  />
                  <p className="font-body-sm text-body-sm text-on-surface-variant/60">
                    At least 8 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="font-body-sm text-body-sm text-on-surface-variant">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={cn(
                      'w-full rounded-xl bg-surface-container-lowest p-3 font-body-md text-body-md text-on-surface shadow-sm',
                      'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:bg-surface-bright',
                    )}
                    required
                    minLength="8"
                  />
                  <p className="font-body-sm text-body-sm text-on-surface-variant/60">
                    Must match new password
                  </p>
                </div>
              </div>
            </Card>
          </form>

          {/* Log out button */}
          <Card padding="lg" className="mt-6 pt-6 border-t border-outline-variant">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                // TODO: Implement logout confirmation
              }
              width="100%"
            >
              Log Out
            </Button>
          </Card>
        </Card>
      </Card>
    </div>
  );
}