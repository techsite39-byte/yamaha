const authConfigurationKeys = ['baseURL', 'issuerBaseURL', 'clientID', 'clientSecret', 'secret'];

export function validateAdminAuthConfiguration({
  production,
  authConfiguration,
  allowedSubjects,
}) {
  const suppliedKeys = authConfigurationKeys.filter((key) => (
    typeof authConfiguration[key] === 'string' && authConfiguration[key].trim().length > 0
  ));
  const authConfigured = suppliedKeys.length === authConfigurationKeys.length;

  if (suppliedKeys.length > 0 && !authConfigured) {
    const missingKeys = authConfigurationKeys.filter((key) => !authConfiguration[key]);
    throw new Error(`Auth0 configuration is incomplete. Missing settings: ${missingKeys.join(', ')}.`);
  }
  if (production && !authConfigured) {
    throw new Error('Complete Auth0 configuration is required in production.');
  }
  if (authConfigured && authConfiguration.secret.trim().length < 32) {
    throw new Error('AUTH0_SECRET must contain at least 32 characters.');
  }
  if ((production || authConfigured) && allowedSubjects.size === 0) {
    throw new Error('Set ADMIN_ALLOWED_SUBJECTS to one or more exact Auth0 user subject IDs.');
  }
  if (production) {
    let baseURL;
    try {
      baseURL = new URL(authConfiguration.baseURL);
    } catch {
      throw new Error('AUTH0_BASE_URL must be a valid HTTPS URL in production.');
    }
    if (baseURL.protocol !== 'https:') {
      throw new Error('AUTH0_BASE_URL must use HTTPS in production.');
    }
  }

  return authConfigured;
}

export function createAdminAuthPolicy({
  production,
  authConfigured,
  allowedSubjects,
  getAdminSession,
  getToken,
}) {
  const getNativeSession = async (request) => {
    if (production) return null;
    const token = getToken(request);
    return token ? getAdminSession(token) : null;
  };

  const isAuthenticatedOidcUser = (request) => (
    authConfigured && request.oidc?.isAuthenticated?.()
  );

  const isAllowedOidcUser = (request) => {
    const subject = request.oidc?.user?.sub;
    return Boolean(subject && allowedSubjects.has(subject));
  };

  const getAuthorizedUser = async (request) => {
    const session = await getNativeSession(request);
    if (session) return session.user;

    if (isAuthenticatedOidcUser(request) && isAllowedOidcUser(request)) {
      return request.oidc.user;
    }
    return null;
  };

  return {
    nativeLoginAllowed: !production,

    async getSessionStatus(request) {
      const session = await getNativeSession(request);
      if (session) {
        return { authenticated: true, isAdmin: true, user: session.user };
      }

      if (isAuthenticatedOidcUser(request)) {
        const user = request.oidc.user;
        const isAdmin = isAllowedOidcUser(request);
        return {
          authenticated: true,
          isAdmin,
          user: isAdmin
            ? { name: user.name ?? user.email ?? 'Administrator', email: user.email, role: 'Super Admin' }
            : undefined,
        };
      }

      return { authenticated: false, isAdmin: false };
    },

    getAuthorizedUser,

    async requireAdmin(request, response, next) {
      const user = await getAuthorizedUser(request);
      if (user) {
        request.adminUser = user;
        return next();
      }
      return response.status(401).json({
        code: 'authentication_required',
        message: 'Please log in to continue.',
      });
    },
  };
}
