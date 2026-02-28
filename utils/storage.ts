import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

let SecureStore: any = null;
if (Platform.OS !== 'web') {
    SecureStore = require('expo-secure-store');
}

const RUT_KEY = 'RUT_CREDENTIAL';
const PWD_KEY = 'PWD_CREDENTIAL';
const SERVER_KEY = 'SERVER_CREDENTIAL';
const SCHEDULE_KEY = 'USER_SCHEDULE';
const PROFILE_KEY = 'USER_PROFILE';
const DISCLAIMER_KEY = 'HAS_ACCEPTED_DISCLAIMER';

const secureSetItem = async (key: string, value: string) => {
    if (Platform.OS === 'web' || !SecureStore) {
        await AsyncStorage.setItem(`SECURE_${key}`, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
};

const secureGetItem = async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' || !SecureStore) {
        return AsyncStorage.getItem(`SECURE_${key}`);
    } else {
        return SecureStore.getItemAsync(key);
    }
};

const secureDeleteItem = async (key: string) => {
    if (Platform.OS === 'web' || !SecureStore) {
        await AsyncStorage.removeItem(`SECURE_${key}`);
    } else {
        await SecureStore.deleteItemAsync(key);
    }
};

export interface UserProfile {
    fullName: string;
    firstName: string;
    rut: string;
    career: string;
    campus: string;
    jornada: string;
    rol: string;
    emailUsm: string;
    emailPersonal: string;
    situation: string;
    lastEnrollment: string;
    plan: string;
}

export async function saveCredentials(rut: string, pass: string, server: string = 'usm.cl') {
    try {
        await secureSetItem(RUT_KEY, rut);
        await secureSetItem(PWD_KEY, pass);
        await secureSetItem(SERVER_KEY, server);
    } catch (error) {
        console.error('Error saving credentials:', error);
    }
}

export async function getCredentials() {
    try {
        const rut = await secureGetItem(RUT_KEY);
        const pass = await secureGetItem(PWD_KEY);
        const server = await secureGetItem(SERVER_KEY) || 'usm.cl';
        return { rut, pass, server };
    } catch (error) {
        console.error('Error reading credentials:', error);
        return { rut: null, pass: null, server: 'usm.cl' };
    }
}

export async function clearCredentials() {
    await secureDeleteItem(RUT_KEY);
    await secureDeleteItem(PWD_KEY);
    await secureDeleteItem(SERVER_KEY);
}

export async function saveSchedule(scheduleData: any) {
    try {
        const jsonValue = JSON.stringify(scheduleData);
        await AsyncStorage.setItem(SCHEDULE_KEY, jsonValue);
    } catch (error) {
        console.error('Error saving schedule:', error);
    }
}

export async function getSchedule() {
    try {
        const jsonValue = await AsyncStorage.getItem(SCHEDULE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error('Error reading schedule:', error);
        return null;
    }
}

export async function clearSchedule() {
    await AsyncStorage.removeItem(SCHEDULE_KEY);
}

export async function saveProfile(profile: UserProfile) {
    try {
        const jsonValue = JSON.stringify(profile);
        await AsyncStorage.setItem(PROFILE_KEY, jsonValue);
    } catch (error) {
        console.error('Error saving profile:', error);
    }
}

export async function getProfile(): Promise<UserProfile | null> {
    try {
        const jsonValue = await AsyncStorage.getItem(PROFILE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
        console.error('Error reading profile:', error);
        return null;
    }
}

export async function clearProfile() {
    await AsyncStorage.removeItem(PROFILE_KEY);
}

export async function hasAcceptedDisclaimer() {
    try {
        const val = await AsyncStorage.getItem(DISCLAIMER_KEY);
        return val === 'true';
    } catch {
        return false;
    }
}

export async function setAcceptedDisclaimer() {
    try {
        await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
    } catch (error) {
        console.error('Error saving disclaimer state:', error);
    }
}
