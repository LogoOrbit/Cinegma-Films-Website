import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import DrawerContent from './DrawerContent';

import ArticlesScreen from '../screens/ArticlesScreen';
import EditArticleScreen from '../screens/EditArticleScreen';
import UploadImageScreen from '../screens/UploadImageScreen';
import UploadVideoScreen from '../screens/UploadVideoScreen';
import MediaLibraryScreen from '../screens/MediaLibraryScreen';
import MessagesScreen from '../screens/MessagesScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ActivityLogScreen from '../screens/ActivityLogScreen';
import AdminsScreen from '../screens/AdminsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.black },
  headerTintColor: colors.txt,
  headerTitleStyle: { fontWeight: '500', fontSize: 16, letterSpacing: 1 },
  headerShadowVisible: false,
};

export default function AppNavigator() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { backgroundColor: 'transparent', width: 280 },
        ...screenOptions,
      }}
    >
      <Drawer.Screen name="Articles" component={ArticlesScreen} options={{ title: 'Articles' }} />
      <Drawer.Screen name="EditArticle" component={EditArticleScreen}
        options={{ title: 'Article', drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="UploadImage" component={UploadImageScreen} options={{ title: 'Upload Image' }} />
      <Drawer.Screen name="UploadVideo" component={UploadVideoScreen} options={{ title: 'Upload Video' }} />
      <Drawer.Screen name="MediaLibrary" component={MediaLibraryScreen} options={{ title: 'Media Library' }} />
      {isOwner && <Drawer.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />}
      {isOwner && <Drawer.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics' }} />}
      {isOwner && <Drawer.Screen name="ActivityLog" component={ActivityLogScreen} options={{ title: 'Activity Log' }} />}
      {isOwner && <Drawer.Screen name="Admins" component={AdminsScreen} options={{ title: 'Admins' }} />}
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Drawer.Navigator>
  );
}
