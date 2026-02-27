import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { getCredentials, getProfile, getSchedule, hasAcceptedDisclaimer } from '../utils/storage';

export default function IndexScreen() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        async function checkAuthState() {

            await new Promise(resolve => setTimeout(resolve, 500));

            const { rut } = await getCredentials();
            const schedule = await getSchedule();
            const profile = await getProfile();
            const acceptedDisclaimer = await hasAcceptedDisclaimer();

            setIsReady(true);

            if (!acceptedDisclaimer) {
                router.replace('/disclaimer');
            } else if ((schedule || profile) && rut) {
                router.replace('/(tabs)/home');
            } else {
                router.replace('/login');
            }
        }

        checkAuthState();
    }, [router]);

    if (!isReady) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return <View style={styles.container} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});
