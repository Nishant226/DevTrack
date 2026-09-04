export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const hasRole = (allowedRoles = []) => {
  const user = getCurrentUser();
  
  // Debugging ke liye prints
  console.log("Current User Object:", user);
  console.log("Allowed Roles:", allowedRoles);

  if (!user || !user.role) return false;
  
  const userRoleLower = user.role.toLowerCase();
  const allowedLower = allowedRoles.map(r => r.toLowerCase());
  
  const hasAccess = allowedLower.includes(userRoleLower);
  console.log("Has Access?:", hasAccess);
  
  return hasAccess;
};