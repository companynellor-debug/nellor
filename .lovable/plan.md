

# Plan: Generate WebViewApp Android Project ZIP (Final Working Version)

This is a **file generation task** -- create a complete, build-ready Android Studio project as a downloadable ZIP.

## Root cause of previous failures

The "Generate App Bundles or APKs" option was greyed out because:
1. Missing Gradle Wrapper executables (`gradlew`, `gradlew.bat`) and the actual `gradle-wrapper.jar` binary
2. Missing or invalid `google-services.json` -- the Google Services plugin fails without it
3. Possible missing `local.properties` or incorrect project structure

## What will be different this time

1. **Download a real Gradle Wrapper JAR** from the official Gradle distribution (not a placeholder) -- this is the #1 reason Android Studio fails to recognize the project
2. **Include a valid `google-services.json`** with the correct package name `com.webviewapp` so Gradle sync succeeds immediately
3. **Include executable `gradlew` and `gradlew.bat`** scripts with correct content
4. **Include `local.properties`** pointing to a standard SDK path (Android Studio overwrites this on open, but having it prevents sync errors)
5. **Verify ZIP structure** -- the root folder inside the ZIP must be `WebViewApp/` with `build.gradle` and `settings.gradle` at the top level

## Files to generate

```text
WebViewApp/
├── gradlew                          (executable shell script)
├── gradlew.bat                      (Windows batch script)
├── gradle/wrapper/
│   ├── gradle-wrapper.jar           (real binary downloaded from Gradle)
│   └── gradle-wrapper.properties    (Gradle 8.2)
├── build.gradle                     (root - AGP 8.2.0 + google-services 4.4.0)
├── settings.gradle
├── gradle.properties
├── local.properties
├── app/
│   ├── build.gradle                 (module - compileSdk 34, minSdk 21)
│   ├── proguard-rules.pro
│   ├── google-services.json         (valid placeholder for com.webviewapp)
│   ├── google-services.json.example
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/webviewapp/
│       │   ├── MainActivity.java
│       │   ├── SplashActivity.java
│       │   └── MyFirebaseMessagingService.java
│       └── res/
│           ├── layout/activity_main.xml
│           ├── layout/activity_splash.xml
│           ├── values/strings.xml
│           ├── values/colors.xml
│           ├── values/themes.xml
│           ├── drawable/ic_notification.xml
│           └── xml/network_security_config.xml
└── README.md
```

## Key implementation details

- **Gradle Wrapper JAR**: Will download the real `gradle-wrapper.jar` from `https://github.com/gradle/gradle/raw/v8.2.0/gradle/wrapper/gradle-wrapper.jar` or extract it from a Gradle distribution
- **target_url**: defaults to `https://nellor.lovable.app`
- **Java source files**: Complete with all imports, AndroidBridge JS interface, WebChromeClient, WebViewClient, FCM service
- **Output**: `/mnt/documents/WebViewApp.zip`

## Execution steps

1. Create full directory structure under `/tmp/WebViewApp/`
2. Download real `gradle-wrapper.jar` from official source
3. Write `gradlew` and `gradlew.bat` with correct content
4. Write all Java source files with complete imports
5. Write all XML resources, build files, and manifest
6. Write valid `google-services.json`
7. Package as ZIP and deliver

