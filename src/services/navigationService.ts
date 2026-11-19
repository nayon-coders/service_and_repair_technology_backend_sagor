import { prisma } from '../config/prisma';
import { NavigationMenuItem, UserResponse } from '../types';

export const getUserNavigation = async (user: UserResponse): Promise<NavigationMenuItem[]> => {
  // Fetch all active navigation menus ordered by sort order
  const allMenus = await prisma.navigationMenu.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  const isSuperAdmin =
    user.role === 'Super Admin' ||
    user.role === 'SUPER_ADMIN' ||
    (user.permissions && user.permissions.includes('*'));

  const userPerms = new Set(user.permissions || []);

  // Helper function to check if user has permission for a menu item
  const canAccessItem = (item: { requiredPermission: string | null }): boolean => {
    if (isSuperAdmin) return true;
    if (!item.requiredPermission) return true;
    return userPerms.has(item.requiredPermission);
  };

  // Group menus by parentId
  const childrenByParent = new Map<string | null, typeof allMenus>();
  for (const menu of allMenus) {
    const parentKey = menu.parentId;
    if (!childrenByParent.has(parentKey)) {
      childrenByParent.set(parentKey, []);
    }
    childrenByParent.get(parentKey)!.push(menu);
  }

  // Recursive tree builder with permission pruning
  const buildMenuTree = (parentId: string | null): NavigationMenuItem[] => {
    const directChildren = childrenByParent.get(parentId) || [];
    const filteredTree: NavigationMenuItem[] = [];

    for (const item of directChildren) {
      const nestedChildren = buildMenuTree(item.id);
      const isDirectlyPermitted = canAccessItem(item);

      // If it's a parent container (has children), it must have at least one permitted child
      if (nestedChildren.length > 0) {
        filteredTree.push({
          id: item.id,
          title: item.title,
          key: item.key,
          path: item.path,
          icon: item.icon,
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
          requiredPermission: item.requiredPermission,
          children: nestedChildren,
        });
      } else if (isDirectlyPermitted) {
        filteredTree.push({
          id: item.id,
          title: item.title,
          key: item.key,
          path: item.path,
          icon: item.icon,
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
          requiredPermission: item.requiredPermission,
          children: [],
        });
      }
    }

    return filteredTree;
  };

  return buildMenuTree(null);
};

