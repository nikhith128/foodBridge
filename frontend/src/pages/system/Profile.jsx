import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  User,
  Settings,
  Shield,
  Mail,
  MapPin,
  Globe,
} from 'lucide-react';

import { Badge, Card, useToast } from '../../components/ui/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { cn } from '../../utils/cn.js';

export default function Profile() {
  const { user } = useAuth();
  const { error: raiseError } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // In a full app, this would fetch the user's profile from an API.
    // For the MVP, we use the user data from AuthContext.
    setProfile(user);
    setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-8">
          <Skeleton className="h-64 w-64 rounded-2xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col gap-space-lg max-w-2xl mx-auto">
      <Card padding="lg">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-4">
          Profile
        </h2>

        {user.role === 'DONOR' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="positive" size="sm" icon={Shield}>
                Verified donor
              </Badge>
              <span>
                {user.organizationName || user.name}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Email: {
                  user.email
                }
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Phone: {user.phone || 'Not provided'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Role: {user.role}
              </span>
            </div>
          </div>
        )}

        {user.role === 'NGO' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="positive" size="sm" icon={MapPin}>
                Verified organisation
              </Badge>
              <span>
                {user.organizationName || user.name}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Email: {user.email}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Phone: {user.phone || 'Not provided'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Food preference: {user.ngo?.foodPreference || 'Not set'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Storage capacity: {user.ngo?.storageCapacity || 'Not set'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Verification status:{' '}
                <Badge
                  variant={
                    user.ngo?.verificationStatus === 'VERIFIED'
                      ? 'positive'
                      : user.ngo?.verificationStatus === 'PENDING'
                        ? 'warning'
                        : 'error'
                }>
                  {user.ngo?.verificationStatus}
                </Badge>
              </span>
            </div>
          </div>
        )}

        {user.role === 'VOLUNTEER' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Name: {user.name}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Email: {user.email}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Phone: {user.phone || 'Not provided'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                City: {user.city || 'Not set'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Has vehicle: {user.hasVehicle ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Availability: {user.availability || 'Not set'}
              </span>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-outline-variant">
          <h3 className="font-body-sm text-body-sm text-on-surface-variant mb-3">Account Security</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              as={Link}
              to="/settings"
              variant="outline"
              size="sm"
              width="100%"
            >
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              width="100%"
              onClick={() => {
                // TODO: Implement password change
              }}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}