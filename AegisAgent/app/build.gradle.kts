plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

// This is the modern Kotlin 2.x way to set JVM target for BOTH Java and Kotlin consistently.
// It replaces kotlinOptions { jvmTarget } and compileOptions { sourceCompatibility }.
kotlin {
    jvmToolchain(17)
}

android {
    val debugServerUrl = (project.findProperty("aegis.server.baseUrlDebug") as String?)
        ?: "http://10.150.203.177:8081/"
    val releaseServerUrl = (project.findProperty("aegis.server.baseUrlRelease") as String?)
        ?: "https://aegis.wce.ac.in/"

    namespace = "com.aegis.agent"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aegis.agent"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            buildConfigField("String", "SERVER_BASE_URL", "\"$debugServerUrl\"")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
<<<<<<< HEAD
            buildConfigField("String", "SERVER_BASE_URL", "\"http://13.203.207.207:8081/\"")
=======
            buildConfigField("String", "SERVER_BASE_URL", "\"$releaseServerUrl\"")
>>>>>>> e4d9f7f39464b65a4582308713b2b1e368e12061
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.work:work-runtime-ktx:2.10.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    testImplementation(libs.junit)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.androidx.junit)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
    debugImplementation(libs.androidx.compose.ui.tooling)
}