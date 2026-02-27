import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface SigaWebViewProps {
    rut: string;
    pass: string;
    server: string;
    onCompleted: (data: { scheduleHtml: string; profileHtml: string }) => void;
    onError: (msg: string) => void;
}

export default function SigaWebView({ rut, pass, server, onCompleted, onError }: SigaWebViewProps) {
    const webViewRef = useRef<WebView>(null);
    const [step, setStep] = useState(0);
    const completedRef = useRef(false);

    const handleNavigationStateChange = useCallback((navState: any) => {
        const url = navState.url;
        console.log("WV:", step, url, navState.loading ? 'loading' : 'done');

        if (!url || completedRef.current) return;

        if (step === 0 && !navState.loading && (url.includes('valida_login') || url.includes('home'))) {
            const js = `
                try {
                    var loginField = document.getElementsByName('login')[0];
                    if (loginField) {
                        loginField.value = '${rut}';
                        document.getElementsByName('passwd')[0].value = '${pass}';
                        var selects = document.getElementsByName('server');
                        if(selects.length > 0) selects[0].value = '${server}';
                        document.forms[0].submit();
                    }
                } catch(e) {
                    window.ReactNativeWebView.postMessage('ERROR:Login inject failed: ' + e);
                }
                true;
            `;
            webViewRef.current?.injectJavaScript(js);
            setStep(1);
        }

        else if (step === 1 && !navState.loading && !url.includes('valida_login')) {
            if (url.includes('error') || url.includes('Login_error')) {
                onError('Credenciales incorrectas');
                return;
            }
            if (url.includes('sistemas') || url.includes('menu')) {
                console.log("WV: Login OK → Fetching data immediately via XHR...");
                setStep(2);

                const fetchBothScript = `
                    (function() {
                        function xhrGet(url) {
                            return new Promise(function(resolve, reject) {
                                var xhr = new XMLHttpRequest();
                                xhr.open('GET', url, true);
                                xhr.onload = function() {
                                    console.log('XHR ' + url + ' status=' + xhr.status + ' len=' + xhr.responseText.length);
                                    if (xhr.status >= 200 && xhr.status < 300) {
                                        if (xhr.responseText.indexOf('name="passwd"') !== -1 || xhr.responseText.indexOf('Sesión Perdida') !== -1) {
                                            reject('Session expired for: ' + url);
                                        } else {
                                            resolve(xhr.responseText);
                                        }
                                    } else {
                                        reject('HTTP ' + xhr.status + ' for: ' + url);
                                    }
                                };
                                xhr.onerror = function() { reject('XHR network error: ' + url); };
                                xhr.send();
                            });
                        }

                        Promise.all([
                            xhrGet('/pag/sistinsc/listados/insc_ListHorarioPersonal.jsp?tipo_inscripcion=2&profesor=0&ano=2026&semestre=1&m=0'),
                            xhrGet('/pag/sistinsc/insc_ficha_frame3.jsp')
                        ])
                        .then(function(results) {
                            var scheduleHtml = results[0];
                            var profileHtml = results[1];
                            console.log('Schedule len=' + scheduleHtml.length + ' Profile len=' + profileHtml.length);
                            
                            var payload = JSON.stringify({
                                scheduleHtml: scheduleHtml,
                                profileHtml: profileHtml
                            });
                            window.ReactNativeWebView.postMessage('DATA:' + payload);
                        })
                        .catch(function(e) {
                            window.ReactNativeWebView.postMessage('ERROR:Falla XHR: ' + e);
                        });
                    })();
                    true;
                `;
                webViewRef.current?.injectJavaScript(fetchBothScript);
            }
        }
    }, [step, rut, pass, server, onCompleted, onError]);

    const handleMessage = useCallback((event: any) => {
        const msg = event.nativeEvent.data;
        if (!msg || completedRef.current) return;

        if (msg.startsWith('ERROR:')) {
            completedRef.current = true;
            onError(msg.substring(6));
        } else if (msg.startsWith('DATA:')) {
            try {
                completedRef.current = true;
                const data = JSON.parse(msg.substring(5));
                onCompleted(data);
            } catch (e) {
                onError('Error parsing data from WebView');
            }
        }
    }, [onCompleted, onError]);

    return (
        <View style={{ width: 0, height: 0, opacity: 0 }}>
            <WebView
                ref={webViewRef}
                source={{ uri: 'https://siga.usm.cl/pag/home.jsp' }}
                onNavigationStateChange={handleNavigationStateChange}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                cacheEnabled={false}
            />
        </View>
    );
}
