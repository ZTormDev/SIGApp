import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getCredentials, getProfile, getSchedule, hasAcceptedDisclaimer } from '../utils/storage';

export default function IndexScreen() {
    const [isReady, setIsReady] = useState(false);
    const [redirectPath, setRedirectPath] = useState<string | null>(null);

    useEffect(() => {
        async function checkAuthState() {
            // Small delay to ensure navigation container is ready
            await new Promise(resolve => setTimeout(resolve, 500));

            const { rut } = await getCredentials();
            const schedule = await getSchedule();
            const profile = await getProfile();
            const acceptedDisclaimer = await hasAcceptedDisclaimer();

            if (!acceptedDisclaimer) {
                setRedirectPath('/disclaimer');
            } else if ((schedule || profile) && rut) {
                setRedirectPath('/(tabs)/home');
            } else {
                setRedirectPath('/login');
            }
            setIsReady(true);
        }

        checkAuthState();
    }, []);

    if (!isReady || !redirectPath) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return <Redirect href={redirectPath as any} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});
