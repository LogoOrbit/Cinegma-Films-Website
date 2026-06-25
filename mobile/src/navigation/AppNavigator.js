import React from 'react';
import { Text } from 'react-native';
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

function headerTitle(title) {
  return {
    headerTitle: () => (
      <Text style={{ color: colors.txt, fontSize: 16, fontWeight: '500', letterSpacing: 1 }}>
        {title}
      </Text>
    ),
  };
}

const screenOptions = {
  headerStyle: { backgroundColor: colors.black },
  headerTintColor: colors.txt,
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
      <Drawer.Screen name="Articles" component={ArticlesScreen} options={headerTitle('Articles')} />
      <Drawer.Screen name="EditArticle" component={EditArticleScreen}
        options={{ ...headerTitle('Article'), drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="UploadImage" component={UploadImageScreen} options={headerTitle('Upload Image')} />
      <Drawer.Screen name="UploadVideo" component={UploadVideoScreen} options={headerTitle('Upload Video')} />
      <Drawer.Screen name="MediaLibrary" component={MediaLibraryScreen} options={headerTitle('Media Library')} />
      {isOwner && <Drawer.Screen name="Messages" component={MessagesScreen} options={headerTitle('Messages')} />}
      {isOwner && <Drawer.Screen name="Analytics" component={AnalyticsScreen} options={headerTitle('Analytics')} />}
      {isOwner && <Drawer.Screen name="ActivityLog" component={ActivityLogScreen} options={headerTitle('Activity Log')} />}
      {isOwner && <Drawer.Screen name="Admins" component={AdminsScreen} options={headerTitle('Admins')} />}
      <Drawer.Screen name="Settings" component={SettingsScreen} options={headerTitle('Settings')} />
    </Drawer.Navigator>
  );
}
