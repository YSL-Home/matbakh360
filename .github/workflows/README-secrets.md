# Secrets GitHub Actions — mobile builds

À configurer dans **Settings → Secrets and variables → Actions** du repo.

## Android (pour build signé AAB → Play Store)

| Secret | Comment l'obtenir |
|---|---|
| `ANDROID_KEYSTORE_B64` | `keytool -genkey -v -keystore matbakh360.jks -alias matbakh360 -keyalg RSA -keysize 2048 -validity 10000` → `base64 -i matbakh360.jks \| pbcopy` |
| `ANDROID_KEYSTORE_PASSWORD` | Mot de passe du keystore |
| `ANDROID_KEY_ALIAS` | `matbakh360` (ou ton alias) |
| `ANDROID_KEY_PASSWORD` | Mot de passe de la clé |

**Génération keystore (à faire UNE fois, garder en lieu sûr — perte = impossible de mettre à jour l'app sur Play Store) :**
```bash
keytool -genkey -v -keystore matbakh360.jks \
  -alias matbakh360 -keyalg RSA -keysize 2048 -validity 10000
base64 -i matbakh360.jks | pbcopy   # → coller dans ANDROID_KEYSTORE_B64
```

## iOS (pour build signé IPA → App Store)

| Secret | Comment l'obtenir |
|---|---|
| `IOS_TEAM_ID` | Apple Developer → Membership → Team ID (10 chars) |
| `IOS_DIST_CERT_B64` | Exporter le certificat distribution depuis Keychain en .p12, puis `base64 -i cert.p12 \| pbcopy` |
| `IOS_DIST_CERT_PASSWORD` | Mot de passe du .p12 à l'export |
| `IOS_PROVISIONING_PROFILE_B64` | Télécharger le profil App Store depuis developer.apple.com, puis `base64 -i profile.mobileprovision \| pbcopy` |
| `IOS_KEYCHAIN_PASSWORD` | N'importe quel mot de passe temporaire pour le keychain CI |

## Déclenchement des builds

**Manuel** :
- GitHub → Actions → "Build Android App" / "Build iOS App" → Run workflow

**Automatique sur tag** :
```bash
git tag v1.0.0
git push origin v1.0.0    # déclenche les 2 builds release
```

## Sans signature (test rapide)

Si secrets non configurés, le workflow Android peut produire un **APK debug** (installable directement sur téléphone via `adb install`), et iOS produit un build simulator non-signé.
