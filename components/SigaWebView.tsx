import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

interface SigaWebViewProps {
    rut: string;
    pass: string;
    server: string;
    onCompleted: (data: { scheduleHtml: string; profileHtml: string; curriculumHtml: string }) => void;
    onError: (msg: string) => void;
    onProgress?: (progress: number, text: string) => void;
}

export default function SigaWebView({ rut, pass, server, onCompleted, onError, onProgress }: SigaWebViewProps) {
    const webViewRef = useRef<WebView>(null);
    const [step, setStep] = useState(0);
    const completedRef = useRef(false);
    const htmlDataRef = useRef({ schedule: '', profile: '', curriculum: '' });

    const handleNavigationStateChange = useCallback((navState: any) => {
        const url = navState.url;

        if (!url || completedRef.current) return;

        if (step === 0 && !navState.loading && (url.includes('valida_login') || url.includes('home'))) {
            if (onProgress) onProgress(0.1, "Iniciando sesión en SIGA...");
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
                if (onProgress) onProgress(0.3, "Buscando asignaturas...");
                setStep(2);
                webViewRef.current?.injectJavaScript(`
                    window.location.href = '/pag/sistinsc/listados/insc_ListHorarioPersonal.jsp?tipo_inscripcion=2&profesor=0&ano=2026&semestre=1&m=0';
                    true;
                `);
            }
        }

        else if (step === 2 && !navState.loading && url.includes('ListHorarioPersonal')) {
            setStep(3);
            webViewRef.current?.injectJavaScript(`
                setTimeout(function() {
                    window.ReactNativeWebView.postMessage('STATE:HORARIO:' + document.documentElement.outerHTML);
                    window.location.href = '/pag/sistinsc/insc_ficha_frameset.jsp';
                }, 500);
                true;
            `);
        }

        else if (step === 3 && !navState.loading && url.includes('insc_ficha_frameset')) {
            setStep(4);
            const extractFramesJs = `
                var attempts = 0;
                var maxAttempts = 15;
                var interval = setInterval(function() {
                    try {
                        var f2 = window.frames['frame2'];
                        var f3 = window.frames['frame3'];
                        
                        if (f2 && f2.document && f3 && f3.document && 
                            f2.document.readyState === 'complete' && 
                            f3.document.readyState === 'complete') {
                            
                            var txt2 = f2.document.documentElement.outerHTML;
                            var txt3 = f3.document.documentElement.outerHTML;
                            
                            if (txt2 && txt3 && txt2.length > 500) {
                                clearInterval(interval);
                                window.ReactNativeWebView.postMessage('STATE:FICHA:' + txt2 + '\\n\\n' + txt3);
                                window.location.href = '/pag/sistinsc/insc_plan_frameset.jsp';
                                return;
                            }
                        }
                    } catch(e) {
                        // ignore errors during polling
                    }
                    attempts++;
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        window.ReactNativeWebView.postMessage('ERROR:Timeout loading frames');
                    }
                }, 1000);
                true;
            `;
            webViewRef.current?.injectJavaScript(extractFramesJs);
        }

        else if (step === 4 && url.includes('insc_plan_frameset')) {
            setStep(5);
            setTimeout(() => {
                if (completedRef.current) return;
                const extractJs = `
                  var attempts = 0;
                  var maxAttempts = 20;
                  var interval = setInterval(function() {
                    try {
                      for (var i = 0; i < window.frames.length; i++) {
                        try {
                          var f = window.frames[i];
                          if (f && f.document && f.document.readyState === 'complete') {
                            var fhtml = f.document.documentElement.outerHTML;
                            if (fhtml && fhtml.includes('cod_asign') && fhtml.includes('Semestre')) {
                              clearInterval(interval);
                              window.ReactNativeWebView.postMessage('STATE:CURRICULUM:' + fhtml);
                              return;
                            }
                          }
                        } catch(e2) {}
                      }
                      try {
                        var frame6 = window.frames['frame6'];
                        if (frame6 && frame6.document && frame6.document.readyState === 'complete') {
                          var html = frame6.document.documentElement.outerHTML;
                          if (html && html.length > 500 && html.includes('Semestre')) {
                            clearInterval(interval);
                            window.ReactNativeWebView.postMessage('STATE:CURRICULUM:' + html);
                            return;
                          }
                        }
                      } catch(e3) {}
                    } catch(e) {}
                    attempts++;
                    if (attempts >= maxAttempts) {
                      clearInterval(interval);
                      window.ReactNativeWebView.postMessage('ERROR:Timeout extracting curriculum frames');
                    }
                  }, 1500);
                  true;
                `;
                webViewRef.current?.injectJavaScript(extractJs);
            }, 2000);
        }
    }, [step, rut, pass, server, onCompleted, onError, onProgress]);

    const handleMessage = useCallback((event: any) => {
        const msg = event.nativeEvent.data;
        if (!msg || completedRef.current) return;

        if (msg.startsWith('ERROR:')) {
            completedRef.current = true;
            onError(msg.substring(6));
        } else if (msg.startsWith('STATE:HORARIO:')) {
            htmlDataRef.current.schedule = msg.substring(14);
            if (onProgress) onProgress(0.5, "Asignaturas obtenidas...");
        } else if (msg.startsWith('STATE:FICHA:')) {
            htmlDataRef.current.profile = msg.substring(12);
            if (onProgress) onProgress(0.75, "Perfil académico obtenido...");
        } else if (msg.startsWith('STATE:CURRICULUM:')) {
            htmlDataRef.current.curriculum = msg.substring(17);
            if (onProgress) onProgress(0.95, "Malla curricular obtenida...");

            completedRef.current = true;
            onCompleted({
                scheduleHtml: htmlDataRef.current.schedule,
                profileHtml: htmlDataRef.current.profile,
                curriculumHtml: htmlDataRef.current.curriculum
            });
        }
    }, [onCompleted, onError, onProgress]);

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
