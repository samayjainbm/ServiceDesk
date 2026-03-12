// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './navigation/stacknavigator';

// ✅ Google Auth init
import { initGoogleAuth } from './google-auth/google-auth';

const App = () => {
  useEffect(() => {
    // ✅ configure Google Sign-in once when app starts
    initGoogleAuth();
  }, []);

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default App;