# Matbakh 360 — Applications mobiles (iOS + Android)

Wrapper Capacitor autour du site PWA `https://matbakh360.com`.

## Stack
- **Capacitor 8** (Ionic) — wrapper natif
- **Plugins** : App, SplashScreen, StatusBar, Share, Preferences
- **iOS** : WKWebView, scheme `Matbakh360`
- **Android** : WebView Chromium, `androidScheme: https`

## Identifiants
- App ID : `com.matbakh360.app`
- App Name : `Matbakh 360`
- URL servie : `https://matbakh360.com` (mode remote — la PWA live est chargée)

## Pré-requis dev
- **iOS** : macOS + Xcode 15+ + CocoaPods (`sudo gem install cocoapods`)
- **Android** : Android Studio + JDK 17 + SDK 34

## Commandes

### Build/Sync
```bash
npx cap sync          # synchronise www/ + plugins vers ios/ et android/
npx cap copy          # copie uniquement www/
```

### Ouvrir dans l'IDE
```bash
npx cap open ios      # ouvre Xcode
npx cap open android  # ouvre Android Studio
```

### Lancer (device/simulateur)
```bash
npx cap run ios       # liste les targets et lance
npx cap run android
```

## Publication

### App Store (iOS)
1. `npx cap open ios` → Xcode
2. Sélectionner team + signing automatique
3. Product → Archive
4. Distribuer via App Store Connect
5. Soumettre pour review

### Play Store (Android)
1. `npx cap open android` → Android Studio
2. Build → Generate Signed Bundle / APK → AAB
3. Upload sur Google Play Console
4. Soumettre pour review

## Notes importantes

### Apple review (risque de rejet)
Une simple webview pointant vers un site peut être rejetée par Apple. Mitigations en place :
- Splash screen natif (1,5s)
- StatusBar natif
- Plugins Share + Preferences (intégration native visible)
- Icônes optimisées par plateforme

Si rejet : ajouter Push Notifications natives + offline cache + App Shortcuts.

### Android : pas de blocage particulier.

### Mise à jour du contenu
Comme on charge `matbakh360.com` à distance, **toute modification du site est instantanément reflétée dans les apps** sans nouveau release Store.

## Régénérer les icônes
```bash
node -e "..."         # (cf. script dans /assets — source: ../favicon.svg)
npx capacitor-assets generate
npx cap sync
```
